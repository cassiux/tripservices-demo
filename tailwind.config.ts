import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

/**
 * Smartpoint Cloud (SPC) Tailwind configuration.
 *
 * Two layers of colour tokens live here:
 *  1. shadcn/ui semantic colours — mapped to `hsl(var(--token))` so the owned
 *     shadcn components in src/components/ui pick up the SPC palette via the
 *     CSS variables overridden in src/globals.css.
 *  2. SPC design-system tokens — the named tokens from CLAUDE.md's Design system
 *     section, exposed as concrete utilities (bg-brand, text-fg-muted, bg-ndc,
 *     text-confirmed-text, etc.).
 *
 * See globals.css for the source-of-truth CSS variables.
 */
const config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ---- shadcn/ui semantic tokens (driven by CSS variables) ---- */
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        /* ---- SPC design-system tokens (CLAUDE.md Design system) ---- */

        /* Brand green — structural, not dominant */
        brand: {
          DEFAULT: '#4E5D53',
          pressed: '#3A4840',
          tint: '#EBF0EC',
        },
        /* Accent — urgent counts, deadline badges, destructive actions */
        accent: {
          DEFAULT: '#FF5E6F',
          tint: '#FEF0F1',
        },

        /* Backgrounds */
        canvas: '#FFFFFF',
        surface: '#FAFAFA',
        hover: '#F3F4F6',
        'color-hover': '#F3F4F6', // alias matching the CLAUDE.md token name
        selected: '#EBF0EC',

        /* Foreground / typography tokens (namespaced as `fg-*` to avoid
           colliding with shadcn's primary/secondary/muted keys) */
        fg: {
          primary: '#111827',
          secondary: '#374151',
          muted: '#6B7280',
          subtle: '#9CA3AF',
        },

        /* Semantic status — badge background + text pairs */
        confirmed: {
          DEFAULT: '#EDFAED',
          text: '#1E7A1E',
        },
        warning: {
          DEFAULT: '#FEF6E6',
          text: '#B06A00',
        },
        urgent: {
          DEFAULT: '#FEF0F1',
          text: '#C8202E',
        },

        /* Content type — NDC / EDIFACT / LCC badges */
        ndc: {
          DEFAULT: '#EBF2FB',
          text: '#2255A0',
        },
        edifact: {
          DEFAULT: '#F3F4F6',
          text: '#4B5563',
        },
        lcc: {
          DEFAULT: '#FEF6E6',
          text: '#B06A00',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config

export default config
