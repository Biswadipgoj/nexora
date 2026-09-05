'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'prismatic' | 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('prismatic');

  useEffect(() => {
    // Always initialize and enforce the Prismatic Aurora theme
    setThemeState('prismatic');
    document.documentElement.setAttribute('data-theme', 'prismatic');
    localStorage.setItem('nexora_theme', 'prismatic');
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('nexora_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleTheme = () => {
    // Toggle stays within the luminous Prismatic Aurora gamut
    setTheme('prismatic');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'prismatic' as Theme,
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return context;
}
