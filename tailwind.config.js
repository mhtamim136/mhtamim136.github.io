/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0b0f14',
          elevated: '#0f141b',
          border: 'rgba(34, 211, 238, 0.12)',
        },
        accent: {
          DEFAULT: '#22d3ee',
          muted: 'rgba(34, 211, 238, 0.65)',
          glow: 'rgba(34, 211, 238, 0.35)',
        },
        muted: {
          DEFAULT: '#94a3b8',
          dim: '#64748b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        18: '4.5rem',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        'glass-hover':
          '0 12px 40px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(34, 211, 238, 0.2), 0 0 24px rgba(34, 211, 238, 0.08)',
        'accent-glow': '0 0 20px rgba(34, 211, 238, 0.15)',
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(rgba(34, 211, 238, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.03) 1px, transparent 1px)',
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
