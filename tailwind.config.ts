import type { Config } from 'tailwindcss';

export default {
  content: ['./src/client/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: '#0a0a0f',
          50: '#12121a',
          100: '#1a1a25',
          200: '#232330',
        },
        accent: {
          indigo: '#6366f1',
          purple: '#a855f7',
          pink: '#ec4899',
        },
        status: {
          downloading: '#3b82f6',
          seeding: '#22c55e',
          paused: '#f59e0b',
          error: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono Variable', 'JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
