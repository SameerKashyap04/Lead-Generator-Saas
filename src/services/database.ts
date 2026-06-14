/* ============================================================
   LeadScaper Pro — IndexedDB Service using Dexie
   ============================================================ */

import Dexie, { type Table } from 'dexie';
import type { Lead, Project, Tag, ExportRecord, WhatsAppCampaign, ProjectWithStats, CampaignRecipient, ImportHistory } from '@/types';

class LeadScaperDB extends Dexie {
  leads!: Table<Lead, string>;
  projects!: Table<Project, string>;
  tags!: Table<Tag, string>;
  exports!: Table<ExportRecord, string>;
  whatsapp_campaigns!: Table<WhatsAppCampaign, string>;
  campaign_recipients!: Table<CampaignRecipient, string>;
  import_history!: Table<ImportHistory, string>;

  constructor() {
    super('LeadScaperPro');

    this.version(1).stores({
      leads: 'id, businessName, category, rating, reviewCount, phone, website, city, status, projectId, sessionId, scrapedAt, isFavorite, *tags',
      projects: 'id, name, createdAt, updatedAt',
      tags: 'id, name',
      exports: 'id, format, exportedAt',
    });

    this.version(2).stores({
      leads: 'id, projectId, sessionId',
    });

    this.version(3).stores({
      whatsapp_campaigns: 'id, projectId, createdAt',
    });

    this.version(4).stores({
      whatsapp_campaigns: 'id, source, projectId, createdAt',
      campaign_recipients: 'id, campaignId, status',
      import_history: 'id, date',
    });
  }
}

/** Singleton database instance */
export const db = new LeadScaperDB();

/* -------------------------------------------------------
   Lead Operations
   ------------------------------------------------------- */

export async function addLeads(leads: Lead[]): Promise<void> {
  await db.leads.bulkPut(leads);
}

export async function getLead(id: string): Promise<Lead | undefined> {
  return db.leads.get(id);
}

export async function getAllLeads(): Promise<Lead[]> {
  return db.leads.toArray();
}

export async function getLeadsBySession(sessionId: string): Promise<Lead[]> {
  return db.leads.where('sessionId').equals(sessionId).toArray();
}

export async function getLeadsByProject(projectId: string): Promise<Lead[]> {
  return db.leads.where('projectId').equals(projectId).toArray();
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<void> {
  await db.leads.update(id, updates);
}

export async function deleteLead(id: string): Promise<void> {
  await db.leads.delete(id);
}

export async function deleteLeads(ids: string[]): Promise<void> {
  await db.leads.bulkDelete(ids);
}

export async function deleteLeadsBySession(sessionId: string): Promise<number> {
  const leads = await getLeadsBySession(sessionId);
  const ids = leads.map(l => l.id);
  await db.leads.bulkDelete(ids);
  return ids.length;
}

export async function toggleFavorite(id: string): Promise<void> {
  const lead = await db.leads.get(id);
  if (lead) {
    await db.leads.update(id, { isFavorite: !lead.isFavorite });
  }
}

export async function addTagToLead(leadId: string, tag: string): Promise<void> {
  const lead = await db.leads.get(leadId);
  if (lead && !lead.tags.includes(tag)) {
    await db.leads.update(leadId, { tags: [...lead.tags, tag] });
  }
}

export async function removeTagFromLead(leadId: string, tag: string): Promise<void> {
  const lead = await db.leads.get(leadId);
  if (lead) {
    await db.leads.update(leadId, { tags: lead.tags.filter(t => t !== tag) });
  }
}

export async function moveLeadsToProject(leadIds: string[], projectId: string | null): Promise<void> {
  await db.transaction('rw', db.leads, async () => {
    for (const id of leadIds) {
      await db.leads.update(id, { projectId });
    }
  });
  // Update project lead counts
  if (projectId) {
    const count = await db.leads.where('projectId').equals(projectId).count();
    await db.projects.update(projectId, { leadCount: count, updatedAt: new Date().toISOString() });
  }
}

export async function searchLeads(query: string): Promise<Lead[]> {
  const q = query.toLowerCase();
  return db.leads
    .filter(lead =>
      lead.businessName.toLowerCase().includes(q) ||
      lead.category.toLowerCase().includes(q) ||
      (lead.fullAddress?.toLowerCase().includes(q) ?? false) ||
      (lead.phone?.includes(q) ?? false) ||
      lead.emails.some(e => e.toLowerCase().includes(q))
    )
    .toArray();
}

export async function getLeadCount(): Promise<number> {
  return db.leads.count();
}

/* -------------------------------------------------------
   Project Operations
   ------------------------------------------------------- */

export async function addProject(project: Project): Promise<void> {
  await db.projects.put(project);
}

export async function getAllProjects(): Promise<Project[]> {
  return db.projects.orderBy('updatedAt').reverse().toArray();
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<void> {
  await db.projects.update(id, { ...updates, updatedAt: new Date().toISOString() });
}

/**
 * Compute live statistics for a single project by querying the leads table.
 * Never uses cached/stored counts — always fresh from DB.
 */
export async function getProjectStats(projectId: string): Promise<{ totalLeads: number; totalEmails: number; totalPhones: number; validWhatsAppLeadCount: number; contactedCount: number }> {
  const leads = await db.leads.where('projectId').equals(projectId).toArray();
  const totalLeads = leads.length;
  const totalEmails = leads.filter(l => (l.emails?.length || 0) > 0).length;
  const totalPhones = leads.filter(l => !!l.phone).length;
  const validWhatsAppLeadCount = totalPhones; // For now, we consider any phone as WhatsApp ready
  const contactedCount = leads.filter(l => l.contacted).length;
  return { totalLeads, totalEmails, totalPhones, validWhatsAppLeadCount, contactedCount };
}

/**
 * Fetch all projects with dynamically computed stats.
 * This is the primary function for UI display — all counts are live.
 */
export async function getProjectsWithStats(): Promise<ProjectWithStats[]> {
  const projects = await db.projects.orderBy('updatedAt').reverse().toArray();
  const result = [];
  for (const project of projects) {
    const stats = await getProjectStats(project.id);
    // Also sync the stored leadCount to keep it accurate
    if (project.leadCount !== stats.totalLeads) {
      await db.projects.update(project.id, { leadCount: stats.totalLeads });
    }
    result.push({ ...project, leadCount: stats.totalLeads, ...stats });
  }
  return result;
}

/* -------------------------------------------------------
   WhatsApp Campaign Operations
   ------------------------------------------------------- */

export async function addWhatsAppCampaign(campaign: WhatsAppCampaign): Promise<void> {
  await db.whatsapp_campaigns.put(campaign);
}

export async function getAllWhatsAppCampaigns(): Promise<WhatsAppCampaign[]> {
  return db.whatsapp_campaigns.orderBy('createdAt').reverse().toArray();
}

export async function getWhatsAppCampaignsByProject(projectId: string): Promise<WhatsAppCampaign[]> {
  return db.whatsapp_campaigns.where('projectId').equals(projectId).toArray();
}

export async function deleteWhatsAppCampaign(id: string): Promise<void> {
  await db.whatsapp_campaigns.delete(id);
}

export async function updateWhatsAppCampaign(id: string, updates: Partial<WhatsAppCampaign>): Promise<void> {
  await db.whatsapp_campaigns.update(id, updates);
}

/**
 * Delete a project. If deleteAllLeads is true, all project leads are deleted.
 * If false, leads are moved to unassigned (projectId = null).
 */
export async function deleteProject(id: string, deleteAllLeads: boolean = false): Promise<void> {
  if (deleteAllLeads) {
    const leadIds = await db.leads.where('projectId').equals(id).primaryKeys();
    await db.leads.bulkDelete(leadIds);
  } else {
    // Move leads to unassigned
    const leads = await db.leads.where('projectId').equals(id).toArray();
    for (const lead of leads) {
      await db.leads.update(lead.id, { projectId: null });
    }
  }
  await db.projects.delete(id);
}

/**
 * Fast lead count for a single project.
 */
export async function getLeadCountForProject(projectId: string): Promise<number> {
  return db.leads.where('projectId').equals(projectId).count();
}

/* -------------------------------------------------------
   Tag Operations
   ------------------------------------------------------- */

export async function addTag(tag: Tag): Promise<void> {
  await db.tags.put(tag);
}

export async function getAllTags(): Promise<Tag[]> {
  return db.tags.toArray();
}

export async function deleteTag(id: string): Promise<void> {
  // Remove tag from all leads
  const tag = await db.tags.get(id);
  if (tag) {
    const leads = await db.leads.filter(l => !!(l.tags && l.tags.includes(tag.name))).toArray();
    for (const lead of leads) {
      await db.leads.update(lead.id, { tags: (lead.tags || []).filter(t => t !== tag.name) });
    }
    await db.tags.delete(id);
  }
}

/* -------------------------------------------------------
   Export Operations
   ------------------------------------------------------- */

export async function addExportRecord(record: ExportRecord): Promise<void> {
  await db.exports.put(record);
}

export async function getAllExportRecords(): Promise<ExportRecord[]> {
  return db.exports.orderBy('exportedAt').reverse().toArray();
}

export async function deleteExportRecord(id: string): Promise<void> {
  await db.exports.delete(id);
}

/* -------------------------------------------------------
   Statistics
   ------------------------------------------------------- */

export async function getDashboardStats() {
  const leads = await db.leads.toArray();
  const totalLeads = leads.length;
  const leadsWithEmail = leads.filter(l => (l.emails?.length || 0) > 0).length;
  const leadsWithWebsite = leads.filter(l => l.website).length;
  const leadsWithPhone = leads.filter(l => l.phone).length;
  const ratings = leads.filter(l => l.rating !== null).map(l => l.rating as number);
  const averageRating = ratings.length > 0
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
    : 0;
  const totalExports = await db.exports.count();
  const totalProjects = await db.projects.count();

  // Category counts
  const categoryCounts: Record<string, number> = {};
  for (const lead of leads) {
    categoryCounts[lead.category] = (categoryCounts[lead.category] || 0) + 1;
  }

  return {
    totalLeads,
    leadsWithEmail,
    leadsWithWebsite,
    leadsWithPhone,
    averageRating,
    totalExports,
    totalProjects,
    categoryCounts,
    recentActivity: [],
  };
}

/* -------------------------------------------------------
   Deduplication
   ------------------------------------------------------- */

export async function removeDuplicates(): Promise<number> {
  const leads = await db.leads.toArray();
  const seen = new Map<string, string>();
  const duplicateIds: string[] = [];

  for (const lead of leads) {
    // Create composite key for dedup
    const keys = [
      lead.businessName.toLowerCase().trim(),
      lead.phone?.replace(/\D/g, '') ?? '',
      lead.googleMapsUrl ?? '',
    ].filter(Boolean);

    const compositeKey = keys.join('|');

    if (seen.has(compositeKey)) {
      duplicateIds.push(lead.id);
    } else {
      seen.set(compositeKey, lead.id);
    }
  }

  if (duplicateIds.length > 0) {
    await db.leads.bulkDelete(duplicateIds);
  }

  return duplicateIds.length;
}

/* -------------------------------------------------------
   Data Cleanup
   ------------------------------------------------------- */

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.leads, db.projects, db.tags, db.exports], async () => {
    await db.leads.clear();
    await db.projects.clear();
    await db.tags.clear();
    await db.exports.clear();
  });
}

export async function deleteOldLeads(retentionDays: number): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);
  const cutoffISO = cutoff.toISOString();

  const oldLeads = await db.leads
    .where('scrapedAt')
    .below(cutoffISO)
    .primaryKeys();

  await db.leads.bulkDelete(oldLeads);
  return oldLeads.length;
}

/* -------------------------------------------------------
   Campaign Recipients Operations
   ------------------------------------------------------- */

export async function addCampaignRecipients(recipients: CampaignRecipient[]): Promise<void> {
  await db.campaign_recipients.bulkPut(recipients);
}

export async function getRecipientsByCampaign(campaignId: string): Promise<CampaignRecipient[]> {
  return db.campaign_recipients.where('campaignId').equals(campaignId).toArray();
}

export async function updateCampaignRecipient(id: string, updates: Partial<CampaignRecipient>): Promise<void> {
  await db.campaign_recipients.update(id, updates);
}

export async function deleteCampaignRecipients(campaignId: string): Promise<void> {
  await db.campaign_recipients.where('campaignId').equals(campaignId).delete();
}

/* -------------------------------------------------------
   Import History Operations
   ------------------------------------------------------- */

export async function addImportHistory(record: ImportHistory): Promise<void> {
  await db.import_history.put(record);
}

export async function getImportHistory(): Promise<ImportHistory[]> {
  return db.import_history.orderBy('date').reverse().toArray();
}
