/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { lg: '480px' },
    },
    extend: {
      colors: {
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        DEFAULT: 'var(--radius)',
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'monospace'],
      },
      // Minimals-style diffused shadows — no harsh drop
      boxShadow: {
        'elevation-1': '0 0 0 0 transparent, 0 1px 2px 0 rgba(145,158,171,0.08), 0 4px 12px -2px rgba(145,158,171,0.08)',
        'elevation-2': '0 0 0 0 transparent, 0 2px 4px 0 rgba(145,158,171,0.10), 0 8px 20px -4px rgba(145,158,171,0.12)',
        'elevation-3': '0 0 0 0 transparent, 0 4px 8px 0 rgba(145,158,171,0.12), 0 16px 32px -8px rgba(145,158,171,0.16)',
      },
      transitionDuration: {
        fast: '100ms',
        base: '200ms',
      },
    },
  },
  plugins: [],
}
