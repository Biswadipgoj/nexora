'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { MotionConfig } from 'motion/react';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  /** True while light mode is still unbuilt, so surfaces can hide the control. */
  themeLocked: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

/**
 * Section 2: "the master direction below resolves that conflict by making
 * obsidian dark the default authenticated experience, with a restrained light
 * mode only after dark-mode parity is complete."
 *
 * Dark is therefore the only theme the product currently ships. The context
 * keeps its shape so surfaces do not need to branch, but reports
 * `themeLocked` so they can hide a toggle that would otherwise do nothing —
 * section 3.5 counts a control that contradicts its own label as unresolved.
 *
 * To add light mode later: build the light token set in nexora-tokens.css
 * under [data-theme="light"], then replace the constant below with persisted
 * state and flip `themeLocked` to false.
 */
const THEME: Theme = 'dark';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const noop = () => {};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<ThemeContextType>(
    () => ({ theme: THEME, themeLocked: true, toggleTheme: noop, setTheme: noop }),
    []
  );

  /**
   * Section 9: "Reduced-motion mode must disable aurora drift, tilt, parallax,
   * and animated gradient shimmer."
   *
   * The CSS rule in nexora-tokens.css cannot reach Framer Motion, which writes
   * transforms through JS — tab transitions, the mobile dock's sliding pill and
   * every whileTap kept animating for users who asked for less motion.
   * MotionConfig applies the preference across the whole tree at once.
   */
  return (
    <ThemeContext.Provider value={value}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  return (
    useContext(ThemeContext) ?? {
      theme: THEME,
      themeLocked: true,
      toggleTheme: noop,
      setTheme: noop,
    }
  );
}
