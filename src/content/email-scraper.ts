/* ============================================================
   LeadScaper Pro — Email Discovery Content Script
   Injected into business websites to find email addresses
   and social media links.
   ============================================================ */

if (!(window as any).__leadscaper_email_injected) {
  (window as any).__leadscaper_email_injected = true;

  const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

  const SOCIAL_PATTERNS: Record<string, RegExp> = {
    facebook: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[^\s"'<>)]+/gi,
    instagram: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/[^\s"'<>)]+/gi,
    linkedin: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:company|in)\/[^\s"'<>)]+/gi,
    twitter: /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/[^\s"'<>)]+/gi,
    youtube: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:@|channel\/|c\/)[^\s"'<>)]+/gi,
  };

  const EXCLUDED_EMAILS = [
    /^noreply@/i, /^no-reply@/i, /^support@example/i, /^test@/i,
    /\.png$/i, /\.jpg$/i, /\.gif$/i, /\.svg$/i, /\.webp$/i,
    /@sentry\./i, /@wixpress\./i, /@example\./i,
  ];

  /**
   * Extract emails from the current page.
   */
  function extractEmailsFromPage(): string[] {
    const text = document.body?.innerText ?? '';
    const htmlSource = document.documentElement?.innerHTML ?? '';

    // Get emails from visible text
    const textEmails = text.match(EMAIL_REGEX) || [];

    // Get emails from href="mailto:..." links
    const mailtoLinks = document.querySelectorAll('a[href^="mailto:"]');
    const mailtoEmails: string[] = [];
    mailtoLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href) {
        const email = href.replace('mailto:', '').split('?')[0].trim();
        if (email) mailtoEmails.push(email);
      }
    });

    // Get emails from HTML source (catches hidden/obfuscated ones)
    const sourceEmails = htmlSource.match(EMAIL_REGEX) || [];

    // Merge and deduplicate
    const allEmails = [...new Set([...textEmails, ...mailtoEmails, ...sourceEmails].map(e => e.toLowerCase().trim()))];

    // Filter out excluded patterns
    return allEmails.filter(email => {
      for (const pattern of EXCLUDED_EMAILS) {
        if (pattern.test(email)) return false;
      }
      // Basic structural validation
      const parts = email.split('@');
      if (parts.length !== 2) return false;
      if (parts[1].split('.').length < 2) return false;
      if (parts[0].length < 1 || parts[1].length < 4) return false;
      return true;
    });
  }

  /**
   * Extract social media links from the current page.
   */
  function extractSocialMedia(): Record<string, string | null> {
    const html = document.documentElement?.innerHTML ?? '';
    const result: Record<string, string | null> = {
      facebook: null,
      instagram: null,
      linkedin: null,
      twitter: null,
      youtube: null,
    };

    for (const [platform, pattern] of Object.entries(SOCIAL_PATTERNS)) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        // Take the first valid match
        let url = matches[0].trim();
        if (!url.startsWith('http')) url = 'https://' + url;
        result[platform] = url;
      }
    }

    // Also check anchor tags with social media links
    const allLinks = document.querySelectorAll('a[href]');
    allLinks.forEach(link => {
      const href = (link as HTMLAnchorElement).href;
      if (!href) return;
      for (const [platform] of Object.entries(SOCIAL_PATTERNS)) {
        if (!result[platform] && href.includes(`${platform}.com`)) {
          result[platform] = href;
        }
        if (!result[platform] && platform === 'twitter' && href.includes('x.com')) {
          result[platform] = href;
        }
      }
    });

    return result;
  }

  /**
   * Handle messages from the service worker.
   */
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'DISCOVER_EMAILS') {
      const emails = extractEmailsFromPage();
      const socialMedia = extractSocialMedia();

      sendResponse({
        emails,
        socialMedia,
        url: window.location.href,
        leadId: message.payload?.leadId,
      });
    }
    return true;
  });

  console.log('[LeadScaper Pro] Email scraper content script loaded.');
}
