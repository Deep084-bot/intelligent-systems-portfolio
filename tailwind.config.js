/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Color Palette - Dark Theme with Premium Accents
      colors: {
        // Brand
        primary: {
          50: '#f0f4ff',
          100: '#e6eeff',
          200: '#c7d5ff',
          300: '#a8bcff',
          400: '#7d95ff',
          500: '#5d6eff', // Main accent - Deep blue
          600: '#4d5be6',
          700: '#3d48cc',
          800: '#2d35b3',
          900: '#1d2299',
        },
        // Accent - Cyan for AI/tech highlights
        accent: {
          50: '#f0fafb',
          100: '#e1f4f7',
          200: '#b3e5fc',
          300: '#81d4fa',
          400: '#4fc3f7',
          500: '#29b6f6', // Main cyan accent
          600: '#039be5',
          700: '#0288d1',
          800: '#0277bd',
          900: '#01579b',
        },
        // Neutral - Grays for backgrounds and borders
        neutral: {
          0: '#ffffff',
          50: '#fafafa',
          100: '#f5f5f5',
          150: '#efefef',
          200: '#e5e5e5',
          300: '#d0d0d0',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          750: '#333333',
          800: '#262626',
          850: '#1f1f1f',
          900: '#171717',
          950: '#0f0f0f',
        },
        // Success, Warning, Error
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        // Terminal Colors
        terminal: {
          bg: '#0f1419',
          prompt: '#29b6f6',
          text: '#e8eaed',
          accent: '#5d6eff',
        },
      },

      // Typography System
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        xs: '0.75rem',    // 12px
        sm: '0.875rem',   // 14px
        base: '1rem',     // 16px
        lg: '1.125rem',   // 18px
        xl: '1.25rem',    // 20px
        '2xl': '1.5rem',  // 24px
        '3xl': '1.875rem', // 30px
        '4xl': '2.25rem', // 36px
        '5xl': '3rem',    // 48px
        '6xl': '3.75rem', // 60px
        '7xl': '4.5rem',  // 72px
      },
      fontWeight: {
        thin: '100',
        extralight: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },
      lineHeight: {
        tight: '1.2',
        snug: '1.375',
        normal: '1.5',
        relaxed: '1.625',
        loose: '2',
      },

      // Spacing System (4px base unit)
      spacing: {
        xs: '0.25rem',   // 4px
        sm: '0.5rem',    // 8px
        md: '1rem',      // 16px
        lg: '1.5rem',    // 24px
        xl: '2rem',      // 32px
        '2xl': '3rem',   // 48px
        '3xl': '4rem',   // 64px
        '4xl': '6rem',   // 96px
      },

      // Shadows - Subtle, Layered Elevation
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        premium: '0 20px 40px -10px rgba(93, 110, 255, 0.15)',
        'premium-accent': '0 20px 40px -10px rgba(41, 182, 246, 0.15)',
        'glow-primary': '0 0 20px rgba(93, 110, 255, 0.3), 0 0 40px rgba(93, 110, 255, 0.15)',
        'glow-accent': '0 0 20px rgba(41, 182, 246, 0.3), 0 0 40px rgba(41, 182, 246, 0.15)',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        none: 'none',
      },

      // Border Radius
      borderRadius: {
        xs: '2px',
        sm: '4px',
        base: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        full: '9999px',
      },

      // Gradients
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #5d6eff 0%, #29b6f6 100%)',
        'gradient-dark': 'linear-gradient(180deg, #171717 0%, #0f0f0f 100%)',
        'gradient-subtle': 'linear-gradient(180deg, rgba(93, 110, 255, 0.05) 0%, transparent 100%)',
        'gradient-terminal': 'linear-gradient(180deg, #0f1419 0%, #0a0d12 100%)',
      },

      // Transitions & Animation
      transitionDuration: {
        xs: '100ms',
        sm: '150ms',
        base: '200ms',
        md: '300ms',
        lg: '500ms',
        xl: '700ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        glow: {
          '0%, 100%': { textShadow: '0 0 10px rgba(93, 110, 255, 0.5)' },
          '50%': { textShadow: '0 0 20px rgba(93, 110, 255, 0.8)' },
        },
      },

      // Responsive Breakpoints
      screens: {
        xs: '320px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },

      // Additional utilities
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1.5rem',
          md: '2rem',
          lg: '3rem',
          xl: '4rem',
          '2xl': '6rem',
        },
      },
      opacity: {
        5: '0.05',
        10: '0.1',
        15: '0.15',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        base: '8px',
        md: '12px',
        lg: '20px',
      },
      zIndex: {
        auto: 'auto',
        0: '0',
        10: '10',
        20: '20',
        30: '30',
        40: '40',
        50: '50',
        navbar: '100',
        modal: '200',
        tooltip: '300',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
