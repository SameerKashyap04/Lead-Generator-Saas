/* ============================================================
   LeadScaper Pro — Scraper Page
   The main scraping interface with controls, logs, and table.
   ============================================================ */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DataTable from '@/components/ui/DataTable';
import { Card, Badge, Progress, EmptyState } from '@/components/ui/SharedComponents';
import { useScraping } from '@/hooks/useScraping';
import { useLeads } from '@/hooks/useLeads';
import { useDebounce } from '@/hooks/useDebounce';
import { exportLeads, copyLeadsToClipboard } from '@/services/export';
import { cn } from '@/utils/formatters';
import { BUSINESS_CATEGORIES } from '@/utils/constants';
import type { ExportFormat, Project } from '@/types';
import {
  Search, MapPin, Play, Pause, Square, RotateCcw,
  Download, Copy, Filter, X, ChevronDown,
  Zap, Globe, Mail, Star, Phone, SlidersHorizontal, RefreshCw, Trash2,
} from 'lucide-react';

interface ScraperProps {
  onToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function Scraper({ onToast }: ScraperProps) {
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [showCategories, setShowCategories] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const logEndRef = useRef<HTMLDivElement>(null);

  const [projectId, setProjectId] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const loadProjects = () => {
      import('@/services/database').then(({ getAllProjects }) => {
        getAllProjects().then(setProjects);
      });
    };
    loadProjects();

    const listener = (msg: any) => {
      if (msg.type === 'PROJECT_UPDATED') {
        loadProjects();
      }
    };
    try {
      chrome.runtime.onMessage.addListener(listener);
      return () => chrome.runtime.onMessage.removeListener(listener);
    } catch {
      return () => {};
    }
  }, []);

  const {
    session, leads: scrapedLeads, logs,
    startScraping, pauseScraping, resumeScraping, stopScraping,
    isActive, isPaused, isComplete,
  } = useScraping();

  const {
    leads: filteredLeads, filters, setFilters,
    sort, toggleSort, selectedIds, toggleSelect,
    selectAll, deselectAll, toggleFavorite, deleteLead,
    deleteSelected, addLeadsToState, isLoading,
  } = useLeads();

  // Sync scraped leads to the leads hook
  useEffect(() => {
    if (scrapedLeads.length > 0) {
      addLeadsToState(scrapedLeads);
    }
  }, [scrapedLeads.length]);

  // Update search filter
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearch }));
  }, [debouncedSearch, setFilters]);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const filteredCategories = BUSINESS_CATEGORIES.filter(c =>
    c.toLowerCase().includes(category.toLowerCase())
  );

  async function handleStart() {
    if (!projectId) {
      onToast?.('Please select or create a project before scraping', 'error');
      return;
    }
    if (!city.trim() || !category.trim()) {
      onToast?.('Please enter both city and category', 'warning');
      return;
    }
    await startScraping(city.trim(), category.trim(), projectId);
    onToast?.(`Scraping started: ${category} in ${city}`, 'info');
  }

  async function handleExport() {
    const leadsToExport = selectedIds.size > 0
      ? filteredLeads.filter(l => selectedIds.has(l.id))
      : filteredLeads;

    if (leadsToExport.length === 0) {
      onToast?.('No leads to export', 'warning');
      return;
    }

    await exportLeads(leadsToExport, exportFormat, filters);
    onToast?.(`Exported ${leadsToExport.length} leads as ${exportFormat.toUpperCase()}`, 'success');
  }

  async function handleCopy() {
    const leadsToCopy = selectedIds.size > 0
      ? filteredLeads.filter(l => selectedIds.has(l.id))
      : filteredLeads.slice(0, 50);

    await copyLeadsToClipboard(leadsToCopy);
    onToast?.(`Copied ${leadsToCopy.length} leads to clipboard`, 'success');
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Scraper</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Extract business leads from Google Maps</p>
        </div>
        
        {/* Real-time Project Stats */}
        {projectId && projects.find(p => p.id === projectId) && (
          <div className="flex items-center gap-4 bg-[var(--bg-secondary)] px-4 py-2 rounded-xl border border-[var(--border-primary)]">
            <div className="flex flex-col">
              <span className="text-xs text-[var(--text-tertiary)] uppercase font-semibold">Current Project</span>
              <span className="text-sm font-medium text-brand-400 truncate max-w-[150px]">
                {projects.find(p => p.id === projectId)?.name}
              </span>
            </div>
            <div className="w-px h-8 bg-[var(--border-primary)]" />
            <div className="flex flex-col">
              <span className="text-xs text-[var(--text-tertiary)] uppercase font-semibold">Session</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {session?.leadsFound || 0} saved
              </span>
            </div>
            <div className="w-px h-8 bg-[var(--border-primary)]" />
            <div className="flex flex-col">
              <span className="text-xs text-[var(--text-tertiary)] uppercase font-semibold">Total</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {projects.find(p => p.id === projectId)?.leadCount || 0} leads
              </span>
            </div>
          </div>
        )}

        {isActive && (
          <Badge variant="success" size="md">
            <span className="status-dot pending mr-2" />
            Scraping…
          </Badge>
        )}
      </motion.div>

      {/* Search Controls */}
      <Card className="relative z-50 !overflow-visible">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              label="City"
              placeholder="e.g., Mumbai, India"
              value={city}
              onChange={e => setCity(e.target.value)}
              icon={<MapPin size={16} />}
              disabled={isActive}
            />
          </div>
          <div className="flex-1 relative z-50">
            <Input
              label="Business Category"
              placeholder="e.g., Dentist, Restaurant"
              value={category}
              onChange={e => { setCategory(e.target.value); setShowCategories(true); }}
              onFocus={() => setShowCategories(true)}
              onBlur={() => setTimeout(() => setShowCategories(false), 200)}
              icon={<Search size={16} />}
              disabled={isActive}
            />
            {/* Category Suggestions */}
            <AnimatePresence>
              {showCategories && filteredCategories.length > 0 && category.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full left-0 right-0 mt-1 glass-card p-1 max-h-48 overflow-y-auto z-30"
                >
                  {filteredCategories.slice(0, 8).map(cat => (
                    <button
                      key={cat}
                      onMouseDown={() => { setCategory(cat); setShowCategories(false); }}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-colors"
                    >
                      {cat}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="w-48">
            <label className="text-xs text-[var(--text-secondary)] mb-1 block">Select Project (Required)</label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              disabled={isActive}
              className="w-full text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-xl px-3 py-2.5 focus:outline-none focus:border-brand-500 disabled:opacity-50"
            >
              <option value="">-- Select Project --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            {!isActive && !isPaused && (
              <Button
                variant="primary"
                icon={<Play size={16} />}
                onClick={handleStart}
                disabled={!city.trim() || !category.trim()}
              >
                Start Scraping
              </Button>
            )}
            {isActive && (
              <Button variant="secondary" icon={<Pause size={16} />} onClick={pauseScraping}>
                Pause
              </Button>
            )}
            {isPaused && (
              <Button variant="primary" icon={<Play size={16} />} onClick={resumeScraping}>
                Resume
              </Button>
            )}
            {session && session.failedCount !== undefined && session.failedCount > 0 && !isActive && !isPaused && (
              <Button variant="outline" icon={<RefreshCw size={14} />} onClick={() => chrome.runtime.sendMessage({ type: 'RETRY_FAILED' })}>
                Retry Failed
              </Button>
            )}
            {(isActive || isPaused) && (
              <Button variant="destructive" icon={<Square size={14} />} onClick={stopScraping}>
                Stop
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Progress & Status */}
      <AnimatePresence>
        {session && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-brand-400" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {session.leadsFound} leads found
                    </span>
                  </div>
                  <Badge variant={
                    session.status === 'scrolling' ? 'info' :
                    session.status === 'extracting' ? 'info' :
                    session.status === 'completed' ? 'success' :
                    session.status === 'error' ? 'error' :
                    session.status === 'paused' ? 'warning' : 'default'
                  }>
                    {session.status}
                  </Badge>
                </div>
                <span className="text-xs text-[var(--text-tertiary)] font-mono">
                  {session.city} · {session.category}
                </span>
              </div>

              {session.currentlyScraping && (
                <div className="mb-4 p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-secondary)]">
                  <p className="text-xs text-[var(--text-secondary)] mb-1 uppercase tracking-wider font-semibold">Currently Scraping</p>
                  <p className="text-sm text-[var(--text-primary)] truncate font-medium">{session.currentlyScraping}</p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="flex flex-col p-2 bg-[var(--bg-secondary)] rounded-lg">
                   <span className="text-xs text-[var(--text-tertiary)] uppercase">Phones</span>
                   <span className="text-lg font-semibold text-[var(--text-primary)]">{session.phonesFound ?? 0}</span>
                </div>
                <div className="flex flex-col p-2 bg-[var(--bg-secondary)] rounded-lg">
                   <span className="text-xs text-[var(--text-tertiary)] uppercase">Websites</span>
                   <span className="text-lg font-semibold text-[var(--text-primary)]">{session.websitesFound ?? 0}</span>
                </div>
                <div className="flex flex-col p-2 bg-[var(--bg-secondary)] rounded-lg">
                   <span className="text-xs text-[var(--text-tertiary)] uppercase">Emails</span>
                   <span className="text-lg font-semibold text-brand-400">{session.emailsFound ?? 0}</span>
                </div>
                <div className="flex flex-col p-2 bg-[var(--bg-secondary)] rounded-lg">
                   <span className="text-xs text-[var(--text-tertiary)] uppercase">Failed</span>
                   <span className="text-lg font-semibold text-red-400">{session.failedCount ?? 0}</span>
                </div>
              </div>

              <Progress value={session.progress} showLabel size="md" />

              {/* Live Logs */}
              {logs.length > 0 && (
                <div className="log-console mt-4">
                  {logs.slice(-20).map(log => (
                    <div key={log.id} className={cn('log-entry', log.type)}>
                      <span className="text-[var(--text-tertiary)] shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span>{log.message}</span>
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              icon={<Search size={14} />}
            />
          </div>
          <Button
            variant={showFilters ? 'outline' : 'ghost'}
            size="sm"
            icon={<SlidersHorizontal size={14} />}
            onClick={() => setShowFilters(p => !p)}
          >
            Filters
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <>
              <span className="text-xs text-[var(--text-secondary)]">
                {selectedIds.size} selected
              </span>
              <Button variant="destructive" size="sm" icon={<Trash2 size={14} />} onClick={deleteSelected}>
                Delete
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" icon={<Copy size={14} />} onClick={handleCopy}>
            Copy
          </Button>

          <div className="relative group">
            <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={handleExport}>
              Export {exportFormat.toUpperCase()}
            </Button>
          </div>

          <select
            value={exportFormat}
            onChange={e => setExportFormat(e.target.value as ExportFormat)}
            className="text-xs bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-primary)] rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-500"
          >
            <option value="csv">CSV</option>
            <option value="xlsx">Excel</option>
            <option value="json">JSON</option>
          </select>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="!p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1 block">Min Rating</label>
                  <select
                    value={filters.minRating ?? ''}
                    onChange={e => setFilters(prev => ({ ...prev, minRating: e.target.value ? Number(e.target.value) : null }))}
                    className="w-full text-xs bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-500"
                  >
                    <option value="">Any</option>
                    <option value="3">3+ ★</option>
                    <option value="3.5">3.5+ ★</option>
                    <option value="4">4+ ★</option>
                    <option value="4.5">4.5+ ★</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1 block">Min Reviews</label>
                  <select
                    value={filters.minReviews ?? ''}
                    onChange={e => setFilters(prev => ({ ...prev, minReviews: e.target.value ? Number(e.target.value) : null }))}
                    className="w-full text-xs bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-500"
                  >
                    <option value="">Any</option>
                    <option value="5">5+</option>
                    <option value="10">10+</option>
                    <option value="50">50+</option>
                    <option value="100">100+</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1 block">Has Website</label>
                  <select
                    value={filters.hasWebsite === null ? '' : filters.hasWebsite.toString()}
                    onChange={e => setFilters(prev => ({ ...prev, hasWebsite: e.target.value === '' ? null : e.target.value === 'true' }))}
                    className="w-full text-xs bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-500"
                  >
                    <option value="">Any</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1 block">Has Email</label>
                  <select
                    value={filters.hasEmail === null ? '' : filters.hasEmail.toString()}
                    onChange={e => setFilters(prev => ({ ...prev, hasEmail: e.target.value === '' ? null : e.target.value === 'true' }))}
                    className="w-full text-xs bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-500"
                  >
                    <option value="">Any</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1 block">Status</label>
                  <select
                    value={filters.status}
                    onChange={e => setFilters(prev => ({ ...prev, status: e.target.value as 'open' | 'closed' | 'all' }))}
                    className="w-full text-xs bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-500"
                  >
                    <option value="all">All</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<X size={14} />}
                    onClick={() => setFilters({
                      search: searchQuery,
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
                    })}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data Table */}
      <DataTable
        leads={filteredLeads}
        sort={sort}
        onToggleSort={toggleSort}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onSelectAll={selectAll}
        onDeselectAll={deselectAll}
        onToggleFavorite={toggleFavorite}
        onDelete={deleteLead}
        isLoading={isLoading}
      />

      {/* Quick Stats Bar */}
      {filteredLeads.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between glass-card px-4 py-3"
        >
          <div className="flex items-center gap-6 text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5">
              <Globe size={12} /> {filteredLeads.filter(l => l.website).length} with website
            </span>
            <span className="flex items-center gap-1.5">
              <Mail size={12} /> {filteredLeads.filter(l => (l.emails?.length || 0) > 0).length} with email
            </span>
            <span className="flex items-center gap-1.5">
              <Phone size={12} /> {filteredLeads.filter(l => l.phone).length} with phone
            </span>
            <span className="flex items-center gap-1.5">
              <Star size={12} /> Avg {(filteredLeads.filter(l => l.rating).reduce((a, l) => a + (l.rating ?? 0), 0) / Math.max(filteredLeads.filter(l => l.rating).length, 1)).toFixed(1)} ★
            </span>
          </div>
          <span className="text-xs font-mono text-[var(--text-tertiary)]">
            {filteredLeads.length} leads
          </span>
        </motion.div>
      )}
    </div>
  );
}
