/* ============================================================
   LeadScaper Pro — Plan Definitions & Limits
   ============================================================ */

import type { PlanTier, PlanLimits } from '../types';

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    leadsPerMonth: 100,
    maxProjects: 1,
    csvExport: true,
    xlsxExport: false,
    jsonExport: false,
    whatsapp: false,
    emailDiscovery: false,
    teamMembers: 0,
    apiAccess: false,
    priceMonthly: 0,
    priceYearly: 0,
  },
  starter: {
    leadsPerMonth: 2000,
    maxProjects: -1,
    csvExport: true,
    xlsxExport: true,
    jsonExport: true,
    whatsapp: true,
    emailDiscovery: false,
    teamMembers: 0,
    apiAccess: false,
    priceMonthly: 999,
    priceYearly: 9990,
  },
  pro: {
    leadsPerMonth: 10000,
    maxProjects: -1,
    csvExport: true,
    xlsxExport: true,
    jsonExport: true,
    whatsapp: true,
    emailDiscovery: true,
    teamMembers: 0,
    apiAccess: false,
    priceMonthly: 2999,
    priceYearly: 29990,
  },
  agency: {
    leadsPerMonth: 50000,
    maxProjects: -1,
    csvExport: true,
    xlsxExport: true,
    jsonExport: true,
    whatsapp: true,
    emailDiscovery: true,
    teamMembers: 10,
    apiAccess: true,
    priceMonthly: 9999,
    priceYearly: 99990,
  },
};

export const PLAN_NAMES: Record<PlanTier, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  agency: 'Agency',
};

export const PLAN_DESCRIPTIONS: Record<PlanTier, string> = {
  free: 'Get started with basic lead generation',
  starter: 'For growing businesses with more leads',
  pro: 'Advanced tools for serious lead generation',
  agency: 'Enterprise features for agencies & teams',
};

export const PLAN_FEATURES: Record<PlanTier, string[]> = {
  free: [
    '100 Leads / Month',
    '1 Project',
    'CSV Export',
    'Basic Dashboard',
    'Chrome Extension',
  ],
  starter: [
    '2,000 Leads / Month',
    'Unlimited Projects',
    'CSV + Excel + JSON Export',
    'WhatsApp Campaigns',
    'Import from CSV/Excel',
    'Advanced Filters',
  ],
  pro: [
    '10,000 Leads / Month',
    'Unlimited Projects',
    'All Export Formats',
    'WhatsApp Campaigns',
    'Email Discovery',
    'Advanced Analytics',
    'Priority Support',
  ],
  agency: [
    '50,000 Leads / Month',
    'Unlimited Projects',
    'All Export Formats',
    'WhatsApp Campaigns',
    'Email Discovery',
    'Advanced Analytics',
    'Up to 10 Team Members',
    'White-Label Reports',
    'API Access',
    'Dedicated Support',
  ],
};

export const PLAN_ORDER: PlanTier[] = ['free', 'starter', 'pro', 'agency'];

/** Returns true if planA is higher tier than planB */
export function isHigherPlan(planA: PlanTier, planB: PlanTier): boolean {
  return PLAN_ORDER.indexOf(planA) > PLAN_ORDER.indexOf(planB);
}

/** Returns true if the plan allows the specified feature */
export function planHasFeature(
  plan: PlanTier,
  feature: keyof Omit<PlanLimits, 'leadsPerMonth' | 'maxProjects' | 'teamMembers' | 'priceMonthly' | 'priceYearly'>
): boolean {
  return PLAN_LIMITS[plan][feature] as boolean;
}
