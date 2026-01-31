export interface Torrent {
  infoHash: string;
  name: string;
  magnet?: string;
  savePath: string;
  categoryId?: number;
  status: 'downloading' | 'seeding' | 'paused' | 'error' | 'queued' | 'checking';
  totalSize: number;
  downloaded: number;
  uploaded: number;
  addedAt: string;
  completedAt?: string;
  tmdbId?: number;
  mediaType?: 'movie' | 'tv';
  downloadSpeed: number;
  uploadSpeed: number;
  progress: number;
  numPeers: number;
  timeRemaining?: number;
  files?: TorrentFile[];
}

export interface TorrentFile {
  index: number;
  name: string;
  length: number;
  downloaded: number;
}

export interface Category {
  id: number;
  name: string;
  savePath?: string;
}

export interface TMDBResult {
  tmdbId: number;
  title: string;
  year: string;
  posterPath?: string;
  mediaType: 'movie' | 'tv';
  overview?: string;
  voteAverage?: number;
  backdropPath?: string;
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface TMDBDetails {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  runtime?: number;
  number_of_seasons?: number;
  genres: { id: number; name: string }[];
  release_date?: string;
  first_air_date?: string;
  credits?: {
    cast: TMDBCastMember[];
  };
  images?: {
    backdrops: { file_path: string }[];
  };
}

export interface WSMessage {
  type: string;
  data: any;
}

export type FilterStatus = 'all' | 'downloading' | 'seeding' | 'paused' | 'completed' | 'error';
