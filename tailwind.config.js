/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* All colours reference CSS custom properties for theming.
           Usage:  bg-surface  text-accent/50  border-glass/10  etc. */
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          elevated: 'rgb(var(--surface-elevated) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
        },
        heading: 'rgb(var(--heading) / <alpha-value>)',
        body: 'rgb(var(--body) / <alpha-value>)',
        subtle: 'rgb(var(--subtle) / <alpha-value>)',
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          dim: 'rgb(var(--muted-dim) / <alpha-value>)',
        },
        glass: 'rgb(var(--glass) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        18: '4.5rem',
      },
      boxShadow: {
        glass: 'var(--shadow-glass)',
        'glass-hover': 'var(--shadow-glass-hover)',
        'accent-glow': 'var(--shadow-accent)',
        float: 'var(--shadow-float)',
      },
      backgroundSize: {
        grid: '32px 32px',
      },
      transitionDuration: {
        250: '250ms',
        350: '350ms',
      },
    },
  },
  plugins: [],
};
