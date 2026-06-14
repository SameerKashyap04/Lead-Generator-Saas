/* ============================================================
   LeadScaper Pro — Constants
   ============================================================ */

import type { Settings, FilterState, ColumnDef } from '@/types';

/** Default user settings */
export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  scrapingSpeed: 'moderate',
  exportFormat: 'csv',
  autoSaveProgress: true,
  maxRetries: 3,
  emailDiscoveryDepth: 'shallow',
  dataRetentionDays: 90,
  showNotifications: true,
  whatsAppMode: 'web',
  defaultCountryCode: '91',
  whatsappSendMode: 'manual',
  whatsappDailyLimit: 40,
  whatsappMinDelay: 30,
  whatsappMaxDelay: 120,
  osType: 'mac',
};

/** Scraping delays in milliseconds */
export const SCRAPING_DELAYS: Record<Settings['scrapingSpeed'], number> = {
  slow: 4000,
  moderate: 2500,
  fast: 1200,
};

/** Default empty filter state */
export const DEFAULT_FILTER_STATE: FilterState = {
  search: '',
  minRating: null,
  maxRating: null,
  minReviews: null,
  hasWebsite: null,
  hasEmail: null,
  hasPhone: null,
  status: 'all',
  category: null,
  tags: [],
  projectId: null,
  isFavorite: null,
};

/** Column definitions for the leads data table */
export const LEAD_TABLE_COLUMNS: ColumnDef[] = [
  { key: 'businessName', label: 'Business Name', sortable: true, width: '200px' },
  { key: 'category', label: 'Category', sortable: true, width: '130px' },
  { key: 'rating', label: 'Rating', sortable: true, width: '80px' },
  { key: 'reviewCount', label: 'Reviews', sortable: true, width: '90px' },
  { key: 'phone', label: 'Phone', sortable: false, width: '140px' },
  { key: 'website', label: 'Website', sortable: false, width: '160px' },
  { key: 'emails', label: 'Email', sortable: false, width: '180px' },
  { key: 'fullAddress', label: 'Address', sortable: false, width: '200px' },
  { key: 'status', label: 'Status', sortable: true, width: '80px' },
];

/** Suggested business categories */
export const BUSINESS_CATEGORIES = [
  'Accountant', 'Attorney', 'Auto Repair', 'Bakery', 'Bank', 'Barber',
  'Beauty Salon', 'Cafe', 'Car Dealer', 'Chiropractor', 'Cleaning Service',
  'Dentist', 'Doctor', 'Electrician', 'Florist', 'Gym', 'Hair Salon',
  'Hotel', 'Insurance Agent', 'Landscaper', 'Lawyer', 'Locksmith',
  'Mechanic', 'Moving Company', 'Painter', 'Pet Store', 'Photographer',
  'Pizza', 'Plumber', 'Real Estate Agent', 'Restaurant', 'Roofer',
  'Spa', 'Therapist', 'Veterinarian', 'Wedding Planner', 'Yoga Studio',
];

/** Color palette for projects */
export const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

/** Social media URL patterns for detection */
export const SOCIAL_MEDIA_PATTERNS = {
  facebook: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[^\s"'<>]+/gi,
  instagram: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/[^\s"'<>]+/gi,
  linkedin: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:company|in)\/[^\s"'<>]+/gi,
  twitter: /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/[^\s"'<>]+/gi,
  youtube: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:@|channel\/|c\/)[^\s"'<>]+/gi,
};

/** Email regex pattern */
export const EMAIL_PATTERN = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

/** Pages to scan for emails on business websites */
export const EMAIL_SCAN_PATHS = [
  '/',
  '/contact',
  '/contact-us',
  '/about',
  '/about-us',
  '/privacy',
  '/privacy-policy',
];

/** Excluded email patterns (generic/spam) */
export const EXCLUDED_EMAIL_PATTERNS = [
  /^noreply@/i,
  /^no-reply@/i,
  /^support@example\./i,
  /^test@/i,
  /^admin@example\./i,
  /\.png$/i,
  /\.jpg$/i,
  /\.gif$/i,
  /\.svg$/i,
  /\.webp$/i,
  /@sentry\./i,
  /@wixpress\./i,
  /@example\./i,
];

/** Generate a unique ID */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/** Sidebar navigation items */
export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/' },
  { id: 'scraper', label: 'Scraper', icon: 'Search', path: '/scraper' },
  { id: 'projects', label: 'Projects', icon: 'FolderOpen', path: '/projects' },
  { id: 'exports', label: 'Exports', icon: 'Download', path: '/exports' },
  { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings' },
] as const;
