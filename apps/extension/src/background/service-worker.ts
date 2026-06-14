/* ============================================================
   LeadScaper Pro — Background Service Worker (Manifest V3)
   Orchestrates scraping, manages state, and routes messages.
   ============================================================ */

import type { Lead, ScrapingSession, LogEntry, ExtensionMessage } from '@/types';
import { generateId, DEFAULT_SETTINGS, SCRAPING_DELAYS } from '@/utils/constants';
import { addLeads, getLeadsByProject, updateProject } from '@/services/database';
import { syncLeadsToCloud } from '@/services/sync';

/* -------------------------------------------------------
   State is NEVER stored in global variables. All state
   is persisted in chrome.storage.session (ephemeral) or
   chrome.storage.local (persistent). Per Manifest V3 rules,
   the service worker can terminate at any time.
   ------------------------------------------------------- */

// All event listeners MUST be registered synchronously at the top level.

/* -------------------------------------------------------
   Installation & Setup
   ------------------------------------------------------- */

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Set default settings
    await chrome.storage.local.set({
      leadscaper_settings: DEFAULT_SETTINGS,
    });
    console.log('[LeadScaper Pro] Extension installed. Defaults set.');
  }

  // Create context menu
  chrome.contextMenus?.create({
    id: 'leadscaper-scrape-this',
    title: 'Scrape leads from this page',
    contexts: ['page'],
    documentUrlPatterns: ['*://www.google.com/maps/*', '*://maps.google.com/*'],
  });
});

/* -------------------------------------------------------
   Context Menu Handler
   ------------------------------------------------------- */

chrome.contextMenus?.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'leadscaper-scrape-this' && tab?.id) {
    // await startScrapingOnTab(tab.id);
  }
});

/* -------------------------------------------------------
   Side Panel Behavior
   ------------------------------------------------------- */

// Open side panel when extension icon is clicked (if no popup is set)
// Note: We have a default_popup, so this won't fire by default.
// Users can open side panel from the popup.

/* -------------------------------------------------------
   Message Router
   ------------------------------------------------------- */

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'START_SCRAPING': {
          const { city, category, projectId } = message.payload;
          await handleStartScraping(city, category, projectId);
          sendResponse({ success: true });
          break;
        }

        case 'PAUSE_SCRAPING': {
          await handlePauseScraping();
          sendResponse({ success: true });
          break;
        }

        case 'RESUME_SCRAPING': {
          await handleResumeScraping();
          sendResponse({ success: true });
          break;
        }

        case 'STOP_SCRAPING': {
          await handleStopScraping();
          sendResponse({ success: true });
          break;
        }

        case 'RETRY_FAILED': {
          await handleRetryFailed();
          sendResponse({ success: true });
          break;
        }

        case 'FETCH_EMAILS_FOR_LEAD': {
          const { leadId, url } = message.payload;
          const responsePayload = await discoverEmailsSync(leadId, url);
          sendResponse(responsePayload);
          break;
        }

        case 'LEADS_FOUND': {
          await handleLeadsFound(message.payload);
          sendResponse({ success: true });
          break;
        }

        case 'EMAILS_FOUND': {
          await handleEmailsFound(message.payload);
          sendResponse({ success: true });
          break;
        }

        case 'SCRAPING_PROGRESS': {
          await updateSession(message.payload);
          break;
        }

        case 'SCRAPING_LOG': {
          await appendLog(message.payload);
          break;
        }

        case 'SCRAPING_COMPLETE': {
          await handleScrapingComplete();
          break;
        }

        case 'SCRAPING_ERROR': {
          await handleScrapingError(message.payload);
          break;
        }

        case 'GET_STATUS': {
          const session = await getSession();
          sendResponse({ session });
          break;
        }

        case 'CONTENT_READY': {
          console.log('[LeadScaper Pro] Content script ready:', (message as any).payload?.script);
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('[LeadScaper Pro] Error handling message:', err);
      sendResponse({ error: (err as Error).message });
    }
  })();
  return true; // Keep channel open for async response
});

/* -------------------------------------------------------
   Scraping Handlers
   ------------------------------------------------------- */

async function handleStartScraping(city: string, category: string, projectId?: string): Promise<void> {
  const sessionId = generateId();
  const searchQuery = `${category} in ${city}`;
  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;

  // Create session
  const session: ScrapingSession = {
    id: sessionId,
    city,
    category,
    projectId,
    status: 'searching',
    leadsFound: 0,
    emailsFound: 0,
    progress: 0,
    currentlyScraping: '',
    totalListingsFound: 0,
    phonesFound: 0,
    websitesFound: 0,
    failedCount: 0,
    currentIndex: 0,
    startedAt: new Date().toISOString(),
    completedAt: null,
    errors: [],
    logs: [{
      id: generateId(),
      message: `Starting deep search: "${searchQuery}"`,
      type: 'info',
      timestamp: new Date().toISOString(),
    }],
  };

  await chrome.storage.session.set({ leadscaper_session: session });

  // Save last inputs and session ID
  await chrome.storage.local.set({
    leadscaper_last_city: city,
    leadscaper_last_category: category,
    leadscaper_last_session_id: sessionId,
  });

  // Open Google Maps in a new tab or find existing one
  const tabs = await chrome.tabs.query({ url: '*://www.google.com/maps/*' });
  let tabId: number;

  if (tabs.length > 0 && tabs[0].id) {
    tabId = tabs[0].id;
    await chrome.tabs.update(tabId, { url: mapsUrl, active: true });
  } else {
    const tab = await chrome.tabs.create({ url: mapsUrl, active: true });
    tabId = tab.id!;
  }

  // Store tab ID for later
  await chrome.storage.session.set({ leadscaper_tab_id: tabId });

  // Wait for page to load, then start scrolling
  await waitForTabLoad(tabId);

  // Get settings for delay
  const { leadscaper_settings: settings = DEFAULT_SETTINGS } = await chrome.storage.local.get('leadscaper_settings');
  const delay = SCRAPING_DELAYS[settings.scrapingSpeed as keyof typeof SCRAPING_DELAYS] || 2500;

  // Inject content script if not already and start scrolling
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'SCROLL_RESULTS', payload: { delay } });
  } catch {
    // Content script may not be loaded yet — inject manually
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['maps-scraper.js'],
    });
    // Small delay for script init
    await new Promise(r => setTimeout(r, 500));
    await chrome.tabs.sendMessage(tabId, { type: 'SCROLL_RESULTS', payload: { delay } });
  }

  await updateSession({ status: 'scrolling' });
}

async function handlePauseScraping(): Promise<void> {
  const { leadscaper_tab_id: tabId } = await chrome.storage.session.get('leadscaper_tab_id');
  if (tabId) {
    try {
      await chrome.tabs.sendMessage(tabId, { type: 'PAUSE_SCRAPING' });
    } catch { /* tab may be closed */ }
  }
  await updateSession({ status: 'paused' });
  await appendLog({ id: generateId(), message: 'Scraping paused.', type: 'warning', timestamp: new Date().toISOString() });
}

async function handleResumeScraping(): Promise<void> {
  const { leadscaper_tab_id: tabId } = await chrome.storage.session.get('leadscaper_tab_id');
  const { leadscaper_settings: settings = DEFAULT_SETTINGS } = await chrome.storage.local.get('leadscaper_settings');
  const delay = SCRAPING_DELAYS[settings.scrapingSpeed as keyof typeof SCRAPING_DELAYS] || 2500;

  if (tabId) {
    try {
      await chrome.tabs.sendMessage(tabId, { type: 'SCROLL_RESULTS', payload: { delay } });
    } catch { /* tab may be closed */ }
  }
  await updateSession({ status: 'scrolling' });
  await appendLog({ id: generateId(), message: 'Scraping resumed.', type: 'info', timestamp: new Date().toISOString() });
}

async function handleRetryFailed(): Promise<void> {
  const { leadscaper_tab_id: tabId } = await chrome.storage.session.get('leadscaper_tab_id');
  if (tabId) {
    try {
      await chrome.tabs.sendMessage(tabId, { type: 'RETRY_FAILED' });
    } catch { /* tab may be closed */ }
  }
  await updateSession({ status: 'extracting' });
  await appendLog({ id: generateId(), message: 'Retrying failed listings.', type: 'info', timestamp: new Date().toISOString() });
}

async function handleStopScraping(): Promise<void> {
  const { leadscaper_tab_id: tabId } = await chrome.storage.session.get('leadscaper_tab_id');
  if (tabId) {
    try {
      await chrome.tabs.sendMessage(tabId, { type: 'STOP_SCRAPING' });
    } catch { /* tab may be closed */ }
  }
  await updateSession({ status: 'stopped', completedAt: new Date().toISOString() });
  await appendLog({ id: generateId(), message: 'Scraping stopped by user.', type: 'warning', timestamp: new Date().toISOString() });
}

async function handleLeadsFound(rawLeads: any[]): Promise<void> {
  // rawLeads come from content script — they're not full Lead objects yet
  // We'll broadcast them to the UI which will format and save to IndexedDB
  // (Service worker doesn't have direct IndexedDB access in all contexts)
  const session = await getSession();
  if (!session) return;

  // Guard: refuse to save leads without a project
  if (!session.projectId) {
    console.error('[LEAD ERROR] No projectId on session — leads cannot be saved without a project.');
    try {
      await chrome.runtime.sendMessage({ type: 'DATABASE_ERROR', payload: 'No project selected. Leads were not saved.' });
    } catch { /* no listeners */ }
    return;
  }

  // Build partial leads with session metadata
  const leads = rawLeads.map(raw => {
    const lead: Record<string, any> = {
      ...raw,
      id: generateId(),
      emails: [],
      city: raw.city || undefined,
      state: raw.state || undefined,
      postalCode: raw.postalCode || undefined,
      country: raw.country || undefined,
      businessHours: raw.businessHours || undefined,
      socialMedia: { facebook: undefined, instagram: undefined, linkedin: undefined, twitter: undefined, youtube: undefined },
      thumbnailUrl: raw.thumbnailUrl || undefined,
      scrapedAt: new Date().toISOString(),
      tags: [],
      isFavorite: false,
      sessionId: session.id,
      projectId: session.projectId,
      contacted: false,
      contactedAt: null,
    };
    return lead;
  });

  // Broadcast to all extension pages (popup, sidepanel, dashboard)
  try {
    await chrome.runtime.sendMessage({ type: 'LEADS_FOUND', payload: leads });
  } catch { /* no listeners */ }

  // Save to IndexedDB robustly with retries
  let saved = false;
  let attempts = 0;
  while (!saved && attempts < 3) {
    try {
      attempts++;
      await addLeads(leads as Lead[]);
      saved = true;
      console.log(`[LEAD SAVED] Saved ${leads.length} leads to database.`);
    } catch (err) {
      console.error(`[DATABASE ERROR] Attempt ${attempts} failed to save leads:`, err);
      if (attempts >= 3) {
        await chrome.runtime.sendMessage({ type: 'DATABASE_ERROR', payload: 'Failed to save leads to database.' });
      }
    }
  }

  // Update project count if successfully saved
  if (saved && session.projectId) {
    try {
      // Sync to Supabase in background
      syncLeadsToCloud().catch(err => console.error('[Sync Error]', err));

      const projectLeads = await getLeadsByProject(session.projectId);
      const newCount = projectLeads.length;
      await updateProject(session.projectId, { leadCount: newCount });
      console.log(`[PROJECT UPDATED] Project ${session.projectId} lead count updated to ${newCount}`);
      
      // Notify UI that project stats have updated
      await chrome.runtime.sendMessage({ type: 'PROJECT_UPDATED', payload: session.projectId });
    } catch (err) {
      console.error('[DATABASE ERROR] Failed to update project lead count:', err);
    }
  }
}

async function handleEmailsFound(data: { leadId: string; emails: string[]; socialMedia: any }): Promise<void> {
  // Broadcast email results to UI pages
  try {
    await chrome.runtime.sendMessage({ type: 'EMAILS_FOUND', payload: data });
  } catch { /* no listeners */ }
}

async function handleScrapingComplete(): Promise<void> {
  await updateSession({ status: 'completed', completedAt: new Date().toISOString(), progress: 100 });
  await appendLog({
    id: generateId(),
    message: 'Scraping completed successfully!',
    type: 'success',
    timestamp: new Date().toISOString(),
  });
}

async function handleScrapingError(error: any): Promise<void> {
  const session = await getSession();
  if (session) {
    const errors = [...(session.errors || []), error];
    await updateSession({ errors, status: 'error' });
  }
}

/* -------------------------------------------------------
   Email Discovery (visits business websites)
   ------------------------------------------------------- */

async function discoverEmailsSync(leadId: string, websiteUrl: string): Promise<any> {
  if (!websiteUrl) return { emails: [] };

  try {
    const tab = await chrome.tabs.create({
      url: websiteUrl,
      active: false,
    });

    if (!tab.id) return { emails: [] };

    await waitForTabLoad(tab.id);

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['email-scraper.js'],
    });

    await new Promise(r => setTimeout(r, 500));

    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'DISCOVER_EMAILS',
      payload: { leadId },
    });

    if (response?.emails?.length > 0 || response?.socialMedia) {
      await handleEmailsFound({
        leadId,
        emails: response.emails || [],
        socialMedia: response.socialMedia || {},
      });
    }

    await chrome.tabs.remove(tab.id);
    return response || { emails: [] };
  } catch (err) {
    console.warn(`[LeadScaper Pro] Email discovery failed for ${websiteUrl}:`, err);
    return { emails: [] };
  }
}

async function discoverEmails(lead: Lead): Promise<void> {
  await discoverEmailsSync(lead.id, lead.website || '');
}

/* -------------------------------------------------------
   Utility Functions
   ------------------------------------------------------- */

async function getSession(): Promise<ScrapingSession | null> {
  const { leadscaper_session } = await chrome.storage.session.get('leadscaper_session');
  return leadscaper_session || null;
}

async function updateSession(updates: Partial<ScrapingSession>): Promise<void> {
  const session = await getSession();
  if (session) {
    const updated = { ...session, ...updates };
    await chrome.storage.session.set({ leadscaper_session: updated });
  }
}

async function appendLog(log: LogEntry): Promise<void> {
  const session = await getSession();
  if (session) {
    const logs = [...(session.logs || []).slice(-100), log]; // Keep last 100 logs
    await chrome.storage.session.set({
      leadscaper_session: { ...session, logs },
    });
  }
}

function waitForTabLoad(tabId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve(); // Resolve even on timeout — page may be slow
    }, 15000);

    const listener = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(listener);
        // Extra delay for Maps JS to render
        setTimeout(resolve, 2000);
      }
    };

    chrome.tabs.onUpdated.addListener(listener);
  });
}

/* -------------------------------------------------------
   Alarms for periodic auto-save
   ------------------------------------------------------- */

chrome.alarms.create('leadscaper-autosave', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'leadscaper-autosave') {
    // Keep session alive via storage write (resets SW idle timer)
    const session = await getSession();
    if (session && (session.status === 'scrolling' || session.status === 'extracting')) {
      await chrome.storage.session.set({ leadscaper_session: session });
    }
  }
});

console.log('[LeadScaper Pro] Service worker loaded.');
