/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base:           'rgb(var(--sf-base) / <alpha-value>)',
        surface:        'rgb(var(--sf-surface) / <alpha-value>)',
        card:           'rgb(var(--sf-card) / <alpha-value>)',
        accent:         'rgb(var(--sf-accent) / <alpha-value>)',
        'accent-hover': 'rgb(var(--sf-accent-hover) / <alpha-value>)',
        muted:          'rgb(var(--sf-text-muted) / <alpha-value>)',
        subtle:         'rgb(var(--sf-overlay) / var(--sf-subtle-alpha))',
        secondary:      'rgb(var(--sf-text-secondary) / <alpha-value>)',
        foreground:     'rgb(var(--sf-text) / <alpha-value>)',
        overlay:        'rgb(var(--sf-overlay) / <alpha-value>)',
        danger:         'rgb(var(--sf-danger) / <alpha-value>)',
        success:        'rgb(var(--sf-success) / <alpha-value>)',
        border:         'rgb(var(--sf-overlay) / var(--sf-border-alpha))',
        'border-light': 'rgb(var(--sf-overlay) / var(--sf-border-light-alpha))',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': 'var(--sf-card-radius)',
      },
      animation: {
        'shimmer':  'shimmer 2s ease-in-out infinite',
        'fade-in':  'fadeIn 0.3s ease-out both',
        'slide-up': 'slideUp 0.3s ease-out both',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
