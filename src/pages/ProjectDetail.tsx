/* ============================================================
   LeadScaper Pro — Project Detail Page
   Shows all leads belonging to a specific project with search,
   filters, and export capability.
   ============================================================ */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DataTable from '@/components/ui/DataTable';
import { Card, Badge, EmptyState, Progress } from '@/components/ui/SharedComponents';
import {
  getLeadsByProject, getProjectStats, getAllProjects,
  deleteLead, deleteLeads, toggleFavorite,
} from '@/services/database';
import { exportLeads, copyLeadsToClipboard } from '@/services/export';
import { useDebounce } from '@/hooks/useDebounce';
import { cn, timeAgo } from '@/utils/formatters';
import type { Lead, Project, ExportFormat, SortConfig } from '@/types';
import {
  ArrowLeft, Search, Download, Copy, Users, Mail, Phone,
  Globe, Star, Filter, X, Trash2, ChevronDown, MessageCircle,
} from 'lucide-react';

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
  onToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onCreateWhatsAppCampaign?: (projectId: string) => void;
}

export default function ProjectDetail({ projectId, onBack, onToast, onCreateWhatsAppCampaign }: ProjectDetailProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState({ totalLeads: 0, totalEmails: 0, totalPhones: 0, validWhatsAppLeadCount: 0, contactedCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortConfig>({ key: 'scrapedAt', direction: 'desc' });

  // Filters
  const [filterHasPhone, setFilterHasPhone] = useState<boolean | null>(null);
  const [filterHasEmail, setFilterHasEmail] = useState<boolean | null>(null);
  const [filterHasWebsite, setFilterHasWebsite] = useState<boolean | null>(null);
  const [filterMinRating, setFilterMinRating] = useState<number | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [projects, projectLeads, projectStats] = await Promise.all([
        getAllProjects(),
        getLeadsByProject(projectId),
        getProjectStats(projectId),
      ]);
      const proj = projects.find(p => p.id === projectId);
      setProject(proj || null);
      setLeads(projectLeads);
      setStats(projectStats as any); // Type cast due to added stats
    } catch (err) {
      console.error('[ProjectDetail] Failed to load:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen for real-time updates
  useEffect(() => {
    const listener = (msg: any) => {
      if (msg.type === 'PROJECT_UPDATED' || msg.type === 'LEADS_FOUND') {
        loadData();
      }
    };
    try {
      chrome.runtime.onMessage.addListener(listener);
      return () => chrome.runtime.onMessage.removeListener(listener);
    } catch {
      return () => {};
    }
  }, [loadData]);

  // Filtered and sorted leads
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Search
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(l =>
        l.businessName.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        (l.fullAddress?.toLowerCase().includes(q) ?? false) ||
        (l.phone?.includes(q) ?? false) ||
        (l.emails || []).some(e => e.toLowerCase().includes(q))
      );
    }

    // Filters
    if (filterHasPhone === true) result = result.filter(l => !!l.phone);
    if (filterHasEmail === true) result = result.filter(l => (l.emails?.length || 0) > 0);
    if (filterHasWebsite === true) result = result.filter(l => !!l.website);
    if (filterMinRating !== null) result = result.filter(l => (l.rating ?? 0) >= filterMinRating);

    // Sort
    result.sort((a, b) => {
      const aVal = a[sort.key];
      const bVal = b[sort.key];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      let cmp = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') cmp = aVal.localeCompare(bVal);
      else if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal).localeCompare(String(bVal));
      return sort.direction === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [leads, debouncedSearch, filterHasPhone, filterHasEmail, filterHasWebsite, filterMinRating, sort]);

  const toggleSort = useCallback((key: keyof Lead) => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredLeads.map(l => l.id)));
  }, [filteredLeads]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  async function handleDeleteSelected() {
    const ids = Array.from(selectedIds);
    await deleteLeads(ids);
    setSelectedIds(new Set());
    onToast?.(`Deleted ${ids.length} leads`, 'info');
    loadData();
  }

  async function handleExport() {
    const leadsToExport = selectedIds.size > 0
      ? filteredLeads.filter(l => selectedIds.has(l.id))
      : filteredLeads;

    if (leadsToExport.length === 0) {
      onToast?.('No leads to export', 'warning');
      return;
    }

    await exportLeads(leadsToExport, exportFormat);
    onToast?.(`Exported ${leadsToExport.length} leads as ${exportFormat.toUpperCase()}`, 'success');
  }

  async function handleCopy() {
    const leadsToCopy = selectedIds.size > 0
      ? filteredLeads.filter(l => selectedIds.has(l.id))
      : filteredLeads.slice(0, 50);

    await copyLeadsToClipboard(leadsToCopy);
    onToast?.(`Copied ${leadsToCopy.length} leads to clipboard`, 'success');
  }

  const hasActiveFilters = filterHasPhone !== null || filterHasEmail !== null || filterHasWebsite !== null || filterMinRating !== null;

  function clearFilters() {
    setFilterHasPhone(null);
    setFilterHasEmail(null);
    setFilterHasWebsite(null);
    setFilterMinRating(null);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-[var(--text-secondary)]">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <EmptyState
        icon={<Search size={32} />}
        title="Project not found"
        description="This project may have been deleted."
        action={<Button variant="primary" onClick={onBack}>Back to Projects</Button>}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to Projects
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: project.color }}
            >
              {project.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">{project.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onCreateWhatsAppCampaign && (
              <Button
                variant="ghost"
                icon={<MessageCircle size={14} className="text-green-500" />}
                onClick={() => onCreateWhatsAppCampaign(project.id)}
                className="text-green-500 hover:text-green-400 hover:bg-green-500/10 mr-2 border border-green-500/20"
              >
                WhatsApp Campaign
              </Button>
            )}
            <Button variant="ghost" icon={<Copy size={14} />} onClick={handleCopy}>
              Copy
            </Button>
            <div className="flex items-center gap-1 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
              {(['csv', 'xlsx', 'json'] as ExportFormat[]).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setExportFormat(fmt)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                    exportFormat === fmt
                      ? 'bg-brand-500/15 text-brand-400'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                  )}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
            <Button variant="primary" icon={<Download size={14} />} onClick={handleExport}>
              Export
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
              <Users size={18} />
            </span>
            <div>
              <div className="text-xl font-bold text-[var(--text-primary)]">{stats.totalLeads}</div>
              <div className="text-xs text-[var(--text-tertiary)] uppercase">Total Leads</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-green-500/10 text-green-400">
              <Mail size={18} />
            </span>
            <div>
              <div className="text-xl font-bold text-[var(--text-primary)]">{stats.totalEmails}</div>
              <div className="text-xs text-[var(--text-tertiary)] uppercase">With Email</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Phone size={18} />
            </span>
            <div>
              <div className="text-xl font-bold text-[var(--text-primary)]">{stats.totalPhones}</div>
              <div className="text-xs text-[var(--text-tertiary)] uppercase">With Phone</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Globe size={18} />
            </span>
            <div>
              <div className="text-xl font-bold text-[var(--text-primary)]">
                {leads.filter(l => !!l.website).length}
              </div>
              <div className="text-xs text-[var(--text-tertiary)] uppercase">With Website</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search leads by name, phone, email, address..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showFilters ? 'secondary' : 'ghost'}
              icon={<Filter size={14} />}
              onClick={() => setShowFilters(p => !p)}
            >
              Filters
              {hasActiveFilters && (
                <span className="ml-1 w-2 h-2 rounded-full bg-brand-400 inline-block" />
              )}
            </Button>
            {selectedIds.size > 0 && (
              <Button variant="destructive" icon={<Trash2 size={14} />} onClick={handleDeleteSelected}>
                Delete {selectedIds.size}
              </Button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-[var(--border-secondary)]"
            >
              <div className="flex flex-wrap gap-3 items-center">
                <button
                  onClick={() => setFilterHasPhone(filterHasPhone === true ? null : true)}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded-lg border transition-colors',
                    filterHasPhone === true
                      ? 'bg-brand-500/15 text-brand-400 border-brand-500/30'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-brand-500/30'
                  )}
                >
                  📞 Has Phone
                </button>
                <button
                  onClick={() => setFilterHasEmail(filterHasEmail === true ? null : true)}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded-lg border transition-colors',
                    filterHasEmail === true
                      ? 'bg-brand-500/15 text-brand-400 border-brand-500/30'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-brand-500/30'
                  )}
                >
                  📧 Has Email
                </button>
                <button
                  onClick={() => setFilterHasWebsite(filterHasWebsite === true ? null : true)}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded-lg border transition-colors',
                    filterHasWebsite === true
                      ? 'bg-brand-500/15 text-brand-400 border-brand-500/30'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-brand-500/30'
                  )}
                >
                  🌐 Has Website
                </button>
                <select
                  value={filterMinRating ?? ''}
                  onChange={e => setFilterMinRating(e.target.value ? Number(e.target.value) : null)}
                  className="px-3 py-1.5 text-xs rounded-lg border bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-primary)]"
                >
                  <option value="">⭐ Any Rating</option>
                  <option value="3">3+ Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                </select>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                    Clear all
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Leads Table */}
      {filteredLeads.length === 0 ? (
        <EmptyState
          icon={<Search size={32} />}
          title={leads.length === 0 ? 'No leads in this project yet' : 'No matching leads'}
          description={
            leads.length === 0
              ? 'Go to the Scraper page, select this project, and start scraping to populate it with leads.'
              : 'Try adjusting your search or filters.'
          }
        />
      ) : (
        <Card className="!p-0 !overflow-visible">
          <div className="px-5 py-3 border-b border-[var(--border-secondary)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
              </span>
              {selectedIds.size > 0 && (
                <Badge variant="brand" size="sm">{selectedIds.size} selected</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={selectedIds.size === filteredLeads.length ? deselectAll : selectAll}
                className="text-xs text-[var(--text-secondary)] hover:text-brand-400 transition-colors"
              >
                {selectedIds.size === filteredLeads.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>
          </div>
          <DataTable
            leads={filteredLeads}
            sort={sort}
            onToggleSort={toggleSort}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onSelectAll={selectAll}
            onDeselectAll={deselectAll}
            onToggleFavorite={async (id) => { await toggleFavorite(id); loadData(); }}
            onDelete={async (id) => { await deleteLead(id); loadData(); onToast?.('Lead deleted', 'info'); }}
          />
        </Card>
      )}
    </div>
  );
}
