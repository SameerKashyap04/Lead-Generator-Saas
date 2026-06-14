/* ============================================================
   LeadScaper Pro — useTheme Hook
   ============================================================ */

import { useState, useEffect, useCallback } from 'react';
import { getSettings, saveSettings } from '@/services/storage';
import type { Settings } from '@/types';

export function useTheme() {
  const [theme, setThemeState] = useState<Settings['theme']>('dark');

  useEffect(() => {
    // Load saved theme
    getSettings().then(settings => {
      setThemeState(settings.theme);
      applyTheme(settings.theme);
    });

    // Listen for system theme changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      getSettings().then(settings => {
        if (settings.theme === 'system') {
          applyTheme('system');
        }
      });
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  const setTheme = useCallback(async (newTheme: Settings['theme']) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    await saveSettings({ theme: newTheme });
  }, []);

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return { theme, setTheme, isDark };
}

function applyTheme(theme: Settings['theme']) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // System
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}
