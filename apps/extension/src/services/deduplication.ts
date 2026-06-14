/* ============================================================
   LeadScaper Pro — Deduplication Service
   ============================================================ */

import type { Lead } from '@/types';
import { normalizePhone, normalizeUrl } from '@/utils/formatters';

interface DuplicateGroup {
  primary: Lead;
  duplicates: Lead[];
  confidence: number;
  matchedFields: string[];
}

/**
 * Find duplicate groups among leads using multiple matching criteria.
 */
export function findDuplicates(leads: Lead[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const processed = new Set<string>();

  if (!Array.isArray(leads)) return groups;

  for (let i = 0; i < leads.length; i++) {
    if (processed.has(leads[i].id)) continue;

    const duplicates: Lead[] = [];
    let maxConfidence = 0;
    const matchedFields: Set<string> = new Set();

    for (let j = i + 1; j < leads.length; j++) {
      if (processed.has(leads[j].id)) continue;

      const { isDuplicate, confidence, fields } = comparLeads(leads[i], leads[j]);
      if (isDuplicate) {
        duplicates.push(leads[j]);
        processed.add(leads[j].id);
        maxConfidence = Math.max(maxConfidence, confidence);
        fields.forEach(f => matchedFields.add(f));
      }
    }

    if (duplicates.length > 0) {
      processed.add(leads[i].id);
      groups.push({
        primary: leads[i],
        duplicates,
        confidence: maxConfidence,
        matchedFields: Array.from(matchedFields),
      });
    }
  }

  return groups;
}

/**
 * Compare two leads and determine if they're duplicates.
 */
function comparLeads(a: Lead, b: Lead): { isDuplicate: boolean; confidence: number; fields: string[] } {
  let score = 0;
  const fields: string[] = [];

  // Exact name match (highest signal)
  if (a.businessName.toLowerCase().trim() === b.businessName.toLowerCase().trim()) {
    score += 40;
    fields.push('name');
  } else if (fuzzyNameMatch(a.businessName, b.businessName)) {
    score += 25;
    fields.push('name (fuzzy)');
  }

  // Phone match
  if (a.phone && b.phone) {
    const phoneA = normalizePhone(a.phone);
    const phoneB = normalizePhone(b.phone);
    if (phoneA === phoneB && phoneA.length >= 7) {
      score += 35;
      fields.push('phone');
    }
  }

  // Website match
  if (a.website && b.website) {
    const urlA = normalizeUrl(a.website);
    const urlB = normalizeUrl(b.website);
    if (urlA === urlB) {
      score += 30;
      fields.push('website');
    }
  }

  // Google Maps URL match (definitive)
  if (a.googleMapsUrl && b.googleMapsUrl && a.googleMapsUrl === b.googleMapsUrl) {
    score += 50;
    fields.push('mapsUrl');
  }

  // Address match
  if (a.fullAddress && b.fullAddress) {
    if (a.fullAddress.toLowerCase().trim() === b.fullAddress.toLowerCase().trim()) {
      score += 20;
      fields.push('address');
    }
  }

  // Threshold: 40+ is likely duplicate, 60+ is definite
  const confidence = Math.min(100, score);
  return { isDuplicate: score >= 40, confidence, fields };
}

/**
 * Fuzzy name matching using Levenshtein-inspired approach.
 */
function fuzzyNameMatch(a: string, b: string): boolean {
  const cleanA = a.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanB = b.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (cleanA === cleanB) return true;
  if (cleanA.includes(cleanB) || cleanB.includes(cleanA)) return true;

  // Simple edit distance check
  if (Math.abs(cleanA.length - cleanB.length) > 3) return false;

  let common = 0;
  const shorter = cleanA.length <= cleanB.length ? cleanA : cleanB;
  const longer = cleanA.length > cleanB.length ? cleanA : cleanB;

  for (const char of shorter) {
    if (longer.includes(char)) common++;
  }

  return common / shorter.length > 0.8;
}

/**
 * Merge duplicate leads, keeping the most complete data.
 */
export function mergeDuplicates(primary: Lead, duplicates: Lead[]): Lead {
  const merged = { ...primary };

  for (const dup of duplicates) {
    // Keep the data from whichever lead has more info
    if (!merged.phone && dup.phone) merged.phone = dup.phone;
    if (!merged.website && dup.website) merged.website = dup.website;
    if (!merged.fullAddress && dup.fullAddress) merged.fullAddress = dup.fullAddress;
    if ((merged.emails?.length || 0) === 0 && (dup.emails?.length || 0) > 0) merged.emails = dup.emails || [];
    if ((!merged.rating || merged.rating === 0) && dup.rating) merged.rating = dup.rating;
    if ((!merged.reviewCount || merged.reviewCount === 0) && dup.reviewCount) merged.reviewCount = dup.reviewCount;

    // Merge emails
    merged.emails = [...new Set([...(merged.emails || []), ...(dup.emails || [])])];

    // Merge social media
    for (const [key, value] of Object.entries(dup.socialMedia || {})) {
      if (value && !merged.socialMedia?.[key as keyof typeof merged.socialMedia]) {
        if (!merged.socialMedia) merged.socialMedia = { facebook: '', instagram: '', linkedin: '', twitter: '', youtube: '' };
        (merged.socialMedia as any)[key] = value;
      }
    }

    // Merge tags
    merged.tags = [...new Set([...(merged.tags || []), ...(dup.tags || [])])];
  }

  return merged;
}
