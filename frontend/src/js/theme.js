/**
 * Theme Management Utility
 * Handles dark/light theme switching with localStorage persistence
 */

class ThemeManager {
  constructor() {
    this.THEME_KEY = 'torrent-app-theme';
    this.DARK_THEME = 'dark';
    this.LIGHT_THEME = 'light';
    this.SYSTEM_THEME = 'system';

    this.init();
  }

  /**
   * Initialize theme manager
   * Detects saved preference or uses system preference
   */
  init() {
    const savedTheme = this.getSavedTheme();
    const theme = savedTheme || this.getSystemTheme();
    this.setTheme(theme, false);
  }

  /**
   * Get theme from localStorage
   */
  getSavedTheme() {
    return localStorage.getItem(this.THEME_KEY);
  }

  /**
   * Detect system theme preference
   */
  getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return this.DARK_THEME;
    }
    return this.LIGHT_THEME;
  }

  /**
   * Set theme and save to localStorage
   * @param {string} theme - 'dark' or 'light'
   * @param {boolean} persist - Whether to save to localStorage
   */
  setTheme(theme, persist = true) {
    if (![this.DARK_THEME, this.LIGHT_THEME].includes(theme)) {
      theme = this.getSystemTheme();
    }

    document.documentElement.setAttribute('data-theme', theme);

    if (persist) {
      localStorage.setItem(this.THEME_KEY, theme);
    }

    // Dispatch custom event for components to listen
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  }

  /**
   * Toggle between dark and light themes
   */
  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === this.DARK_THEME ? this.LIGHT_THEME : this.DARK_THEME;
    this.setTheme(newTheme);
  }

  /**
   * Get current theme
   */
  getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || this.getSystemTheme();
  }

  /**
   * Check if dark theme is active
   */
  isDarkTheme() {
    return this.getCurrentTheme() === this.DARK_THEME;
  }

  /**
   * Listen for theme changes
   * @param {function} callback - Function to call when theme changes
   */
  onThemeChange(callback) {
    window.addEventListener('themechange', (e) => callback(e.detail.theme));
  }

  /**
   * Listen for system theme preference changes
   */
  watchSystemTheme() {
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      darkModeQuery.addListener((e) => {
        if (!this.getSavedTheme()) {
          this.setTheme(e.matches ? this.DARK_THEME : this.LIGHT_THEME, false);
        }
      });
    }
  }
}

// Create global instance
const themeManager = new ThemeManager();
themeManager.watchSystemTheme();

// Update all theme toggle buttons when theme changes
window.addEventListener('themechange', (e) => {
  const buttons = document.querySelectorAll('.theme-toggle-btn span');
  buttons.forEach(btn => {
    btn.textContent = e.detail.theme === 'dark' ? '☀️' : '🌙';
  });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}
