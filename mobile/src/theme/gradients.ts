/**
 * Silo Design System — Gradient Definitions
 * Compatible with expo-linear-gradient `colors` prop (string[]).
 */

export const gradients = {
  light: {
    /** Primary brand gradient — hero sections, onboarding, CTAs */
    brand:  ['#1E40AF', '#059669'] as [string, string],
    /** Warm gradient — blue-collar / construction contexts */
    warm:   ['#1E40AF', '#D97706'] as [string, string],
    /** Subtle background wash */
    subtle: ['#F8FAFC', '#FFFFFF'] as [string, string],
    /** Success-tinted gradient */
    success: ['#059669', '#10B981'] as [string, string],
    /** Warning / amber gradient */
    warning: ['#D97706', '#F59E0B'] as [string, string],
  },

  dark: {
    /** Primary brand gradient — dark variant */
    brand:  ['#60A5FA', '#34D399'] as [string, string],
    /** Warm gradient — dark variant */
    warm:   ['#60A5FA', '#FBBF24'] as [string, string],
    /** Subtle background wash — dark variant */
    subtle: ['#0F172A', '#1E293B'] as [string, string],
    /** Success-tinted gradient — dark variant */
    success: ['#34D399', '#4ADE80'] as [string, string],
    /** Warning / amber gradient — dark variant */
    warning: ['#FBBF24', '#FCD34D'] as [string, string],
  },
} as const;

/** Gradient start/end vector for a 135° diagonal */
export const gradientDirection = {
  start: { x: 0, y: 0 },
  end:   { x: 1, y: 1 },
} as const;

export type Gradients = typeof gradients.light;
