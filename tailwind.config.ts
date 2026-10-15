import type { Config } from 'tailwindcss';
import tailwindcssRtl from 'tailwindcss-rtl';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: 'var(--color-navy)',
          'navy-deep': 'var(--color-navy-deep)',
          teal: 'var(--color-teal)',
          blue: 'var(--color-blue)',
        },
        surface: {
          app: 'var(--color-bg-app)',
          card: 'var(--color-card)',
          border: 'var(--color-border)',
          divider: 'var(--color-divider)',
          hover: 'var(--color-surface-hover)',
          input: 'var(--color-surface-input)',
        },
        text: {
          DEFAULT: 'var(--color-text)',
          primary: 'var(--color-text)',
          secondary: 'var(--color-text-2)',
          muted: 'var(--color-muted)',
        },
        status: {
          ok: {
            bg: 'var(--color-ok-bg)',
            fg: 'var(--color-ok-fg)',
          },
          warn: {
            bg: 'var(--color-warn-bg)',
            fg: 'var(--color-warn-fg)',
          },
          danger: {
            bg: 'var(--color-danger-bg)',
            fg: 'var(--color-danger-fg)',
          },
          info: {
            bg: 'var(--color-info-bg)',
            fg: 'var(--color-info-fg)',
          },
        },
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(16, 40, 80, 0.06), 0 8px 24px rgba(16, 40, 80, 0.05)',
      },
      fontFamily: {
        sans: ['Tajawal', 'system-ui', '-apple-system', 'sans-serif'],
      },
      spacing: {
        sidebar: '248px',
        topbar: '64px',
      },
    },
  },
  plugins: [tailwindcssRtl],
};

export default config;
