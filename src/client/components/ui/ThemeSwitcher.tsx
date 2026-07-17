import { useRef } from 'react';
import { themes } from '../../lib/themes.js';
import { usePreferencesStore } from '../../stores/preferencesStore.js';

export function ThemeSwitcher() {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const { theme, setTheme } = usePreferencesStore();
  const activeTheme = themes.find((item) => item.id === theme) || themes[0];

  return (
    <details ref={detailsRef} className="theme-switcher">
      <summary title="Change terminal theme">
        <span className="theme-dot" style={{ background: activeTheme.colors[2] }} />
        <span className="theme-name">{activeTheme.name}</span>
        <span className="theme-code">{activeTheme.code}</span>
      </summary>
      <div className="theme-menu">
        <div className="theme-menu-head">
          <span>SELECT_PROFILE</span>
          <span>{themes.length} THEMES</span>
        </div>
        <div className="theme-grid">
          {themes.map((item) => (
            <button
              type="button"
              key={item.id}
              className={theme === item.id ? 'active' : ''}
              onClick={() => {
                setTheme(item.id);
                detailsRef.current?.removeAttribute('open');
              }}
            >
              <span className="theme-swatch">
                {item.colors.map((color) => <i key={color} style={{ background: color }} />)}
              </span>
              <span>{item.name}</span>
              <b>{item.code}</b>
            </button>
          ))}
        </div>
        <div className="theme-menu-foot">Theme preference persists locally.</div>
      </div>
    </details>
  );
}
