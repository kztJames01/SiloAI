/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── shadcn/ui CSS-variable tokens (kept for component compatibility) ──
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },

        // Silo brand palette
        silo: {
          primary: {
            DEFAULT: '#1E40AF',
            dark:    '#60A5FA',
            50:  '#EFF6FF',
            100: '#DBEAFE',
            200: '#BFDBFE',
            300: '#93C5FD',
            400: '#60A5FA',
            500: '#3B82F6',
            600: '#2563EB',
            700: '#1D4ED8',
            800: '#1E40AF',
            900: '#1E3A8A',
          },
          // Secondary — Emerald / Mint
          secondary: {
            DEFAULT: '#059669',
            dark:    '#34D399',
            50:  '#ECFDF5',
            100: '#D1FAE5',
            200: '#A7F3D0',
            300: '#6EE7B7',
            400: '#34D399',
            500: '#10B981',
            600: '#059669',
            700: '#047857',
            800: '#065F46',
            900: '#064E3B',
          },
          // Tertiary — Amber
          tertiary: {
            DEFAULT: '#D97706',
            dark:    '#FBBF24',
            50:  '#FFFBEB',
            100: '#FEF3C7',
            200: '#FDE68A',
            300: '#FCD34D',
            400: '#FBBF24',
            500: '#F59E0B',
            600: '#D97706',
            700: '#B45309',
            800: '#92400E',
            900: '#78350F',
          },
          // Neutral surfaces
          surface: {
            DEFAULT:       '#FFFFFF',
            dark:          '#1E293B',
            elevated:      '#F1F5F9',
            'elevated-dark': '#334155',
          },
          bg: {
            DEFAULT: '#F8FAFC',
            dark:    '#0F172A',
          },
          border: {
            DEFAULT: '#E2E8F0',
            dark:    '#475569',
          },
          text: {
            primary:   '#0F172A',
            'primary-dark': '#F8FAFC',
            secondary: '#475569',
            'secondary-dark': '#94A3B8',
            tertiary:  '#64748B',
          },
          // Semantic states
          success: {
            DEFAULT: '#10B981',
            dark:    '#4ADE80',
          },
          warning: {
            DEFAULT: '#F59E0B',
            dark:    '#FBBF24',
          },
          error: {
            DEFAULT: '#EF4444',
            dark:    '#F87171',
          },
          info: {
            DEFAULT: '#3B82F6',
            dark:    '#60A5FA',
          },
        },
      },

      backgroundImage: {
        // Brand gradients (light)
        'gradient-brand':      'linear-gradient(135deg, #1E40AF 0%, #059669 100%)',
        'gradient-warm':       'linear-gradient(135deg, #1E40AF 0%, #D97706 100%)',
        'gradient-subtle':     'linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%)',
        // Brand gradients (dark)
        'gradient-brand-dark': 'linear-gradient(135deg, #60A5FA 0%, #34D399 100%)',
        'gradient-warm-dark':  'linear-gradient(135deg, #60A5FA 0%, #FBBF24 100%)',
        'gradient-subtle-dark':'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}
