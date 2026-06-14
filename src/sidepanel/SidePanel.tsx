/* ============================================================
   LeadScaper Pro — Side Panel Component
   Compact scraping view for Chrome's side panel.
   ============================================================ */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Badge, Progress } from '@/components/ui/SharedComponents';
import { useScraping } from '@/hooks/useScraping';
import { useTheme } from '@/hooks/useTheme';
import { exportLeads, copyLeadsToClipboard } from '@/services/export';
import type { Project } from '@/types';
import { cn } from '@/utils/formatters';
import {
  Zap, Play, Pause, Square, MapPin, Search,
  Download, Copy, ExternalLink, Star, Mail, Phone,
  Sun, Moon,
} from 'lucide-react';

export default function SidePanel() {
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const { isDark, setTheme } = useTheme();

  const {
    session, leads, logs,
    startScraping, pauseScraping, resumeScraping, stopScraping,
    isActive, isPaused, isComplete,
  } = useScraping();

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    import('@/services/database').then(({ getAllProjects }) => {
      getAllProjects().then(setProjects);
    });
  }, [logs]);

  function handleStart() {
    if (city.trim() && category.trim()) {
      startScraping(city.trim(), category.trim(), projectId || undefined);
    }
  }

  async function handleExport() {
    if (leads.length > 0) {
      await exportLeads(leads, 'csv');
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border-secondary)] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <Zap size={12} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-tight">LeadScaper Pro</span>
            <a 
              href="https://www.devify.co.in" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[10px] text-[var(--text-tertiary)] hover:text-brand-400 transition-colors leading-tight"
            >
              By Devify
            </a>
          </div>
        </div>
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>

      {/* Search Inputs */}
      <div className="px-4 py-3 space-y-2 flex-shrink-0 border-b border-[var(--border-secondary)]">
        <Input
          placeholder="City (e.g., Mumbai)"
          value={city}
          onChange={e => setCity(e.target.value)}
          icon={<MapPin size={13} />}
          disabled={isActive}
        />
        <Input
          placeholder="Category (e.g., Dentist)"
          value={category}
          onChange={e => setCategory(e.target.value)}
          icon={<Search size={13} />}
          disabled={isActive}
        />
        <div className="w-full">
          <select
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            disabled={isActive}
            className="w-full text-xs bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500 disabled:opacity-50"
          >
            <option value="">No Project (Optional)</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          {!isActive && !isPaused && (
            <Button variant="primary" size="sm" icon={<Play size={13} />} onClick={handleStart} className="flex-1"
              disabled={!city.trim() || !category.trim()}>
              Start
            </Button>
          )}
          {isActive && (
            <>
              <Button variant="secondary" size="sm" icon={<Pause size={13} />} onClick={pauseScraping} className="flex-1">Pause</Button>
              <Button variant="destructive" size="sm" icon={<Square size={11} />} onClick={stopScraping}>Stop</Button>
            </>
          )}
          {isPaused && (
            <>
              <Button variant="primary" size="sm" icon={<Play size={13} />} onClick={resumeScraping} className="flex-1">Resume</Button>
              <Button variant="destructive" size="sm" icon={<Square size={11} />} onClick={stopScraping}>Stop</Button>
            </>
          )}
        </div>
      </div>

      {/* Progress */}
      {session && (
        <div className="px-4 py-2 border-b border-[var(--border-secondary)] flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium">{session.leadsFound} leads</span>
            <Badge variant={session.status === 'scrolling' ? 'info' : session.status === 'completed' ? 'success' : 'default'} size="sm">
              {session.status}
            </Badge>
          </div>
          <Progress value={session.progress} size="sm" />
        </div>
      )}

      {/* Logs */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {logs.length > 0 ? (
          <div className="space-y-0.5 font-mono text-[11px]">
            {logs.slice(-50).map(log => (
              <div key={log.id} className={cn(
                'py-0.5 flex items-start gap-1.5',
                log.type === 'success' && 'text-green-400',
                log.type === 'error' && 'text-red-400',
                log.type === 'warning' && 'text-yellow-400',
                log.type === 'info' && 'text-cyan-400',
              )}>
                <span className="text-[var(--text-tertiary)] shrink-0 text-[10px]">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="leading-tight">{log.message}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-[var(--text-tertiary)]">
            Enter a city and category to start scraping
          </div>
        )}
      </div>

      {/* Lead List (compact) */}
      {leads.length > 0 && (
        <div className="border-t border-[var(--border-secondary)] max-h-[200px] overflow-y-auto flex-shrink-0">
          {leads.slice(-20).map(lead => (
            <div key={lead.id} className="px-4 py-2 border-b border-[var(--border-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors">
              <div className="text-xs font-medium text-[var(--text-primary)] truncate">{lead.businessName}</div>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[var(--text-tertiary)]">
                {lead.rating && <span className="flex items-center gap-0.5"><Star size={9} className="text-yellow-400" /> {lead.rating}</span>}
                {lead.phone && <span className="flex items-center gap-0.5"><Phone size={9} /> {lead.phone}</span>}
                {lead.emails.length > 0 && <span className="flex items-center gap-0.5 text-green-400"><Mail size={9} /> {lead.emails[0]}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {leads.length > 0 && (
        <div className="px-4 py-2 border-t border-[var(--border-secondary)] flex gap-2 flex-shrink-0">
          <Button variant="secondary" size="sm" icon={<Download size={13} />} onClick={handleExport} className="flex-1">
            Export CSV
          </Button>
          <Button variant="ghost" size="sm" icon={<Copy size={13} />} onClick={() => copyLeadsToClipboard(leads)}>
            Copy
          </Button>
        </div>
      )}
    </div>
  );
}
