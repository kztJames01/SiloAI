/**
 * Silo Design System — Theme Context (React Native)
 *
 * Provides resolved `colors` and `gradients` for the current mode to the
 * entire component tree.  Defaults to the system colour scheme; consumers can
 * override via `setColorScheme`.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

import { colors, type ColorMode, type Colors } from './colors';
import { gradients, type Gradients } from './gradients';
import { palette } from './colors';

// ── Context shape ─────────────────────────────────────────────────────────────

export interface ThemeContextValue {
  /** Whether dark mode is currently active */
  isDark: boolean;
  /** Active colour mode string */
  colorScheme: ColorMode;
  /** Override or follow system preference */
  setColorScheme: (mode: ColorMode | 'system') => void;
  /** Resolved semantic colours for the current mode */
  colors: Colors;
  /** Resolved gradient tuples for the current mode */
  gradients: Gradients;
  /** Raw palette (all shades, both modes) */
  palette: typeof palette;
}

// ── Context & hook ────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Force an initial colour mode instead of reading the system setting */
  defaultColorScheme?: ColorMode | 'system';
}

export function ThemeProvider({
  children,
  defaultColorScheme = 'system',
}: ThemeProviderProps) {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [override, setOverride] = useState<ColorMode | 'system'>(
    defaultColorScheme,
  );

  // Re-sync to system when override is cleared
  const setColorScheme = useCallback((mode: ColorMode | 'system') => {
    setOverride(mode);
  }, []);

  const resolvedScheme: ColorMode = useMemo(() => {
    if (override !== 'system') return override;
    return systemScheme === 'dark' ? 'dark' : 'light';
  }, [override, systemScheme]);

  const isDark = resolvedScheme === 'dark';

  const value = useMemo<ThemeContextValue>(
    () => ({
      isDark,
      colorScheme: resolvedScheme,
      setColorScheme,
      colors: (isDark ? colors.dark : colors.light) as Colors,
      gradients: isDark ? gradients.dark : gradients.light,
      palette,
    }),
    [isDark, resolvedScheme, setColorScheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
