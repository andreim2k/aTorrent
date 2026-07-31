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
      type="button"
      onClick={() => onSelect?.(media)}
      className={`holo-file ${selected ? 'is-checked' : ''}`}
      style={{ width: '100%', gap: 12, alignItems: 'flex-start', padding: 10, margin: 0 }}
      aria-pressed={selected}
    >
      {media.posterPath ? (
        <img
          src={`${TMDB_IMG}/w92${media.posterPath}`}
          alt=""
          style={{ width: 44, height: 64, flexShrink: 0, objectFit: 'cover', borderRadius: 'var(--r)' }}
        />
      ) : (
        <span
          className="holo-empty__mark"
          style={{ width: 44, height: 64, flexShrink: 0, fontSize: '.875rem' }}
          aria-hidden="true"
        >
          ◇
        </span>
      )}
      <span style={{ minWidth: 0, textAlign: 'left' }}>
        <span className="holo-row__name" style={{ display: 'block' }}>{media.title}</span>
        <span className="holo-label" style={{ display: 'block', marginTop: 4 }}>
          {media.year} · {media.mediaType === 'tv' ? 'TV series' : 'Movie'}
        </span>
        {media.voteAverage !== undefined && (
          <span className="holo-num" style={{ display: 'block', marginTop: 4, fontSize: '.6875rem', color: 'var(--warn)' }}>
            ★ {media.voteAverage.toFixed(1)}
          </span>
        )}
      </span>
    </button>
  );
}
