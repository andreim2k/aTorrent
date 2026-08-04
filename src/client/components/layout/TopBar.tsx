import { useUIStore } from '../../stores/uiStore.js';
import { usePreferencesStore, FONT_SCALE_BOUNDS } from '../../stores/preferencesStore.js';

export function TopBar() {
  const {
    searchQuery, setSearchQuery, setShowAddModal, setShowSettingsModal,
    toggleSidebar, selectionMode, setSelectionMode,
  } = useUIStore();
  const { fontScale, increaseFontScale, decreaseFontScale, resetFontScale, fxEnabled, toggleFx } = usePreferencesStore();

  return (
    <header className="holo-topbar">
      <button className="holo-icon-btn" onClick={toggleSidebar} title="Toggle navigation" aria-label="Toggle navigation">
        ☰
      </button>

      <div className="holo-crumb holo-label">
        <span>Console</span>
        <span className="holo-crumb__sep">/</span>
        <span className="holo-crumb__here">Transfers</span>
      </div>

      <label className="holo-search">
        <span className="holo-search__icon">⌕</span>
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Filter transfers…"
          aria-label="Filter transfers"
        />
      </label>

      <div className="holo-actions">
        {/* Distinct from the rail toggle: a ticked box, not a second ☰. */}
        <button
          className={`holo-icon-btn ${selectionMode ? 'is-active' : ''}`}
          onClick={() => setSelectionMode(!selectionMode)}
          title={selectionMode ? 'Leave selection mode' : 'Select transfers'}
          aria-label="Selection mode"
          aria-pressed={selectionMode}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10.5" />
            <polyline points="8.5 11.5 12 15 21.5 4.5" />
          </svg>
        </button>

        {/* FX — ambient motion toggle. Icon animates into a live equaliser when engaged. */}
        <button
          className={`holo-icon-btn ${fxEnabled ? 'is-active' : ''}`}
          onClick={toggleFx}
          title={`Cinematic FX ${fxEnabled ? 'on' : 'off'}`}
          aria-label="Toggle cinematic effects"
          aria-pressed={fxEnabled}
        >
          <span className="holo-fx-bars" aria-hidden="true"><i /><i /><i /><i /></span>
        </button>

        <div className="holo-seg" aria-label="Text size">
          <button onClick={decreaseFontScale} disabled={fontScale <= FONT_SCALE_BOUNDS.min} title="Smaller text" aria-label="Smaller text">−</button>
          <button
            className="holo-seg__val"
            onClick={resetFontScale}
            title="Reset text size"
            aria-label={`Reset text size, currently ${Math.round(fontScale * 100)} percent`}
          >
            {Math.round(fontScale * 100)}
          </button>
          <button onClick={increaseFontScale} disabled={fontScale >= FONT_SCALE_BOUNDS.max} title="Larger text" aria-label="Larger text">+</button>
        </div>

        <button className="holo-icon-btn" onClick={() => setShowSettingsModal(true)} title="Settings" aria-label="Settings">
          ⚙
        </button>

        <button className="holo-btn holo-btn--primary" onClick={() => setShowAddModal(true)} title="Add torrent">
          <span aria-hidden="true">+</span>
          <span className="label">Add Torrent</span>
        </button>
      </div>
    </header>
  );
}
