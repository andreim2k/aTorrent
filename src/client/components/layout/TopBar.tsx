import { useState } from 'react';
import { useUIStore } from '../../stores/uiStore.js';
import { usePreferencesStore } from '../../stores/preferencesStore.js';
import { useAuth } from '../../hooks/useAuth.js';
import { ThemeSwitcher } from '../ui/ThemeSwitcher.js';

export function TopBar() {
  const { searchQuery, setSearchQuery, setShowAddModal, setShowSettingsModal, toggleSidebar, selectionMode, setSelectionMode } = useUIStore();
  const { fontScale, increaseFontScale, decreaseFontScale, resetFontScale, fxEnabled, toggleFx } = usePreferencesStore();
  const { username, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="terminal-topbar">
      <button className="icon-command menu-trigger" onClick={toggleSidebar} title="Toggle navigation" aria-label="Toggle navigation"><span>≡</span></button>
      <div className="topbar-context"><span>ROOT</span><b>/</b><span>HOME</span><b>/</b><strong>TRANSFERS</strong><i className="cursor-block" /></div>
      <label className="command-search">
        <span>⌕</span>
        <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="grep transfers..." aria-label="Search transfers" />
        <kbd>⌘ K</kbd>
      </label>
      <div className="topbar-actions">
        <button className={`icon-command selection-command ${selectionMode ? 'active' : ''}`} onClick={() => setSelectionMode(!selectionMode)} title="Selection mode" aria-label="Selection mode"><span>☷</span></button>
        <button className={`icon-command fx-command ${fxEnabled ? 'active' : ''}`} onClick={toggleFx} title={`Cinematic FX ${fxEnabled ? 'on' : 'off'}`} aria-label="Toggle cinematic effects" aria-pressed={fxEnabled}><span className="fx-bars" aria-hidden="true"><i /><i /><i /><i /></span></button>
        <button className="primary-command" onClick={() => setShowAddModal(true)} aria-label="Open torrent prompt" title="Open torrent prompt"><span className="tui-add-icon">{'>'}_</span><b>OPEN TORRENT</b><kbd>N</kbd></button>
        <button className="icon-command settings-command" onClick={() => setShowSettingsModal(true)} aria-label="Open settings" title="Open settings"><span>[S]</span></button>
        <div className="font-controls" aria-label="Font size controls">
          <button onClick={decreaseFontScale} disabled={fontScale <= 0.85} title="Smaller text" aria-label="Smaller text">−</button>
          <button className="font-scale" onClick={resetFontScale} title="Reset text size" aria-label={`Reset text size, currently ${Math.round(fontScale * 100)} percent`}>{Math.round(fontScale * 100)}</button>
          <button onClick={increaseFontScale} disabled={fontScale >= 1.3} title="Larger text" aria-label="Larger text">+</button>
        </div>
        <ThemeSwitcher />
        <div className="user-command">
          <button onClick={() => setUserMenuOpen(!userMenuOpen)} aria-label="User menu"><span className="user-status" /><b>{username || 'root'}</b><span className="user-caret">▾</span></button>
          {userMenuOpen && (
            <div className="user-menu">
              <p><span>USER</span><b>{username}</b></p>
              <button onClick={() => { setShowSettingsModal(true); setUserMenuOpen(false); }}><span>›</span> preferences</button>
              <button className="danger" onClick={() => { logout(); setUserMenuOpen(false); }}><span>›</span> terminate session</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
