import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      colors: {
        // ── Sidereus background scale ──────────────────────────────
        void: '#050608',
        abyss: '#0B0E13',
        depths: '#11151C',
        surface: {
          DEFAULT: '#151B24',
          mid: '#1A2230',
          high: '#202B3A',
          elevated: '#263040',
        },
        // ── Monet accent palette ──────────────────────────────────
        lavender: { DEFAULT: '#B5A6D8', dim: '#7A6EA8', faint: '#4A426A' },
        'morning-blue': { DEFAULT: '#8FA9D8', dim: '#5C7AB0', faint: '#3A4F72' },
        indigo: { DEFAULT: '#5E6FA3', dim: '#3E4F7A', faint: '#252E4A' },
        gold: { DEFAULT: '#E0B96A', dim: '#A07C3A', faint: '#4A3820' },
        peach: { DEFAULT: '#E4B8A0', dim: '#9C6F55', faint: '#4A2F22' },
        fog: { DEFAULT: '#F4F4F2', dim: '#C8C8C4', faint: '#888884' },
        // ── Semantic ──────────────────────────────────────────────
        border: 'rgba(255,255,255,0.07)',
        input: 'rgba(255,255,255,0.06)',
        ring: '#5E6FA3',
        background: '#0B0E13',
        foreground: '#F4F4F2',
        primary: {
          DEFAULT: '#B5A6D8',
          foreground: '#050608',
        },
        secondary: {
          DEFAULT: '#1A2230',
          foreground: '#C8C8C4',
        },
        destructive: {
          DEFAULT: '#7F3A3A',
          foreground: '#F4F4F2',
        },
        muted: {
          DEFAULT: '#151B24',
          foreground: '#888884',
        },
        accent: {
          DEFAULT: '#202B3A',
          foreground: '#F4F4F2',
        },
        popover: {
          DEFAULT: '#151B24',
          foreground: '#F4F4F2',
        },
        card: {
          DEFAULT: '#151B24',
          foreground: '#F4F4F2',
        },
        // ── Research-specific ────────────────────────────────────
        bull: '#6AA87A',
        'bull-dim': '#3A6847',
        bear: '#A86A6A',
        'bear-dim': '#6A3A3A',
        neutral: '#8FA9D8',
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        glass: '0 4px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
        'glass-hover': '0 8px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
        glow: '0 0 40px rgba(181,166,216,0.12)',
        'glow-blue': '0 0 40px rgba(143,169,216,0.12)',
        'glow-gold': '0 0 40px rgba(224,185,106,0.12)',
      },
      backdropBlur: {
        xs: '2px',
        glass: '16px',
        heavy: '32px',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'aurora': 'aurora 12s ease-in-out infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        aurora: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        'monet-gradient': 'linear-gradient(180deg, #050608 0%, #0B0E13 40%, #11151C 100%)',
        shimmer: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
