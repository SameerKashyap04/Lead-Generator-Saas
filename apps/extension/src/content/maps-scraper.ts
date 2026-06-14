/* ============================================================
   LeadScaper Pro — Google Maps Content Script
   Injected into Google Maps pages to extract business leads.
   ============================================================ */

// Avoid re-injection
if (!(window as any).__leadscaper_maps_injected) {
  (window as any).__leadscaper_maps_injected = true;

  /** Selectors for Google Maps (as of 2024-2025) */
  const SELECTORS = {
    resultContainer: 'div[role="feed"]',
    resultItem: 'div[role="feed"] > div > div[jsaction]',
    endOfResults: '.HlvSq',
    noResults: 'div.Q2vNVc',
    
    // Details panel selectors
    panelTitle: 'h1.DUwDvf',
    panelAddress: 'button[data-item-id="address"]',
    panelWebsite: 'a[data-item-id="authority"]',
    panelPhone: 'button[data-tooltip*="phone"]',
    panelRating: 'div.F7nice > span > span[aria-hidden="true"]',
    panelReviews: 'div.F7nice span[aria-label*="reviews"]',
    panelCategory: 'button[jsaction*="category"]',
    panelPlusCode: 'button[data-item-id="oloc"]',
  };

  interface ScrapeState {
    currentIndex: number;
    scrapedBusinessIds: Set<string>;
    failedBusinesses: string[];
    isPaused: boolean;
    shouldStop: boolean;
    phonesFound: number;
    websitesFound: number;
    emailsFound: number;
    totalExtracted: number;
    delayMs: number;
  }

  let state: ScrapeState = {
    currentIndex: 0,
    scrapedBusinessIds: new Set(),
    failedBusinesses: [],
    isPaused: false,
    shouldStop: false,
    phonesFound: 0,
    websitesFound: 0,
    emailsFound: 0,
    totalExtracted: 0,
    delayMs: 2000,
  };

  /** Send a log message to the service worker. */
  function sendLog(type: 'info' | 'success' | 'warning' | 'error', message: string): void {
    chrome.runtime.sendMessage({
      type: 'SCRAPING_LOG',
      payload: {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        message,
        type,
        timestamp: new Date().toISOString(),
      },
    });
  }

  function reportProgress(businessName?: string) {
    chrome.runtime.sendMessage({
      type: 'SCRAPING_PROGRESS',
      payload: {
        leadsFound: state.totalExtracted,
        phonesFound: state.phonesFound,
        websitesFound: state.websitesFound,
        emailsFound: state.emailsFound,
        failedCount: state.failedBusinesses.length,
        currentIndex: state.currentIndex,
        currentlyScraping: businessName || '',
        status: state.isPaused ? 'paused' : state.shouldStop ? 'stopped' : 'extracting',
      },
    });
  }

  /**
   * Click an element robustly using various methods
   */
  async function robustClick(el: HTMLElement) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await new Promise(r => setTimeout(r, 500)); // wait for scroll

    try {
      // 1. Native click
      el.click();
    } catch (e) {
      try {
        // 2. MouseEvent
        const event = new MouseEvent('click', { view: window, bubbles: true, cancelable: true });
        el.dispatchEvent(event);
      } catch (err) {
        // 3. PointerEvent
        const ptrEvent = new PointerEvent('pointerdown', { bubbles: true });
        el.dispatchEvent(ptrEvent);
        el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      }
    }
    
    // Give Maps a moment to start reacting
    await new Promise(r => setTimeout(r, 1000));
  }

  /**
   * Wait for the details panel to load for a specific business
   */
  async function waitForPanelLoad(expectedName: string, maxWaitMs = 10000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitMs) {
      if (state.shouldStop) return false;
      
      const titleEl = document.querySelector(SELECTORS.panelTitle);
      if (titleEl && titleEl.textContent) {
        // Check if at least one detail field is present to ensure it's fully rendered
        const hasDetails = document.querySelector(SELECTORS.panelAddress) || 
                           document.querySelector(SELECTORS.panelWebsite) || 
                           document.querySelector(SELECTORS.panelPhone);
                           
        if (hasDetails) {
          return true;
        }
      }
      
      await new Promise(r => setTimeout(r, 500));
    }
    return false;
  }

  /**
   * Extract data from the open details panel
   */
  function extractPanelData(): Record<string, any> | null {
    try {
      const titleEl = document.querySelector(SELECTORS.panelTitle);
      if (!titleEl) return null;
      
      const businessName = titleEl.textContent?.trim() || '';
      
      const addressEl = document.querySelector(SELECTORS.panelAddress);
      const fullAddress = addressEl?.getAttribute('aria-label')?.replace(/^Address: /, '')?.trim() || '';
      
      const websiteEl = document.querySelector(SELECTORS.panelWebsite) as HTMLAnchorElement;
      const website = websiteEl?.href || null;
      
      // Attempt to extract the business logo / hero image
      let thumbnailUrl = null;
      const heroImg = document.querySelector('button[aria-label*="Photo"] img, div.ZqBnwb img, div[role="main"] img[decoding="async"]') as HTMLImageElement;
      if (heroImg && heroImg.src && !heroImg.src.includes('StreetView')) {
         thumbnailUrl = heroImg.src;
      } else {
         // Fallback to any image that looks like a valid photo (not a tiny icon)
         const allImgs = Array.from(document.querySelectorAll('div[role="main"] img')) as HTMLImageElement[];
         const validImg = allImgs.find(img => img.src && img.src.startsWith('https://lh5.googleusercontent.com/p/') && img.width > 50);
         if (validImg) thumbnailUrl = validImg.src;
      }
      
      const phoneEl = document.querySelector(SELECTORS.panelPhone);
      const phone = phoneEl?.getAttribute('aria-label')?.replace(/^Phone: /, '')?.trim() || null;
      
      const categoryEl = document.querySelector(SELECTORS.panelCategory);
      const category = categoryEl?.textContent?.trim() || '';
      
      const ratingEl = document.querySelector(SELECTORS.panelRating);
      const rating = ratingEl ? parseFloat(ratingEl.textContent || '0') : null;
      
      const reviewsEl = document.querySelector(SELECTORS.panelReviews);
      let reviewCount = null;
      if (reviewsEl && reviewsEl.textContent) {
        const match = reviewsEl.textContent.match(/([\d,]+)/);
        if (match) {
          reviewCount = parseInt(match[1].replace(/,/g, ''));
        }
      }

      // Open/Closed status from text anywhere in the panel
      let status: 'open' | 'closed' | 'unknown' = 'unknown';
      const allText = document.body.innerText;
      if (/\b(?:Open|Open 24 hours)\b/i.test(allText)) status = 'open';
      else if (/\b(?:Closed|Closes soon)\b/i.test(allText)) status = 'closed';

      let latitude: number | null = null;
      let longitude: number | null = null;
      const urlMatch = window.location.href.match(/!3d(-?[\d.]+)!4d(-?[\d.]+)/);
      if (urlMatch) {
        latitude = parseFloat(urlMatch[1]);
        longitude = parseFloat(urlMatch[2]);
      } else {
        const coordMatch = window.location.href.match(/@(-?[\d.]+),(-?[\d.]+)/);
        if (coordMatch) {
          latitude = parseFloat(coordMatch[1]);
          longitude = parseFloat(coordMatch[2]);
        }
      }

      return {
        businessName,
        category,
        rating,
        reviewCount,
        phone,
        website,
        fullAddress,
        googleMapsUrl: window.location.href,
        latitude,
        longitude,
        status,
        thumbnailUrl,
      };
    } catch (err) {
      console.warn('[LeadScaper] Error extracting from panel:', err);
      return null;
    }
  }

  /**
   * Promise wrapper for chrome.runtime.sendMessage
   */
  function sendMessageAsync(msg: any): Promise<any> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(msg, resolve);
    });
  }

  /**
   * Scroll the results feed downward
   */
  async function scrollResultsDown(): Promise<boolean> {
    const feed = document.querySelector(SELECTORS.resultContainer) || document.querySelector('div[role="main"] div.m6QErb.DxyBCb');
    if (!feed) return false;

    const el = feed as HTMLElement;
    const previousScrollTop = el.scrollTop;
    el.scrollBy({ top: 1000, behavior: 'smooth' });

    await new Promise(r => setTimeout(r, 1500));

    const endMarker = document.querySelector(SELECTORS.endOfResults);
    if (endMarker) return false;

    if (Math.abs(el.scrollTop - previousScrollTop) < 10) {
      el.scrollBy({ top: 1000, behavior: 'smooth' });
      await new Promise(r => setTimeout(r, 2000));
      if (Math.abs(el.scrollTop - previousScrollTop) < 10) {
        return false;
      }
    }
    return true;
  }

  /**
   * The main deep scraping loop
   */
  async function startDeepScraping(delayMs: number) {
    state.shouldStop = false;
    state.isPaused = false;
    state.delayMs = delayMs;
    
    sendLog('info', 'Starting deep scraping algorithm...');

    while (!state.shouldStop) {
      if (state.isPaused) {
        reportProgress();
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      const results = document.querySelectorAll(SELECTORS.resultItem);

      if (state.currentIndex < results.length) {
        const item = results[state.currentIndex] as HTMLElement;
        
        // Attempt to get name from card to report what we're clicking
        let tempName = 'Unknown Business';
        const aTag = item.querySelector('a.hfpxzc, a[href*="/maps/place/"]');
        if (aTag) {
           tempName = aTag.getAttribute('aria-label') || tempName;
        }

        if (state.scrapedBusinessIds.has(tempName)) {
           state.currentIndex++;
           continue;
        }

        reportProgress(tempName);

        // Click into the business
        await robustClick(aTag as HTMLElement || item);

        // Wait for panel
        const loaded = await waitForPanelLoad(tempName);
        if (!loaded) {
           sendLog('warning', `Failed to load details for ${tempName}. Retrying...`);
           await robustClick(aTag as HTMLElement || item);
           const loadedRetry = await waitForPanelLoad(tempName);
           if (!loadedRetry) {
             state.failedBusinesses.push(tempName);
             state.currentIndex++;
             continue;
           }
        }

        // Extract
        await new Promise(r => setTimeout(r, state.delayMs / 2)); // Give it a sec to fully settle
        const lead = extractPanelData();

        if (lead) {
          state.scrapedBusinessIds.add(lead.businessName);
          state.totalExtracted++;
          if (lead.phone) state.phonesFound++;
          if (lead.website) state.websitesFound++;

          // Send lead first
          await sendMessageAsync({ type: 'LEADS_FOUND', payload: [lead] });
          
          // [TEMPORARILY DISABLED] Request email extraction if website exists
          /*
          if (lead.website) {
             reportProgress(`${lead.businessName} (Scanning website...)`);
             try {
               const response = await sendMessageAsync({ type: 'FETCH_EMAILS_FOR_LEAD', payload: { leadId: lead.businessName, url: lead.website }});
               if (response && response.emails && response.emails.length > 0) {
                 state.emailsFound += response.emails.length;
                 // Note: Background service worker handles updating the database with the emails
               }
             } catch (e) {
               console.warn('[LeadScaper] Email fetch error', e);
             }
          }
          */
        } else {
          state.failedBusinesses.push(tempName);
        }

        // Return to list or just proceed to next index (which will click the next item in the DOM)
        // Usually clicking the next item from the DOM feed is enough, but to be safe we can click "Back to results" if present.
        const backBtn = document.querySelector('button.punXpd') as HTMLElement;
        if (backBtn) {
           backBtn.click();
           await new Promise(r => setTimeout(r, 500));
        }

        state.currentIndex++;
        reportProgress();

      } else {
        // Reached end of current elements, try scrolling
        reportProgress('Scrolling for more results...');
        const hasMore = await scrollResultsDown();
        if (!hasMore) {
           // Double check if elements length increased
           const newResults = document.querySelectorAll(SELECTORS.resultItem);
           if (state.currentIndex >= newResults.length) {
              sendLog('info', 'Reached end of search results.');
              break;
           }
        }
      }
    }

    state.shouldStop = true;
    sendLog('success', `Scraping completed. Extracted ${state.totalExtracted} leads.`);
    
    chrome.runtime.sendMessage({
      type: 'SCRAPING_PROGRESS',
      payload: { 
        leadsFound: state.totalExtracted, 
        phonesFound: state.phonesFound,
        websitesFound: state.websitesFound,
        emailsFound: state.emailsFound,
        failedCount: state.failedBusinesses.length,
        currentIndex: state.currentIndex,
        progress: 100, 
        status: 'completed' 
      },
    });
    chrome.runtime.sendMessage({ type: 'SCRAPING_COMPLETE' });
  }

  /**
   * Listen for messages from the service worker.
   */
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'SCROLL_RESULTS') {
      // Re-purposed to start the deep scraping
      const delay = message.payload?.delay ?? 2500;
      
      // Reset state if stopped
      if (state.shouldStop) {
        state.currentIndex = 0;
        state.scrapedBusinessIds.clear();
        state.failedBusinesses = [];
        state.phonesFound = 0;
        state.websitesFound = 0;
        state.emailsFound = 0;
        state.totalExtracted = 0;
      }
      
      startDeepScraping(delay);
      sendResponse({ started: true });
    } else if (message.type === 'STOP_SCRAPING') {
      state.shouldStop = true;
      state.isPaused = false;
      sendResponse({ stopped: true });
    } else if (message.type === 'PAUSE_SCRAPING') {
      state.isPaused = true;
      sendResponse({ paused: true });
    } else if (message.type === 'RESUME_SCRAPING') {
      state.isPaused = false;
      sendResponse({ resumed: true });
    } else if (message.type === 'RETRY_FAILED') {
      state.currentIndex = 0; // Restart but scrapedBusinessIds will skip successes
      state.failedBusinesses = [];
      state.isPaused = false;
      state.shouldStop = false;
      startDeepScraping(state.delayMs);
      sendResponse({ retried: true });
    }
    return true;
  });

  // Announce readiness
  chrome.runtime.sendMessage({ type: 'CONTENT_READY', payload: { script: 'maps-scraper' } });
  console.log('[LeadScaper Pro] Deep Maps scraper content script loaded.');
}
