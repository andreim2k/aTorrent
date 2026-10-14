import type { Config } from 'tailwindcss';

export default {
  content: ['./src/client/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: '#07070b',
          50: '#0d0d14',
          100: '#13131c',
          200: '#1b1b27',
        },
        accent: {
          indigo: '#6366f1',
          purple: '#a855f7',
          pink: '#ec4899',
          cyan: '#38bdf8',
        },
        status: {
          downloading: '#38bdf8',
          seeding: '#34d399',
          paused: '#fbbf24',
          error: '#fb7185',
        },
      },
      fontFamily: {
        sans: ['Geist', 'Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'glow-indigo': '0 0 28px -4px rgba(99,102,241,0.55)',
        'glow-cyan': '0 0 28px -4px rgba(56,189,248,0.5)',
        float: '0 24px 60px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'blob-a': 'blob-a 28s ease-in-out infinite',
        'blob-b': 'blob-b 34s ease-in-out infinite',
        'blob-c': 'blob-c 40s ease-in-out infinite',
        sheen: 'sheen 2.2s linear infinite',
        'ping-slow': 'ping-slow 2.4s cubic-bezier(0,0,0.2,1) infinite',
      },
      keyframes: {
        'glow-pulse': { '0%, 100%': { opacity: '0.6' }, '50%': { opacity: '1' } },
        'blob-a': {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(12vw, 10vh) scale(1.15)' },
        },
        'blob-b': {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(-14vw, -8vh) scale(1.2)' },
        },
        'blob-c': {
          '0%, 100%': { transform: 'translate(0,0) scale(1.1)' },
          '50%': { transform: 'translate(8vw, -12vh) scale(0.95)' },
        },
        sheen: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(250%)' } },
        'ping-slow': { '75%, 100%': { transform: 'scale(2.4)', opacity: '0' } },
      },
    },
  },
  plugins: [],
} satisfies Config;
