'use client';

import React, { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';
import { MotionConfig } from 'motion/react';

export type Theme = 'light' | 'dark';
export type ThemePreference = 'system' | Theme;

export const THEME_STORAGE_KEY = 'nexora-theme';
const THEME_EVENT = 'nexora-theme-change';

interface ThemeContextType {
  /** The theme currently on screen. */
  theme: Theme;
  /** What the user chose; "system" follows the OS. */
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  /** Flips between light and dark, pinning the choice. */
  toggleTheme: () => void;
}

/**
 * Inline script for <head>. Applies a stored explicit choice before first
 * paint; with no choice the attribute stays off and the CSS media query
 * decides, so the page is correct even before hydration.
 */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}`;

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', onChange);
  window.addEventListener('storage', onChange);
  window.addEventListener(THEME_EVENT, onChange);
  return () => {
    media.removeEventListener('change', onChange);
    window.removeEventListener('storage', onChange);
    window.removeEventListener(THEME_EVENT, onChange);
  };
}

const getSnapshot = () => `${readPreference()}:${systemPrefersDark() ? 'dark' : 'light'}`;
const getServerSnapshot = () => 'system:light';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [preference, system] = snapshot.split(':') as [ThemePreference, Theme];
  const theme: Theme = preference === 'system' ? system : preference;

  const setPreference = useCallback((next: ThemePreference) => {
    try {
      if (next === 'system') localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the attribute still applies.
    }
    if (next === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', next);
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  const value = useMemo<ThemeContextType>(
    () => ({
      theme,
      preference,
      setPreference,
      toggleTheme: () => setPreference(theme === 'dark' ? 'light' : 'dark'),
    }),
    [theme, preference, setPreference]
  );

  // Motion honours prefers-reduced-motion across the whole tree; the CSS rule
  // in nexora-tokens.css cannot reach transforms that Motion writes from JS.
  return (
    <ThemeContext.Provider value={value}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (ctx) return ctx;
  return { theme: 'light', preference: 'system', setPreference: () => {}, toggleTheme: () => {} };
}
