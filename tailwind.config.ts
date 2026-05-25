/**
 * O2 PRODE — Tailwind Config
 * Agente 3 · Design System
 * Source of truth: design/tokens.json + app/styles/globals.css
 */

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx,mdx}", "./components/**/*.{ts,tsx,mdx}", "./lib/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Surfaces
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        card: "var(--color-card)",
        elevated: "var(--color-elevated)",
        border: {
          DEFAULT: "var(--color-border)",
          strong: "var(--color-border-strong)",
        },

        // Text
        text: {
          DEFAULT: "var(--text-primary)",
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          disabled: "var(--text-disabled)",
          inverse: "var(--text-inverse)",
        },

        // Brand
        primary: {
          DEFAULT: "var(--brand-primary)",
          hover: "var(--brand-primary-hover)",
          pressed: "var(--brand-primary-pressed)",
          soft: "var(--brand-primary-soft)",
          glow: "var(--brand-primary-glow)",
          bg: "var(--brand-primary-bg)",
        },

        // Accent
        accent: {
          DEFAULT: "var(--accent-lime)",
          lime: "var(--accent-lime)",
          "lime-soft": "var(--accent-lime-soft)",
        },

        // States
        success: {
          DEFAULT: "var(--state-success)",
          bg: "var(--state-success-bg)",
        },
        warning: {
          DEFAULT: "var(--state-warning)",
          bg: "var(--state-warning-bg)",
        },
        error: {
          DEFAULT: "var(--state-error)",
          bg: "var(--state-error-bg)",
        },
        info: {
          DEFAULT: "var(--state-info)",
          bg: "var(--state-info-bg)",
        },
        live: "var(--state-live)",
      },

      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },

      fontSize: {
        "display-xl": ["56px", { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-lg": ["40px", { lineHeight: "44px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "display-md": ["32px", { lineHeight: "36px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "heading-lg": ["24px", { lineHeight: "28px", fontWeight: "700" }],
        "heading-md": ["20px", { lineHeight: "24px", fontWeight: "700" }],
        "heading-sm": ["16px", { lineHeight: "20px", fontWeight: "700" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "body-sm": ["12px", { lineHeight: "16px", letterSpacing: "0.01em", fontWeight: "400" }],
        "body-xs": ["11px", { lineHeight: "14px", letterSpacing: "0.02em", fontWeight: "500" }],
        "numeric-xl": ["48px", { lineHeight: "48px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "numeric-lg": ["32px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "numeric-md": ["20px", { lineHeight: "24px", fontWeight: "700" }],
      },

      spacing: {
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "5": "20px",
        "6": "24px",
        "8": "32px",
        "10": "40px",
        "12": "48px",
        "16": "64px",
        "20": "80px",
      },

      borderRadius: {
        sm: "6px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "28px",
        full: "9999px",
      },

      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        "glow-primary": "var(--shadow-glow-primary)",
        "glow-accent": "var(--shadow-glow-accent)",
      },

      transitionDuration: {
        fast: "120ms",
        base: "200ms",
        medium: "320ms",
        slow: "480ms",
        epic: "800ms",
      },

      transitionTimingFunction: {
        standard: "cubic-bezier(0.2, 0, 0, 1)",
        decelerate: "cubic-bezier(0, 0, 0, 1)",
        accelerate: "cubic-bezier(0.4, 0, 1, 1)",
      },

      zIndex: {
        base: "0",
        raised: "10",
        sticky: "20",
        nav: "30",
        popover: "40",
        modal: "50",
        toast: "60",
      },

      screens: {
        xs: "360px",
        sm: "414px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
      },

      backdropBlur: {
        glass: "20px",
        modal: "28px",
      },

      backdropSaturate: {
        glass: "140%",
      },

      animation: {
        shimmer: "shimmer 1.4s infinite",
        pulse: "pulse 1.8s ease-in-out infinite",
        "fade-in": "fadeIn var(--duration-base) var(--ease-standard)",
        "slide-up": "slideUp var(--duration-medium) var(--ease-decelerate)",
      },

      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        pulse: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.6" },
          "50%": { transform: "scale(1.15)", opacity: "0.2" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { transform: "translateY(16px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
