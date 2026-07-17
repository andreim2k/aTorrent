export const themes = [
  { id: 'phosphor', name: 'Phosphor', code: 'P1', colors: ['#07140d', '#66ff99', '#b7ffce'] },
  { id: 'vt100', name: 'VT100', code: 'V1', colors: ['#071008', '#45f56f', '#9dffae'] },
  { id: 'terminal', name: 'Terminal', code: 'T1', colors: ['#101210', '#d7e0d2', '#9aff68'] },
  { id: 'amber', name: 'Amber CRT', code: 'A1', colors: ['#160e04', '#ffb000', '#ffd36a'] },
  { id: 'codex', name: 'Codex', code: 'CX', colors: ['#0d0d0d', '#ffffff', '#10a37f'] },
  { id: 'claude', name: 'Claude', code: 'CL', colors: ['#171512', '#e8dfd3', '#d97757'] },
  { id: 'cursor', name: 'Cursor', code: 'CR', colors: ['#0f1012', '#e7e7e7', '#a78bfa'] },
  { id: 'blueush', name: 'Blueush', code: 'BL', colors: ['#07111f', '#d9ecff', '#38bdf8'] },
  { id: 'github-dark', name: 'GitHub Dark', code: 'GH', colors: ['#0d1117', '#e6edf3', '#2f81f7'] },
  { id: 'github-light', name: 'GitHub Light', code: 'GL', colors: ['#f6f8fa', '#1f2328', '#0969da'] },
  { id: 'monochrome', name: 'Monochrome', code: 'BW', colors: ['#050505', '#f4f4f4', '#a8a8a8'] },
  { id: 'dracula', name: 'Dracula', code: 'DR', colors: ['#282a36', '#f8f8f2', '#bd93f9'] },
  { id: 'nord', name: 'Nord', code: 'ND', colors: ['#2e3440', '#eceff4', '#88c0d0'] },
  { id: 'solarized', name: 'Solarized', code: 'SO', colors: ['#002b36', '#eee8d5', '#2aa198'] },
  { id: 'gruvbox', name: 'Gruvbox', code: 'GR', colors: ['#1d2021', '#ebdbb2', '#fabd2f'] },
  { id: 'matrix', name: 'Matrix', code: 'MX', colors: ['#000700', '#00ff41', '#8aff9f'] },
  { id: 'cyberpunk', name: 'Cyberpunk', code: 'CP', colors: ['#100b1b', '#f7f2ff', '#ff2a9d'] },
] as const;

export type ThemeId = (typeof themes)[number]['id'];

export const defaultTheme: ThemeId = 'phosphor';
