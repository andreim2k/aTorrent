import type { TMDBResult } from '../../types/index.js';

const TMDB_IMG = 'https://image.tmdb.org/t/p';

interface Props {
  media: TMDBResult;
  onSelect?: (media: TMDBResult) => void;
  selected?: boolean;
}

export function MediaCard({ media, onSelect, selected }: Props) {
  return (
    <button
      onClick={() => onSelect?.(media)}
      className={`flex gap-3 p-2 rounded-lg text-left transition-all w-full ${
        selected ? 'glass-active' : 'hover:bg-white/[0.03]'
      }`}
    >
      {media.posterPath ? (
        <img
          src={`${TMDB_IMG}/w92${media.posterPath}`}
          alt={media.title}
          className="w-12 h-18 rounded object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-18 rounded bg-white/5 flex items-center justify-center text-white/20 flex-shrink-0">
          ◇
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{media.title}</p>
        <p className="text-xs text-white/40">
          {media.year} · {media.mediaType === 'tv' ? 'TV Series' : 'Movie'}
        </p>
        {media.voteAverage !== undefined && (
          <p className="text-xs text-amber-400 mt-0.5">★ {media.voteAverage.toFixed(1)}</p>
        )}
      </div>
    </button>
  );
}
