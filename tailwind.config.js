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
        /* Variable fonts from @fontsource-variable, self-hosted.
           'Inter Fallback' and 'Jakarta Fallback' are size-adjusted
           system-font aliases defined in index.css to prevent CLS. */
        sans: ['"Inter Variable"', '"Inter Fallback"', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans Variable"', '"Jakarta Fallback"', '"Inter Variable"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: 'var(--shadow-glass)',
        'glass-hover': 'var(--shadow-glass-hover)',
        'accent-glow': 'var(--shadow-accent)',
      },
      backgroundSize: {
        grid: '32px 32px',
      },
      transitionDuration: {
        250: '250ms',
      },
    },
  },
  plugins: [],
};
