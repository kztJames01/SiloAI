/**
 * Silo Design System — Color Palette
 * Shared across React Native (mobile) and mirrored in tailwind.config.js (web).
 */

export const palette = {
  // ── Primary · Royal Blue / Sky Blue ──────────────────────────────────────
  primary: {
    50:  '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',  // ← light-mode default
    900: '#1E3A8A',
  },
  // ── Secondary · Emerald / Mint ────────────────────────────────────────────
  secondary: {
    50:  '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',  // ← dark-mode default
    500: '#10B981',
    600: '#059669',  // ← light-mode default
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  // ── Tertiary · Amber ──────────────────────────────────────────────────────
  tertiary: {
    50:  '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',  // ← dark-mode default
    500: '#F59E0B',
    600: '#D97706',  // ← light-mode default
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  // ── Slate Neutrals ───────────────────────────────────────────────────────
  slate: {
    50:  '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
} as const;

// ── Semantic colour sets ──────────────────────────────────────────────────────

export const colors = {
  light: {
    // Brand
    primary:   palette.primary[800],   // #1E40AF
    secondary: palette.secondary[600], // #059669
    tertiary:  palette.tertiary[600],  // #D97706

    // Surfaces
    background:     palette.slate[50],  // #F8FAFC
    surface:        '#FFFFFF',
    surfaceElevated: palette.slate[100], // #F1F5F9

    // Borders
    border: palette.slate[200], // #E2E8F0

    // Text
    textPrimary:   palette.slate[900], // #0F172A
    textSecondary: palette.slate[600], // #475569
    textTertiary:  palette.slate[500], // #64748B

    // Semantic states
    success: '#10B981',
    warning: '#F59E0B',
    error:   '#EF4444',
    info:    '#3B82F6',

    // On-colour text (use on top of brand fills)
    onPrimary:   '#FFFFFF',
    onSecondary: '#FFFFFF',
    onTertiary:  '#FFFFFF',
    onSuccess:   '#FFFFFF',
    onWarning:   palette.slate[900],
    onError:     '#FFFFFF',
    onInfo:      '#FFFFFF',
  },

  dark: {
    // Brand
    primary:   palette.primary[400],   // #60A5FA
    secondary: palette.secondary[400], // #34D399
    tertiary:  palette.tertiary[400],  // #FBBF24

    // Surfaces
    background:     palette.slate[900], // #0F172A
    surface:        palette.slate[800], // #1E293B
    surfaceElevated: palette.slate[700], // #334155

    // Borders
    border: palette.slate[600], // #475569

    // Text
    textPrimary:   palette.slate[50],  // #F8FAFC
    textSecondary: palette.slate[400], // #94A3B8
    textTertiary:  palette.slate[500], // #64748B

    // Semantic states
    success: '#4ADE80',
    warning: '#FBBF24',
    error:   '#F87171',
    info:    '#60A5FA',

    // On-colour text
    onPrimary:   palette.slate[900],
    onSecondary: palette.slate[900],
    onTertiary:  palette.slate[900],
    onSuccess:   palette.slate[900],
    onWarning:   palette.slate[900],
    onError:     palette.slate[900],
    onInfo:      palette.slate[900],
  },
} as const;

export type ColorMode = 'light' | 'dark';
export type Colors = typeof colors.light;
