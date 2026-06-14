/* ============================================================
   LeadScaper Pro — Popup Component
   Quick-launch popup with compact scraping controls.
   ============================================================ */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Badge, Progress, StatCard } from '@/components/ui/SharedComponents';
import { useScraping } from '@/hooks/useScraping';
import { useTheme } from '@/hooks/useTheme';
import { getLastInputs } from '@/services/storage';
import { getLeadCount, getDashboardStats } from '@/services/database';
import type { Project } from '@/types';
import { formatNumber } from '@/utils/formatters';
import {
  Zap, Play, Pause, Square, ExternalLink, MapPin, Search,
  Users, Mail, Globe, Sun, Moon, ChevronRight,
} from 'lucide-react';

export default function Popup() {
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [leadsWithEmail, setLeadsWithEmail] = useState(0);
  const [leadsWithWebsite, setLeadsWithWebsite] = useState(0);
  const { isDark, setTheme } = useTheme();

  const {
    session, startScraping, pauseScraping, resumeScraping, stopScraping,
    isActive, isPaused,
  } = useScraping();

  useEffect(() => {
    // Load last used inputs
    getLastInputs().then(({ city: c, category: cat }) => {
      if (c) setCity(c);
      if (cat) setCategory(cat);
    });

    // Load stats
    getDashboardStats().then(stats => {
      setTotalLeads(stats.totalLeads);
      setLeadsWithEmail(stats.leadsWithEmail);
      setLeadsWithWebsite(stats.leadsWithWebsite);
    });

    // Load projects
    import('@/services/database').then(({ getAllProjects }) => {
      getAllProjects().then(setProjects);
    });
  }, []);

  function handleStart() {
    if (city.trim() && category.trim()) {
      startScraping(city.trim(), category.trim(), projectId || undefined);
    }
  }

  function openDashboard() {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/dashboard/index.html') });
  }

  function openSidePanel() {
    try {
      chrome.sidePanel.open({ windowId: undefined as any });
    } catch {
      // Fallback: open dashboard in new tab
      openDashboard();
    }
  }

  return (
    <div style={{ width: '360px', minHeight: '460px' }} className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border-secondary)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-brand">
            <Zap size={14} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[var(--text-primary)] leading-tight">LeadScaper Pro</h1>
            <a 
              href="https://www.devify.co.in" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[9px] text-[var(--text-tertiary)] hover:text-brand-400 transition-colors leading-tight block"
            >
              By Devify
            </a>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-[var(--border-secondary)]">
        <div className="text-center">
          <div className="text-lg font-bold text-[var(--text-primary)]">{formatNumber(totalLeads)}</div>
          <div className="text-[9px] text-[var(--text-tertiary)] uppercase flex items-center justify-center gap-0.5">
            <Users size={9} /> Leads
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-400">{formatNumber(leadsWithEmail)}</div>
          <div className="text-[9px] text-[var(--text-tertiary)] uppercase flex items-center justify-center gap-0.5">
            <Mail size={9} /> Emails
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-brand-400">{formatNumber(leadsWithWebsite)}</div>
          <div className="text-[9px] text-[var(--text-tertiary)] uppercase flex items-center justify-center gap-0.5">
            <Globe size={9} /> Websites
          </div>
        </div>
      </div>

      {/* Search Form */}
      <div className="px-4 py-4 space-y-3">
        <Input
          label="City"
          placeholder="e.g., Mumbai, India"
          value={city}
          onChange={e => setCity(e.target.value)}
          icon={<MapPin size={14} />}
          disabled={isActive}
        />
        <Input
          label="Business Category"
          placeholder="e.g., Dentist, Restaurant"
          value={category}
          onChange={e => setCategory(e.target.value)}
          icon={<Search size={14} />}
          disabled={isActive}
        />
        <div className="w-full">
          <label className="text-xs text-[var(--text-secondary)] mb-1 block">Project (Optional)</label>
          <select
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            disabled={isActive}
            className="w-full text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-xl px-3 py-2.5 focus:outline-none focus:border-brand-500 disabled:opacity-50"
          >
            <option value="">None</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {!isActive && !isPaused && (
            <Button
              variant="primary"
              icon={<Play size={14} />}
              onClick={handleStart}
              disabled={!city.trim() || !category.trim()}
              className="flex-1"
            >
              Start Scraping
            </Button>
          )}
          {isActive && (
            <>
              <Button variant="secondary" icon={<Pause size={14} />} onClick={pauseScraping} className="flex-1">
                Pause
              </Button>
              <Button variant="destructive" icon={<Square size={12} />} onClick={stopScraping}>
                Stop
              </Button>
            </>
          )}
          {isPaused && (
            <>
              <Button variant="primary" icon={<Play size={14} />} onClick={resumeScraping} className="flex-1">
                Resume
              </Button>
              <Button variant="destructive" icon={<Square size={12} />} onClick={stopScraping}>
                Stop
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Session Status */}
      <AnimatePresence>
        {session && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-3"
          >
            <div className="glass-card p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[var(--text-primary)]">
                  {session.leadsFound} leads found
                </span>
                <Badge variant={
                  session.status === 'scrolling' ? 'info' :
                  session.status === 'completed' ? 'success' :
                  session.status === 'paused' ? 'warning' : 'default'
                } size="sm">
                  {session.status}
                </Badge>
              </div>
              <Progress value={session.progress} showLabel size="sm" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Actions */}
      <div className="px-4 pb-4 pt-1 space-y-2">
        <button
          onClick={openDashboard}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors group"
        >
          <span className="flex items-center gap-2">
            <ExternalLink size={14} />
            Open Full Dashboard
          </span>
          <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    </div>
  );
}
