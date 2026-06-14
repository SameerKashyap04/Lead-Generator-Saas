/* ============================================================
   LeadScaper Pro — Chrome Storage Service
   ============================================================ */

import type { Settings, ScrapingSession } from '@/types';
import { DEFAULT_SETTINGS } from '@/utils/constants';

const STORAGE_KEYS = {
  SETTINGS: 'leadscaper_settings',
  SCRAPING_SESSION: 'leadscaper_session',
  LAST_CITY: 'leadscaper_last_city',
  LAST_CATEGORY: 'leadscaper_last_category',
} as const;

/* -------------------------------------------------------
   Settings
   ------------------------------------------------------- */

export async function getSettings(): Promise<Settings> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    return { ...DEFAULT_SETTINGS, ...(result[STORAGE_KEYS.SETTINGS] || {}) };
  } catch {
    // Fallback for non-extension context (development)
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return { ...DEFAULT_SETTINGS, ...(stored ? JSON.parse(stored) : {}) };
  }
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: updated });
  } catch {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  }
}

/* -------------------------------------------------------
   Scraping Session (ephemeral — uses session storage)
   ------------------------------------------------------- */

export async function getScrapingSession(): Promise<ScrapingSession | null> {
  try {
    const result = await chrome.storage.session.get(STORAGE_KEYS.SCRAPING_SESSION);
    return result[STORAGE_KEYS.SCRAPING_SESSION] || null;
  } catch {
    const stored = sessionStorage.getItem(STORAGE_KEYS.SCRAPING_SESSION);
    return stored ? JSON.parse(stored) : null;
  }
}

export async function saveScrapingSession(session: ScrapingSession | null): Promise<void> {
  try {
    await chrome.storage.session.set({ [STORAGE_KEYS.SCRAPING_SESSION]: session });
  } catch {
    if (session) {
      sessionStorage.setItem(STORAGE_KEYS.SCRAPING_SESSION, JSON.stringify(session));
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.SCRAPING_SESSION);
    }
  }
}

export async function updateScrapingSession(updates: Partial<ScrapingSession>): Promise<ScrapingSession | null> {
  const session = await getScrapingSession();
  if (!session) return null;
  const updated = { ...session, ...updates };
  await saveScrapingSession(updated);
  return updated;
}

/* -------------------------------------------------------
   Recent Inputs & Sessions
   ------------------------------------------------------- */

export async function getLastInputs(): Promise<{ city: string; category: string }> {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEYS.LAST_CITY, STORAGE_KEYS.LAST_CATEGORY]);
    return {
      city: result[STORAGE_KEYS.LAST_CITY] || '',
      category: result[STORAGE_KEYS.LAST_CATEGORY] || '',
    };
  } catch {
    return {
      city: localStorage.getItem(STORAGE_KEYS.LAST_CITY) || '',
      category: localStorage.getItem(STORAGE_KEYS.LAST_CATEGORY) || '',
    };
  }
}

export async function saveLastInputs(city: string, category: string): Promise<void> {
  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.LAST_CITY]: city,
      [STORAGE_KEYS.LAST_CATEGORY]: category,
    });
  } catch {
    localStorage.setItem(STORAGE_KEYS.LAST_CITY, city);
    localStorage.setItem(STORAGE_KEYS.LAST_CATEGORY, category);
  }
}

export async function getLastSessionId(): Promise<string | null> {
  try {
    const result = await chrome.storage.local.get('leadscaper_last_session_id');
    return result.leadscaper_last_session_id || null;
  } catch {
    return localStorage.getItem('leadscaper_last_session_id');
  }
}

export async function saveLastSessionId(id: string): Promise<void> {
  try {
    await chrome.storage.local.set({ leadscaper_last_session_id: id });
  } catch {
    localStorage.setItem('leadscaper_last_session_id', id);
  }
}

/* -------------------------------------------------------
   Storage Change Listener
   ------------------------------------------------------- */

export function onStorageChange(
  callback: (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => void
): () => void {
  try {
    chrome.storage.onChanged.addListener(callback);
    return () => chrome.storage.onChanged.removeListener(callback);
  } catch {
    // No-op for non-extension context
    return () => {};
  }
}
