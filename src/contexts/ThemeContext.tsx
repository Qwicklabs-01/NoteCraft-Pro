/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTelegramWebApp } from '../utils/telegram';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('notecraft_theme') as ThemeMode;
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      return saved;
    }
    const tg = getTelegramWebApp();
    if (tg?.colorScheme) {
      return tg.colorScheme === 'dark' ? 'dark' : 'light';
    }
    return 'light';
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const tg = getTelegramWebApp();

    const computeIsDark = () => {
      if (theme === 'dark') return true;
      if (theme === 'light') return false;
      if (tg?.colorScheme) return tg.colorScheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    };

    const dark = computeIsDark();
    setIsDark(dark);

    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    // Apply telegram theme params if available
    if (tg?.themeParams) {
      const tp = tg.themeParams;
      if (tp.bg_color) root.style.setProperty('--tg-bg-color', tp.bg_color);
      if (tp.text_color) root.style.setProperty('--tg-text-color', tp.text_color);
      if (tp.button_color) root.style.setProperty('--tg-button-color', tp.button_color);
      if (tp.button_text_color) root.style.setProperty('--tg-button-text-color', tp.button_text_color);
      if (tp.secondary_bg_color) root.style.setProperty('--tg-secondary-bg-color', tp.secondary_bg_color);
    }
  }, [theme]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem('notecraft_theme', mode);
  };

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
