/* ============================================================
   LeadScaper Pro — Validators & Formatters
   ============================================================ */

import { EMAIL_PATTERN, EXCLUDED_EMAIL_PATTERNS } from './constants';

/**
 * Validate an email address format.
 */
export function isValidEmail(email: string): boolean {
  const pattern = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  if (!pattern.test(email)) return false;

  // Reject excluded patterns
  for (const excluded of EXCLUDED_EMAIL_PATTERNS) {
    if (excluded.test(email)) return false;
  }

  return true;
}

/**
 * Extract all valid emails from a text string.
 */
export function extractEmails(text: string): string[] {
  const matches = text.match(EMAIL_PATTERN) || [];
  const unique = [...new Set(matches.map(e => e.toLowerCase().trim()))];
  return unique.filter(isValidEmail);
}

/**
 * Normalize a phone number for comparison.
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Format a phone number for display.
 */
export function formatPhone(phone: string | null): string {
  if (!phone) return '—';
  return phone;
}

/**
 * Normalize a URL for comparison.
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, '') + parsed.pathname.replace(/\/$/, '');
  } catch {
    return url.toLowerCase().trim();
  }
}

/**
 * Format a rating number with star indicator.
 */
export function formatRating(rating: number | null): string {
  if (rating === null) return '—';
  return `${rating.toFixed(1)}`;
}

/**
 * Format a large number with abbreviation.
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

/**
 * Format a relative time string.
 */
export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

/**
 * Truncate text to a max length.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '…';
}

/**
 * Parse address components from a full address string.
 */
export function parseAddress(fullAddress: string): {
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
} {
  // Simple heuristic parser — Google Maps addresses vary by locale
  const parts = fullAddress.split(',').map(p => p.trim());

  if (parts.length >= 3) {
    // Try to extract postal code from last or second-to-last part
    const postalMatch = parts[parts.length - 1].match(/\b\d{5,6}\b/);
    const stateMatch = parts[parts.length - 2]?.match(/([A-Z]{2})\s*\d*/);

    return {
      city: parts.length >= 4 ? parts[parts.length - 3] : parts[0],
      state: stateMatch ? stateMatch[1] : (parts.length >= 3 ? parts[parts.length - 2] : null),
      postalCode: postalMatch ? postalMatch[0] : null,
      country: parts[parts.length - 1].replace(/\d/g, '').trim() || null,
    };
  }

  return { city: null, state: null, postalCode: null, country: null };
}

/**
 * Compute a color from a string (for consistent project/tag colors).
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 65%, 55%)`;
}

/**
 * Class name merger (like tailwind-merge + clsx).
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
