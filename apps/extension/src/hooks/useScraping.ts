/* ============================================================
   LeadScaper Pro — useScraping Hook
   ============================================================ */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ScrapingSession, Lead, LogEntry } from '@/types';
import { getScrapingSession } from '@/services/storage';
import { addLeads } from '@/services/database';
import { generateId } from '@/utils/constants';
import { supabase } from '@/services/supabase';

export function useScraping() {
  const [session, setSession] = useState<ScrapingSession | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const leadsRef = useRef<Lead[]>([]);

  // Restore session on mount
  useEffect(() => {
    getScrapingSession().then(saved => {
      if (saved) {
        setSession(saved);
        setLogs(saved.logs || []);
      }
    });
  }, []);

  // Listen for storage changes (session updates from service worker)
  useEffect(() => {
    const listener = (changes: { [key: string]: any }, area: string) => {
      if (area === 'session' && changes.leadscaper_session) {
        const newSession = changes.leadscaper_session.newValue;
        if (newSession) {
          setSession(newSession);
          if (newSession.logs) setLogs(newSession.logs);
        }
      }
    };

    try {
      chrome.storage.onChanged.addListener(listener);
      return () => chrome.storage.onChanged.removeListener(listener);
    } catch {
      return () => {};
    }
  }, []);

  // Listen for messages from service worker
  useEffect(() => {
    const messageListener = (message: any) => {
      if (message.type === 'LEADS_FOUND' && Array.isArray(message.payload)) {
        const newLeads = message.payload as Lead[];
        leadsRef.current = [...leadsRef.current, ...newLeads];
        setLeads([...leadsRef.current]);
      }

      if (message.type === 'EMAILS_FOUND' && message.payload) {
        const { leadId, emails, socialMedia } = message.payload;
        leadsRef.current = leadsRef.current.map(l =>
          l.id === leadId ? { ...l, emails: [...new Set([...l.emails, ...emails])], socialMedia: { ...l.socialMedia, ...socialMedia } } : l
        );
        setLeads([...leadsRef.current]);
      }

      if (message.type === 'SCRAPING_LOG' && message.payload) {
        setLogs(prev => [...prev.slice(-99), message.payload]);
      }
    };

    try {
      chrome.runtime.onMessage.addListener(messageListener);
      return () => chrome.runtime.onMessage.removeListener(messageListener);
    } catch {
      return () => {};
    }
  }, []);

  const startScraping = useCallback(async (city: string, category: string, projectId?: string) => {
    leadsRef.current = [];
    setLeads([]);
    setLogs([]);

    try {
      // 1. Fetch Subscription and Usage
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please log in to scrape leads.");
        return;
      }

      const [{ data: profile }, { data: member }] = await Promise.all([
        supabase.from('profiles').select('plan').eq('id', user.id).single(),
        supabase.from('workspace_members').select('workspace_id').eq('user_id', user.id).single()
      ]);

      const plan = profile?.plan || 'free';
      const workspaceId = member?.workspace_id;

      if (!workspaceId) {
        alert("Workspace not found.");
        return;
      }

      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const { data: usageLog } = await supabase
        .from('usage_logs')
        .select('leads_scraped')
        .eq('workspace_id', workspaceId)
        .eq('month', currentMonth)
        .single();

      const leadsScraped = usageLog?.leads_scraped || 0;
      
      const PLAN_LIMITS: Record<string, number> = {
        free: 100,
        starter: 2000,
        pro: 10000,
        agency: 50000,
      };

      const limit = PLAN_LIMITS[plan] || 100;

      if (leadsScraped >= limit) {
        alert(`You have reached your ${plan} plan limit of ${limit} leads this month. Please upgrade your plan in the dashboard.`);
        return;
      }

    } catch (err) {
      console.error('Failed to check usage limits:', err);
      alert('Failed to check usage limits. Please try again.');
      return;
    }

    const newSession: ScrapingSession = {
      id: generateId(),
      city,
      category,
      projectId,
      status: 'searching',
      leadsFound: 0,
      emailsFound: 0,
      progress: 0,
      startedAt: new Date().toISOString(),
      completedAt: null,
      errors: [],
      logs: [],
    };
    setSession(newSession);

    try {
      await chrome.runtime.sendMessage({
        type: 'START_SCRAPING',
        payload: { city, category, projectId },
      });
    } catch (err) {
      console.error('[LeadScaper] Failed to start scraping:', err);
    }
  }, []);

  const pauseScraping = useCallback(async () => {
    try {
      await chrome.runtime.sendMessage({ type: 'PAUSE_SCRAPING' });
    } catch (err) {
      console.error('[LeadScaper] Failed to pause:', err);
    }
  }, []);

  const resumeScraping = useCallback(async () => {
    try {
      await chrome.runtime.sendMessage({ type: 'RESUME_SCRAPING' });
    } catch (err) {
      console.error('[LeadScaper] Failed to resume:', err);
    }
  }, []);

  const stopScraping = useCallback(async () => {
    try {
      await chrome.runtime.sendMessage({ type: 'STOP_SCRAPING' });
    } catch (err) {
      console.error('[LeadScaper] Failed to stop:', err);
    }
  }, []);

  return {
    session,
    leads,
    logs,
    startScraping,
    pauseScraping,
    resumeScraping,
    stopScraping,
    isActive: session?.status === 'scrolling' || session?.status === 'searching' || session?.status === 'extracting',
    isPaused: session?.status === 'paused',
    isComplete: session?.status === 'completed' || session?.status === 'stopped',
  };
}
