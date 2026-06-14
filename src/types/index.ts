/* ============================================================
   LeadScaper Pro By Devify — TypeScript Type Definitions
   ============================================================ */

/** Core lead data extracted from Google Maps */
export interface Lead {
  id: string;
  businessName: string;
  category: string;
  rating: number | null;
  reviewCount: number | null;
  phone: string | null;
  website: string | null;
  emails: string[];
  fullAddress: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  googleMapsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  businessHours: BusinessHours | null;
  status: 'open' | 'closed' | 'unknown';
  socialMedia: SocialMedia;
  thumbnailUrl: string | null;
  /** ISO timestamp when this lead was scraped */
  scrapedAt: string;
  /** Project this lead belongs to */
  projectId: string | null;
  /** User tags */
  tags: string[];
  /** User favorited */
  isFavorite: boolean;
  /** Scraping session that created this lead */
  sessionId: string;
  /** WhatsApp Campaigns */
  contacted: boolean;
  contactedAt: string | null;
}

export interface BusinessHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export interface SocialMedia {
  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;
  twitter: string | null;
  youtube: string | null;
}

/** A scraping project that groups leads */
export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  leadCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Project with dynamically computed statistics from the leads table */
export interface ProjectWithStats extends Project {
  totalLeads: number;
  totalEmails: number;
  totalPhones: number;
  validWhatsAppLeadCount: number;
  contactedCount: number;
}

/** WhatsApp Campaign Definition */
export interface WhatsAppCampaign {
  id: string;
  name: string;
  source: 'project' | 'csv' | 'excel' | 'json';
  projectId?: string; // Optional if source is not project
  messageTemplate: string;
  imageUrl: string | null;
  attachments?: string[];
  createdAt: string;
}

/** Standalone Campaign Recipient for Imported Leads */
export interface CampaignRecipient {
  id: string;
  campaignId: string;
  businessName?: string;
  phone: string;
  email?: string;
  website?: string;
  city?: string;
  category?: string;
  address?: string;
  status: 'pending' | 'contacted' | 'failed';
  contactedAt?: string;
}

/** Import history record */
export interface ImportHistory {
  id: string;
  fileName: string;
  importType: 'csv' | 'excel' | 'json';
  recordsImported: number;
  validRecords: number;
  invalidRecords: number;
  duplicatesRemoved: number;
  date: string;
}

/** A tag that can be applied to leads */
export interface Tag {
  id: string;
  name: string;
  color: string;
}

/** Export history record */
export interface ExportRecord {
  id: string;
  format: ExportFormat;
  leadCount: number;
  fileName: string;
  exportedAt: string;
  filters: FilterState | null;
}

export type ExportFormat = 'csv' | 'xlsx' | 'json';

/** Filter state for lead table */
export interface FilterState {
  search: string;
  minRating: number | null;
  maxRating: number | null;
  minReviews: number | null;
  hasWebsite: boolean | null;
  hasEmail: boolean | null;
  hasPhone: boolean | null;
  status: 'open' | 'closed' | 'all';
  category: string | null;
  tags: string[];
  projectId: string | null;
  isFavorite: boolean | null;
}

export interface ScrapingSession {
  id: string;
  city: string;
  category: string;
  projectId?: string;
  status: ScrapingStatus;
  leadsFound: number;
  emailsFound: number;
  progress: number;
  currentlyScraping?: string;
  totalListingsFound?: number;
  phonesFound?: number;
  websitesFound?: number;
  failedCount?: number;
  currentIndex?: number;
  startedAt: string;
  completedAt: string | null;
  errors: ScrapingError[];
  logs: LogEntry[];
}

export type ScrapingStatus =
  | 'idle'
  | 'searching'
  | 'scrolling'
  | 'extracting'
  | 'email-discovery'
  | 'paused'
  | 'completed'
  | 'error'
  | 'stopped';

export interface ScrapingError {
  message: string;
  timestamp: string;
  recoverable: boolean;
}

export interface LogEntry {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

/** User settings */
export interface Settings {
  theme: 'light' | 'dark' | 'system';
  scrapingSpeed: 'slow' | 'moderate' | 'fast';
  exportFormat: ExportFormat;
  autoSaveProgress: boolean;
  maxRetries: number;
  emailDiscoveryDepth: 'shallow' | 'deep';
  dataRetentionDays: number;
  showNotifications: boolean;
  whatsAppMode?: 'web' | 'desktop';
  defaultCountryCode?: string;
  whatsappSendMode?: 'manual' | 'auto';
  whatsappDailyLimit?: number;
  whatsappMinDelay?: number;
  whatsappMaxDelay?: number;
  whatsappSentToday?: { date: string; count: number };
  osType?: 'windows' | 'mac';
}

/** Dashboard statistics */
export interface DashboardStats {
  totalLeads: number;
  leadsWithEmail: number;
  leadsWithWebsite: number;
  leadsWithPhone: number;
  averageRating: number;
  totalExports: number;
  totalProjects: number;
  categoryCounts: Record<string, number>;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'scrape' | 'export' | 'project' | 'favorite';
  description: string;
  timestamp: string;
}

/** Sort configuration for data table */
export interface SortConfig {
  key: keyof Lead;
  direction: 'asc' | 'desc';
}

/** Messages between extension contexts */
export type ExtensionMessage =
  | { type: 'START_SCRAPING'; payload: { city: string; category: string; projectId?: string } }
  | { type: 'PAUSE_SCRAPING' }
  | { type: 'RESUME_SCRAPING' }
  | { type: 'STOP_SCRAPING' }
  | { type: 'SCRAPING_PROGRESS'; payload: Partial<ScrapingSession> }
  | { type: 'LEADS_FOUND'; payload: Lead[] }
  | { type: 'EMAILS_FOUND'; payload: { leadId: string; emails: string[]; socialMedia: SocialMedia } }
  | { type: 'SCRAPING_ERROR'; payload: ScrapingError }
  | { type: 'SCRAPING_LOG'; payload: LogEntry }
  | { type: 'SCRAPING_COMPLETE' }
  | { type: 'GET_STATUS'; payload?: undefined }
  | { type: 'STATUS_RESPONSE'; payload: ScrapingSession | null }
  | { type: 'EXTRACT_LEADS' }
  | { type: 'SCROLL_RESULTS'; payload?: { delay: number } }
  | { type: 'RETRY_FAILED' }
  | { type: 'FETCH_EMAILS_FOR_LEAD'; payload: { url: string; leadId: string } }
  | { type: 'DISCOVER_EMAILS'; payload: { url?: string; leadId: string } }
  | { type: 'CONTENT_READY'; payload: { script: string } };

/** Column definition for the data table */
export interface ColumnDef {
  key: keyof Lead;
  label: string;
  sortable: boolean;
  width?: string;
  render?: (value: unknown, lead: Lead) => string;
}
