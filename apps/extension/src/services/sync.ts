import { db } from './database';
import { supabase } from './supabase';
import type { Lead, Project } from '@/types';

/**
 * Synchronize local IndexedDB projects with Supabase Cloud
 */
export async function syncProjectsToCloud() {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) return;

  const user = session.session.user;

  // Get user's workspace
  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .single();

  if (!member) return;
  const workspaceId = member.workspace_id;

  // 1. Fetch remote projects
  const { data: remoteProjects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (error || !remoteProjects) {
    console.error('[Sync] Failed to fetch remote projects', error);
    return;
  }

  // 2. Map remote projects to local Dexie format
  const formattedProjects: Project[] = remoteProjects.map(rp => ({
    id: rp.id,
    name: rp.name,
    description: rp.description,
    color: rp.color,
    icon: rp.icon,
    leadCount: 0, // Will be computed live
    createdAt: rp.created_at,
    updatedAt: rp.updated_at,
  }));

  // 3. Upsert into Dexie
  await db.projects.bulkPut(formattedProjects);

  // Note: We don't push local-only projects to cloud yet in this simple sync.
  // Assuming projects are created on the web dashboard.
}

/**
 * Synchronize local IndexedDB leads to Supabase Cloud
 */
export async function syncLeadsToCloud() {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) return;

  const user = session.session.user;

  // Get user's workspace
  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .single();

  if (!member) return;
  const workspaceId = member.workspace_id;

  // Get local leads
  const localLeads = await db.leads.toArray();

  if (localLeads.length === 0) return;

  // Chunk leads for Supabase insert
  const chunkSize = 50;
  for (let i = 0; i < localLeads.length; i += chunkSize) {
    const chunk = localLeads.slice(i, i + chunkSize);
    
    const formattedLeads = chunk.map(lead => ({
      id: lead.id,
      workspace_id: workspaceId,
      project_id: lead.projectId,
      business_name: lead.businessName,
      category: lead.category,
      rating: lead.rating,
      review_count: lead.reviewCount,
      phone: lead.phone,
      website: lead.website,
      emails: lead.emails || [],
      full_address: lead.fullAddress,
      city: lead.city,
      state: lead.state,
      postal_code: lead.postalCode,
      country: lead.country,
      google_maps_url: lead.googleMapsUrl,
      latitude: lead.latitude,
      longitude: lead.longitude,
      business_hours: lead.businessHours,
      status: lead.status || 'unknown',
      social_media: lead.socialMedia || {},
      thumbnail_url: lead.thumbnailUrl,
      scraped_at: lead.scrapedAt,
      tags: lead.tags || [],
      is_favorite: lead.isFavorite || false,
      session_id: lead.sessionId,
      contacted: lead.contacted || false,
      contacted_at: lead.contactedAt,
      created_at: new Date().toISOString()
    }));

    // Upsert into Supabase
    const { error, data: insertedLeads } = await supabase
      .from('leads')
      .upsert(formattedLeads, { onConflict: 'id', ignoreDuplicates: true })
      .select('id');

    if (error) {
      console.error('[Sync] Failed to sync chunk of leads to cloud', error);
    } else if (insertedLeads && insertedLeads.length > 0) {
      // Update usage logs
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      const { data: usageLog } = await supabase
        .from('usage_logs')
        .select('leads_scraped')
        .eq('workspace_id', workspaceId)
        .eq('month', currentMonth)
        .single();
        
      if (usageLog) {
        await supabase
          .from('usage_logs')
          .update({ leads_scraped: usageLog.leads_scraped + insertedLeads.length })
          .eq('workspace_id', workspaceId)
          .eq('month', currentMonth);
      }
    }
  }

  console.log(`[Sync] Successfully synced ${localLeads.length} leads to cloud.`);
}
