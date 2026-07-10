import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  // Initialize from localStorage, defaulting to 'system'
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'system';
  });

  // The actual resolved theme being applied to the DOM
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');

      // 👇 Much cleaner!
      const effectiveTheme =
        theme === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : theme;

      root.classList.add(effectiveTheme);
      setResolvedTheme(effectiveTheme);
    };

    // Apply immediately
    applyTheme();

    // If 'system' is selected, listen for OS-level theme changes
    if (theme === 'system') {
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('theme', newTheme);
    setThemeState(newTheme);
  };

  return { theme, setTheme, resolvedTheme };
}
