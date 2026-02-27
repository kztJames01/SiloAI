/**
 * Silo Design System — Theme barrel export
 *
 * Import everything you need from a single path:
 *   import { useTheme, ThemeProvider, colors, gradients, palette } from '@/theme';
 */

export { colors, palette } from './colors';
export type { ColorMode, Colors } from './colors';

export { gradients, gradientDirection } from './gradients';
export type { Gradients } from './gradients';

export { ThemeProvider, useTheme } from './ThemeContext';
export type { ThemeContextValue } from './ThemeContext';
