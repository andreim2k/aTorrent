from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import requests
import os
import re
from datetime import datetime
import libtorrent as lt

from app.api.deps import get_authenticated, get_db
from app.models.settings import AppSettings
from app.models.torrent import Torrent
from app.services.torrent_service import TorrentService

router = APIRouter()

TMDB_BASE_URL = "https://api.themoviedb.org/3"


def get_tmdb_api_key(db: Session) -> str:
    """Get TMDB API key from settings"""
    settings = db.query(AppSettings).first()
    if settings and settings.tmdb_api_key:
        return settings.tmdb_api_key
    return ""


def get_torrent_by_id(db: Session, torrent_id: str) -> Optional[Torrent]:
    """Get torrent from database by ID"""
    try:
        torrent_id_int = int(torrent_id)
        return db.query(Torrent).filter(Torrent.id == torrent_id_int).first()
    except ValueError:
        return None


def get_torrent_service() -> Optional[TorrentService]:
    """Get the global torrent service instance"""
    # This should be injected, but for now we'll access it from the global app state
    try:
        from app.main import torrent_service

        return torrent_service
    except ImportError:
        return None


@router.get("/torrents/{torrent_id}/content")
async def get_torrent_content(
    torrent_id: str,
    authenticated: bool = Depends(get_authenticated),
    db: Session = Depends(get_db),
):
    """Get REAL torrent file content/structure from libtorrent"""
    try:
        # Get real torrent from database
        torrent = get_torrent_by_id(db, torrent_id)
        if not torrent:
            raise HTTPException(status_code=404, detail="Torrent not found")

        # Get torrent service
        torrent_service = get_torrent_service()
        if not torrent_service:
            raise HTTPException(status_code=503, detail="Torrent service not available")

        # Get the real torrent handle from libtorrent
        if torrent.info_hash not in torrent_service.handles:
            raise HTTPException(status_code=404, detail="Torrent not active in client")

        handle = torrent_service.handles[torrent.info_hash]
        if not handle.is_valid():
            raise HTTPException(status_code=404, detail="Invalid torrent handle")

        # Get REAL file information from libtorrent
        torrent_info = handle.torrent_file()
        if not torrent_info:
            raise HTTPException(status_code=404, detail="Torrent info not available")

        files = []
        total_size = 0

        # Get real file information from libtorrent
        file_storage = torrent_info.files()
        status = handle.status()

        for i in range(file_storage.num_files()):
            file_entry = file_storage.at(i)
            file_path = file_storage.file_path(i)
            file_size = file_storage.file_size(i)

            # Get file progress (this is real data from libtorrent)
            file_progress = 0.0
            if status.total_done > 0:
                # Note: Getting per-file progress requires file_progress() call
                try:
                    file_progresses = handle.file_progress()
                    if i < len(file_progresses):
                        file_progress = (
                            file_progresses[i] / file_size if file_size > 0 else 0.0
                        )
                except:
                    # Fallback to overall progress
                    file_progress = status.progress

            # Get file priority (real data)
            try:
                priorities = handle.file_priorities()
                priority = priorities[i] if i < len(priorities) else 1
                priority_name = (
                    "high" if priority >= 4 else "normal" if priority >= 1 else "skip"
                )
            except:
                priority_name = "normal"

            # Determine file type based on extension
            file_name = os.path.basename(file_path)
            file_ext = os.path.splitext(file_name)[1].lower()

            if file_ext in [
                ".mkv",
                ".mp4",
                ".avi",
                ".mov",
                ".wmv",
                ".flv",
                ".webm",
                ".m4v",
            ]:
                file_type = "video"
            elif file_ext in [".srt", ".ass", ".ssa", ".sub", ".idx", ".vtt"]:
                file_type = "subtitle"
            elif file_ext in [".nfo", ".txt", ".md", ".readme"]:
                file_type = "info"
            else:
                file_type = "other"

            files.append(
                {
                    "name": file_name,
                    "size": file_size,
                    "path": file_path,
                    "priority": priority_name,
                    "progress": min(
                        1.0, max(0.0, file_progress)
                    ),  # Clamp between 0 and 1
                    "type": file_type,
                    "extension": file_ext.lstrip("."),
                }
            )

            total_size += file_size

        # Group files by type for better organization
        file_groups = {
            "video": [f for f in files if f["type"] == "video"],
            "subtitle": [f for f in files if f["type"] == "subtitle"],
            "info": [f for f in files if f["type"] == "info"],
            "other": [f for f in files if f["type"] == "other"],
        }

        content = {
            "files": files,
            "file_groups": file_groups,
            "total_files": len(files),
            "total_size": total_size,
            "video_files": len(file_groups["video"]),
            "subtitle_files": len(file_groups["subtitle"]),
            "largest_file": max(files, key=lambda x: x["size"]) if files else None,
            "progress_summary": {
                "completed_files": len([f for f in files if f["progress"] >= 0.99]),
                "partial_files": len([f for f in files if 0.01 < f["progress"] < 0.99]),
                "pending_files": len([f for f in files if f["progress"] <= 0.01]),
            },
        }

        return content

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get torrent content: {str(e)}"
        )


def extract_movie_info_from_name(torrent_name: str) -> Dict[str, Any]:
    """Enhanced movie title and year extraction from torrent name"""
    # Remove common torrent scene group suffixes
    name_clean = re.sub(r"-[A-Z0-9]{3,}$", "", torrent_name)

    # Common patterns in torrent names (ordered by specificity)
    patterns = [
        r"^(.+?)[\.\s]+(\d{4})[\.\s]+.*?(?:1080p|720p|2160p|4K|BluRay|WEB-DL|HDTV|DVDRip|BRRip)",
        r"^(.+?)\s*\[(\d{4})\]",  # Title [Year]
        r"^(.+?)[\.\s]+\((\d{4})\)",  # Title (Year)
        r"^(.+?)[\.\s]+(\d{4})[\.\s]",  # Title.Year.
        r"^(.+?)\.(\d{4})\.",  # Title.Year.
        r"^(.+?)\s+(\d{4})\s+",  # Title Year (space)
    ]

    for pattern in patterns:
        match = re.search(pattern, name_clean, re.IGNORECASE)
        if match:
            title = re.sub(r"[\.\s_]+", " ", match.group(1)).strip()
            year = match.group(2)

            # Clean up title further
            title = re.sub(
                r"\b(PROPER|REPACK|INTERNAL|LIMITED|EXTENDED|"
                + r"DIRECTORS?|CUT|UNRATED|UNCUT)\b",
                "",
                title,
                flags=re.IGNORECASE,
            ).strip()

            return {"title": title, "year": year, "original_name": torrent_name}

    # Fallback: clean the name and extract year if possible
    title = re.sub(r"[\.\s_]+", " ", torrent_name).strip()
    title = re.sub(
        r"\b(720p|1080p|2160p|4K|BluRay|WEB-DL|HDTV|DVDRip|"
        + r"BRRip|x264|x265|h264|h265).*",
        "",
        title,
        flags=re.IGNORECASE,
    ).strip()

    # Try to find year in the cleaned title
    year_match = re.search(r"\b(19|20)\d{2}\b", title)
    year = year_match.group(0) if year_match else None
    if year:
        title = re.sub(r"\b" + re.escape(year) + r"\b", "", title).strip()

    return {"title": title, "year": year, "original_name": torrent_name}


@router.get("/torrents/{torrent_id}/movie-info")
async def get_movie_info(
    torrent_id: str,
    authenticated: bool = Depends(get_authenticated),
    db: Session = Depends(get_db),
):
    """Get REAL movie information from TMDB - NO MOCK DATA"""
    try:
        # Get TMDB API key from settings
        tmdb_api_key = get_tmdb_api_key(db)

        # Get real torrent from database
        torrent = get_torrent_by_id(db, torrent_id)
        if not torrent:
            raise HTTPException(status_code=404, detail="Torrent not found")

        torrent_name = torrent.name

        # Extract movie title and year from real torrent name
        movie_info = extract_movie_info_from_name(torrent_name)

        # REQUIRE valid TMDB API key - no fallback to mock data
        if not tmdb_api_key or len(tmdb_api_key.strip()) == 0:
            return {
                "found": False,
                "error": "TMDB API key not configured",
                "message": "Please configure your TMDB API key in Settings to get movie information",
                "extracted_info": movie_info,
                "torrent_name": torrent_name,
            }

        try:
            # Search TMDB for the movie using the real extracted info
            search_url = f"{TMDB_BASE_URL}/search/movie"
            search_params = {
                "api_key": tmdb_api_key,
                "query": movie_info["title"],
                "include_adult": False,
            }

            if movie_info.get("year"):
                search_params["year"] = movie_info["year"]

            response = requests.get(search_url, params=search_params, timeout=10)

            if response.status_code == 401:
                return {
                    "found": False,
                    "error": "Invalid TMDB API key",
                    "message": "The TMDB API key is invalid. Please check your settings.",
                    "extracted_info": movie_info,
                    "torrent_name": torrent_name,
                }

            if response.status_code != 200:
                return {
                    "found": False,
                    "error": f"TMDB API error: {response.status_code}",
                    "message": "Failed to connect to TMDB API",
                    "extracted_info": movie_info,
                    "torrent_name": torrent_name,
                }

            search_results = response.json()

            if not search_results.get("results"):
                return {
                    "found": False,
                    "extracted_info": movie_info,
                    "torrent_name": torrent_name,
                    "search_query": movie_info["title"],
                    "message": f"No TMDB results found for '{movie_info['title']}'",
                }

            # Get the first result (most relevant)
            movie = search_results["results"][0]
            movie_id = movie["id"]

            # Get detailed movie information from TMDB
            formatted_info = await get_detailed_movie_info(
                movie_id, tmdb_api_key, movie_info, torrent_name
            )
            return formatted_info

        except requests.RequestException as e:
            return {
                "found": False,
                "error": f"TMDB API connection error: {str(e)}",
                "message": "Failed to connect to TMDB API",
                "extracted_info": movie_info,
                "torrent_name": torrent_name,
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


async def get_detailed_movie_info(
    movie_id: int, api_key: str, movie_info: Dict, torrent_name: str
) -> Dict:
    """Get detailed information for a movie from TMDB - REAL DATA ONLY"""
    details_url = f"{TMDB_BASE_URL}/movie/{movie_id}"
    details_params = {
        "api_key": api_key,
        "append_to_response": "credits,videos,release_dates,keywords,similar,reviews",
    }

    details_response = requests.get(details_url, params=details_params, timeout=10)

    if details_response.status_code != 200:
        return {
            "found": False,
            "error": f"Failed to get movie details (status {details_response.status_code})",
            "extracted_info": movie_info,
            "torrent_name": torrent_name,
        }

    movie_details = details_response.json()

    # Format the comprehensive response with REAL TMDB data
    formatted_info = {
        "found": True,
        "tmdb_id": movie_id,
        "title": movie_details.get("title"),
        "original_title": movie_details.get("original_title"),
        "release_date": movie_details.get("release_date"),
        "overview": movie_details.get("overview"),
        "runtime": movie_details.get("runtime"),
        "budget": movie_details.get("budget"),
        "revenue": movie_details.get("revenue"),
        "status": movie_details.get("status"),
        "tagline": movie_details.get("tagline"),
        "genres": [genre["name"] for genre in movie_details.get("genres", [])],
        "production_companies": [
            company["name"]
            for company in movie_details.get("production_companies", [])[:3]
        ],
        "production_countries": [
            country["name"] for country in movie_details.get("production_countries", [])
        ],
        "spoken_languages": [
            lang["english_name"] for lang in movie_details.get("spoken_languages", [])
        ],
        "vote_average": movie_details.get("vote_average"),
        "vote_count": movie_details.get("vote_count"),
        "popularity": movie_details.get("popularity"),
        "poster_path": (
            f"https://image.tmdb.org/t/p/w500{movie_details['poster_path']}"
            if movie_details.get("poster_path")
            else None
        ),
        "backdrop_path": (
            f"https://image.tmdb.org/t/p/w1280{movie_details['backdrop_path']}"
            if movie_details.get("backdrop_path")
            else None
        ),
        "homepage": movie_details.get("homepage"),
        "imdb_id": movie_details.get("imdb_id"),
        "director": None,
        "cast": [],
        "crew": [],
        "trailers": [],
        "keywords": [],
        "similar_movies": [],
        "reviews": [],
        "extracted_info": movie_info,
        "torrent_name": torrent_name,
        "is_real_data": True,  # This is real TMDB data
    }

    # Extract cast and crew from credits
    if "credits" in movie_details:
        crew = movie_details["credits"].get("crew", [])
        cast = movie_details["credits"].get("cast", [])

        # Find director(s)
        directors = [
            person["name"] for person in crew if person.get("job") == "Director"
        ]
        formatted_info["director"] = ", ".join(directors) if directors else None

        # Get top cast members
        formatted_info["cast"] = [
            {
                "name": actor.get("name"),
                "character": actor.get("character"),
                "profile_path": (
                    f"https://image.tmdb.org/t/p/w185{actor['profile_path']}"
                    if actor.get("profile_path")
                    else None
                ),
                "order": actor.get("order", 999),
            }
            for actor in cast[:10]  # Top 10 cast members
        ]

        # Get key crew members
        key_jobs = [
            "Director",
            "Producer",
            "Executive Producer",
            "Writer",
            "Screenplay",
            "Director of Photography",
            "Original Music Composer",
        ]
        formatted_info["crew"] = [
            {
                "name": person.get("name"),
                "job": person.get("job"),
                "department": person.get("department"),
                "profile_path": (
                    f"https://image.tmdb.org/t/p/w185{person['profile_path']}"
                    if person.get("profile_path")
                    else None
                ),
            }
            for person in crew
            if person.get("job") in key_jobs
        ][
            :15
        ]  # Limit to 15 crew members

    # Extract trailers and videos
    if "videos" in movie_details:
        videos = movie_details["videos"].get("results", [])
        formatted_info["trailers"] = [
            {
                "name": video.get("name"),
                "key": video.get("key"),
                "site": video.get("site"),
                "type": video.get("type"),
                "official": video.get("official", False),
                "url": (
                    f"https://www.youtube.com/watch?v={video['key']}"
                    if video.get("site") == "YouTube"
                    else None
                ),
            }
            for video in videos
            if video.get("type") in ["Trailer", "Teaser", "Clip"]
        ][
            :5
        ]  # Top 5 videos

    # Extract keywords
    if "keywords" in movie_details:
        keywords = movie_details["keywords"].get("keywords", [])
        formatted_info["keywords"] = [kw["name"] for kw in keywords[:10]]

    # Extract similar movies
    if "similar" in movie_details:
        similar = movie_details["similar"].get("results", [])
        formatted_info["similar_movies"] = [
            {
                "title": movie.get("title"),
                "release_date": movie.get("release_date"),
                "vote_average": movie.get("vote_average"),
                "poster_path": (
                    f"https://image.tmdb.org/t/p/w185{movie['poster_path']}"
                    if movie.get("poster_path")
                    else None
                ),
            }
            for movie in similar[:6]  # Top 6 similar movies
        ]

    # Extract reviews
    if "reviews" in movie_details:
        reviews = movie_details["reviews"].get("results", [])
        formatted_info["reviews"] = [
            {
                "author": review.get("author"),
                "content": (
                    review.get("content", "")[:500] + "..."
                    if len(review.get("content", "")) > 500
                    else review.get("content", "")
                ),
                "rating": review.get("author_details", {}).get("rating"),
                "created_at": review.get("created_at"),
            }
            for review in reviews[:3]  # Top 3 reviews
        ]

    return formatted_info
