/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: {
          50:  '#f5f5f6',
          100: '#e6e6e8',
          200: '#cfcfd3',
          300: '#adaeb4',
          400: '#84858f',
          500: '#696a74',
          600: '#595a63',
          700: '#4c4d55',
          800: '#424349',
          900: '#3a3b41',
          925: '#27282e',
          950: '#18181c',
          975: '#0d0e11',
        },
        acid: {
          DEFAULT: '#c6f135',
          dark:    '#a8d020',
          light:   '#d4f85e',
        },
        coral: {
          DEFAULT: '#ff5c5c',
          dark:    '#e04545',
          light:   '#ff7e7e',
        },
        sky: {
          slicer: '#38bdf8',
        },
      },
      fontFamily: {
        mono:    ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        display: ['"Space Grotesk"', 'sans-serif'],
        body:    ['"DM Sans"', 'sans-serif'],
      },
      animation: {
        'pulse-slow':  'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up':    'slideUp 0.25s ease-out',
        'fade-in':     'fadeIn 0.35s ease-out',
        'enter-up':    'enterUp 0.2s ease-out',
        'scale-in':    'scaleIn 0.15s ease-out',
        'shimmer':     'shimmer 1.8s linear infinite',
        'spin-slow':   'spin 2s linear infinite',
        'grid-draw':   'gridDraw 0.5s ease-out',
        'pop':         'pop 0.2s cubic-bezier(0.34,1.56,0.64,1)',
      },
      keyframes: {
        slideUp: {
          '0%':   { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        enterUp: {
          '0%':   { transform: 'translateY(6px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',   opacity: '1' },
        },
        scaleIn: {
          '0%':   { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        gridDraw: {
          '0%':   { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        pop: {
          '0%':   { transform: 'scale(0.9)',  opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
      },
      backgroundImage: {
        'grid-pattern': [
          'linear-gradient(rgba(198,241,53,0.04) 1px, transparent 1px)',
          'linear-gradient(90deg, rgba(198,241,53,0.04) 1px, transparent 1px)',
        ].join(', '),
        'shimmer-gradient': [
          'linear-gradient(90deg,',
          'transparent 0%,',
          'rgba(255,255,255,0.06) 50%,',
          'transparent 100%)',
        ].join(' '),
      },
      boxShadow: {
        'glow-acid':    '0 0 20px rgba(198,241,53,0.25)',
        'glow-acid-lg': '0 0 40px rgba(198,241,53,0.35)',
        'glow-acid-sm': '0 0 8px  rgba(198,241,53,0.20)',
        'card':         '0 1px 3px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.3)',
        'card-lg':      '0 4px 16px rgba(0,0,0,0.5)',
        'inner-bright': 'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
    },
  },
  plugins: [],
}
