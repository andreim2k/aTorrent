import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUIStore } from '../../stores/uiStore.js';
import { useAuth } from '../../hooks/useAuth.js';

export function TopBar() {
  const { searchQuery, setSearchQuery, setShowAddModal, setShowSettingsModal, toggleSidebar, selectionMode, setSelectionMode } = useUIStore();
  const { username, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  // Position dropdown relative to button
  useEffect(() => {
    if (userMenuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    }
  }, [userMenuOpen]);

  // Close menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler, true);
    return () => document.removeEventListener('mousedown', handler, true);
  }, [userMenuOpen]);

  return (
    <header className="h-14 glass border-b border-white/[0.06] flex items-center gap-3 px-4 max-md:px-2 max-md:gap-2">
      {/* Sidebar toggle */}
      <button
        onClick={toggleSidebar}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition-all"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Search */}
      <div className="flex-1 max-w-lg">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search torrents..."
            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg pl-9 pr-3 py-1.5 text-sm
              placeholder:text-white/20 focus:outline-none focus:border-accent-indigo/30 focus:bg-white/[0.06] transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Selection mode toggle */}
        <button
          onClick={() => setSelectionMode(!selectionMode)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
            selectionMode
              ? 'bg-accent-indigo/20 text-accent-indigo'
              : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
          }`}
          title={selectionMode ? 'Exit selection' : 'Select torrents'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        </button>

        {/* Add button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-accent-indigo to-accent-purple
            text-sm font-medium hover:brightness-110 active:brightness-90 transition-all max-md:px-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="max-md:hidden">Add</span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-white/[0.08] mx-1 max-md:hidden" />

        {/* User menu */}
        <div className="max-md:hidden">
          <button
            ref={buttonRef}
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-all group"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-indigo to-accent-purple flex items-center justify-center text-xs font-semibold uppercase">
              {username?.charAt(0) || '?'}
            </div>
            <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors hidden sm:block">
              {username}
            </span>
            <svg className="text-white/30" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Dropdown via portal */}
          {userMenuOpen && createPortal(
            <div
              ref={menuRef}
              className="fixed w-48 glass rounded-xl py-1.5 shadow-2xl shadow-black/40 z-[100]"
              style={{ top: menuPos.top, right: menuPos.right }}
            >
              <div className="px-3 py-2 border-b border-white/[0.06]">
                <p className="text-sm font-medium text-white/80">{username}</p>
                <p className="text-xs text-white/30">Administrator</p>
              </div>
              <button
                onClick={() => { setShowSettingsModal(true); setUserMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-white/60 hover:text-white/90 hover:bg-white/[0.04] transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Settings
              </button>
              <div className="border-t border-white/[0.06] mt-1 pt-1">
                <button
                  onClick={() => { logout(); setUserMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/[0.06] transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>
    </header>
  );
}
