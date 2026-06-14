/* ============================================================
   LeadScaper Pro — Shared TypeScript Type Definitions
   Used by both the Next.js dashboard and Chrome Extension.
   ============================================================ */

// ─── Plan & Billing ────────────────────────────────────────────

export type PlanTier = 'free' | 'starter' | 'pro' | 'agency';

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'trialing'
  | 'incomplete';

export interface PlanLimits {
  leadsPerMonth: number;
  maxProjects: number;      // -1 = unlimited
  csvExport: boolean;
  xlsxExport: boolean;
  jsonExport: boolean;
  whatsapp: boolean;
  emailDiscovery: boolean;
  teamMembers: number;      // 0 = no team feature
  apiAccess: boolean;
  priceMonthly: number;     // in ₹
  priceYearly: number;      // in ₹
}

export interface Subscription {
  id: string;
  userId: string;
  plan: PlanTier;
  status: SubscriptionStatus;
  billingCycle: 'monthly' | 'yearly';
  payuSubscriptionId: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  payuTxnId: string;
  payuPaymentId: string | null;
  status: 'success' | 'failed' | 'pending' | 'refunded';
  plan: PlanTier;
  billingCycle: 'monthly' | 'yearly';
  createdAt: string;
}

// ─── User & Workspace ──────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  plan: PlanTier;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export type TeamRole = 'owner' | 'admin' | 'member';

export interface TeamMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: TeamRole;
  invitedBy: string | null;
  joinedAt: string;
  user?: Pick<User, 'email' | 'fullName' | 'avatarUrl'>;
}

// ─── Core Business Objects ─────────────────────────────────────

export interface Lead {
  id: string;
  projectId: string;
  workspaceId: string;
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
  scrapedAt: string;
  tags: string[];
  isFavorite: boolean;
  sessionId: string;
  contacted: boolean;
  contactedAt: string | null;
  notes: string | null;
  createdAt: string;
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

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWithStats extends Project {
  totalLeads: number;
  totalEmails: number;
  totalPhones: number;
  totalWebsites: number;
  contactedCount: number;
}

// ─── Campaigns ──────────────────────────────────────────────────

export interface Campaign {
  id: string;
  projectId: string;
  workspaceId: string;
  name: string;
  source: 'project' | 'csv' | 'excel' | 'json';
  messageTemplate: string;
  imageUrl: string | null;
  totalRecipients: number;
  contactedCount: number;
  createdAt: string;
  updatedAt: string;
}

export type RecipientStatus = 'pending' | 'contacted' | 'follow_up' | 'completed' | 'failed';

export interface CampaignRecipient {
  id: string;
  campaignId: string;
  leadId: string | null;
  businessName: string;
  phone: string;
  email: string | null;
  website: string | null;
  city: string | null;
  category: string | null;
  status: RecipientStatus;
  contactedAt: string | null;
}

// ─── Exports ────────────────────────────────────────────────────

export type ExportFormat = 'csv' | 'xlsx' | 'json';

export interface ExportRecord {
  id: string;
  workspaceId: string;
  format: ExportFormat;
  leadCount: number;
  fileName: string;
  projectId: string | null;
  createdAt: string;
}

// ─── Usage Tracking ─────────────────────────────────────────────

export interface UsageLog {
  id: string;
  workspaceId: string;
  month: string;         // YYYY-MM
  leadsScraped: number;
  exportsCount: number;
  campaignsCount: number;
  storageUsedBytes: number;
}

// ─── Activity Log ───────────────────────────────────────────────

export type ActivityAction =
  | 'lead.created'
  | 'lead.deleted'
  | 'lead.exported'
  | 'project.created'
  | 'project.deleted'
  | 'campaign.created'
  | 'campaign.sent'
  | 'member.invited'
  | 'member.removed'
  | 'subscription.upgraded'
  | 'subscription.downgraded'
  | 'subscription.canceled'
  | 'settings.updated';

export interface ActivityLog {
  id: string;
  workspaceId: string;
  userId: string;
  action: ActivityAction;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ─── Settings ───────────────────────────────────────────────────

export interface UserSettings {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  scrapingSpeed: 'slow' | 'moderate' | 'fast';
  exportFormat: ExportFormat;
  autoSaveProgress: boolean;
  maxRetries: number;
  emailDiscoveryDepth: 'shallow' | 'deep';
  dataRetentionDays: number;
  showNotifications: boolean;
  whatsAppMode: 'web' | 'desktop';
  defaultCountryCode: string;
  whatsappSendMode: 'manual' | 'auto';
  whatsappDailyLimit: number;
  whatsappMinDelay: number;
  whatsappMaxDelay: number;
}

// ─── Dashboard / Analytics ──────────────────────────────────────

export interface DashboardStats {
  totalLeads: number;
  leadsThisMonth: number;
  leadsWithEmail: number;
  leadsWithWebsite: number;
  leadsWithPhone: number;
  averageRating: number;
  totalExports: number;
  totalProjects: number;
  totalCampaigns: number;
  categoryCounts: Record<string, number>;
  monthlyTrend: MonthlyDataPoint[];
  subscriptionStatus: SubscriptionStatus;
  remainingCredits: number;
  planName: PlanTier;
}

export interface MonthlyDataPoint {
  month: string;
  leads: number;
  exports: number;
  campaigns: number;
}

// ─── Filters ────────────────────────────────────────────────────

export interface LeadFilterState {
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
  contacted: boolean | null;
}

// ─── Sort ───────────────────────────────────────────────────────

export interface SortConfig {
  key: keyof Lead;
  direction: 'asc' | 'desc';
}

// ─── Scraping (extension-specific but shared for API contracts) ─

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

export interface ScrapingSession {
  id: string;
  city: string;
  category: string;
  projectId: string;
  workspaceId: string;
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
}

// ─── Import ─────────────────────────────────────────────────────

export interface ImportRecord {
  id: string;
  workspaceId: string;
  fileName: string;
  importType: 'csv' | 'excel' | 'json';
  recordsImported: number;
  validRecords: number;
  invalidRecords: number;
  duplicatesRemoved: number;
  projectId: string;
  createdAt: string;
}

// ─── API Response Wrappers ──────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: {
    code: string;
    message: string;
    details?: string;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

// ─── Pagination ─────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
