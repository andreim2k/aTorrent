import type { Config } from 'tailwindcss';

/**
 * The interface is styled by the HOLO design system in src/client/styles/globals.css.
 * Tailwind is retained only for its preflight reset; design tokens live in CSS
 * custom properties so a single source of truth drives the console.
 */
export default {
  content: ['./src/client/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
