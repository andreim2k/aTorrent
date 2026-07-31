import { useEffect, useRef, useState } from 'react';
import { useUIStore } from '../../stores/uiStore.js';
import { usePreferencesStore, FONT_SCALE_BOUNDS } from '../../stores/preferencesStore.js';
import { useAuth } from '../../hooks/useAuth.js';

export function TopBar() {
  const {
    searchQuery, setSearchQuery, setShowAddModal, setShowSettingsModal,
    toggleSidebar, selectionMode, setSelectionMode,
  } = useUIStore();
  const { fontScale, increaseFontScale, decreaseFontScale, resetFontScale, fxEnabled, toggleFx } = usePreferencesStore();
  const { username, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  // Dismiss the user menu on outside click / Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (event: MouseEvent) => {
      if (!userRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

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
        <button
          className={`holo-icon-btn ${selectionMode ? 'is-active' : ''}`}
          onClick={() => setSelectionMode(!selectionMode)}
          title="Selection mode"
          aria-label="Selection mode"
          aria-pressed={selectionMode}
        >
          ☰
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

        <div className="holo-user" ref={userRef}>
          <button className="holo-user__btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Account menu" aria-expanded={menuOpen}>
            <span className="holo-user__dot" />
            <span>{username || 'operator'}</span>
          </button>
          {menuOpen && (
            <div className="holo-menu">
              <div className="holo-menu__head">
                <span className="holo-label">Operator</span>
                <strong style={{ fontSize: '.75rem' }}>{username}</strong>
              </div>
              <button className="holo-menu__item" onClick={() => { setShowSettingsModal(true); setMenuOpen(false); }}>
                Preferences
              </button>
              <button className="holo-menu__item is-danger" onClick={() => { logout(); setMenuOpen(false); }}>
                End session
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
