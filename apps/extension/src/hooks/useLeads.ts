/* ============================================================
   LeadScaper Pro — useLeads Hook
   ============================================================ */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Lead, FilterState, SortConfig } from '@/types';
import { getAllLeads, deleteLead, deleteLeads, toggleFavorite, updateLead } from '@/services/database';
import { DEFAULT_FILTER_STATE } from '@/utils/constants';

export function useLeads() {
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [sort, setSort] = useState<SortConfig>({ key: 'scrapedAt', direction: 'desc' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load leads on mount
  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const leads = await getAllLeads();
      setAllLeads(leads);
    } catch (err) {
      console.error('[LeadScaper] Failed to load leads:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filtered and sorted leads
  const filteredLeads = useMemo(() => {
    let result = [...allLeads];

    // Apply filters
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(l =>
        l.businessName.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        (l.fullAddress?.toLowerCase().includes(q) ?? false) ||
        (l.phone?.includes(q) ?? false) ||
        l.emails.some(e => e.toLowerCase().includes(q))
      );
    }

    if (filters.minRating !== null) {
      result = result.filter(l => (l.rating ?? 0) >= filters.minRating!);
    }

    if (filters.maxRating !== null) {
      result = result.filter(l => (l.rating ?? 5) <= filters.maxRating!);
    }

    if (filters.minReviews !== null) {
      result = result.filter(l => (l.reviewCount ?? 0) >= filters.minReviews!);
    }

    if (filters.hasWebsite === true) {
      result = result.filter(l => !!l.website);
    } else if (filters.hasWebsite === false) {
      result = result.filter(l => !l.website);
    }

    if (filters.hasEmail === true) {
      result = result.filter(l => l.emails.length > 0);
    } else if (filters.hasEmail === false) {
      result = result.filter(l => l.emails.length === 0);
    }

    if (filters.hasPhone === true) {
      result = result.filter(l => !!l.phone);
    }

    if (filters.status !== 'all') {
      result = result.filter(l => l.status === filters.status);
    }

    if (filters.category) {
      result = result.filter(l => l.category.toLowerCase().includes(filters.category!.toLowerCase()));
    }

    if (filters.tags.length > 0) {
      result = result.filter(l => filters.tags.some(t => l.tags.includes(t)));
    }

    if (filters.projectId) {
      result = result.filter(l => l.projectId === filters.projectId);
    }

    if (filters.isFavorite === true) {
      result = result.filter(l => l.isFavorite);
    }

    // Apply sorting
    result.sort((a, b) => {
      const aVal = a[sort.key];
      const bVal = b[sort.key];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let cmp = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        cmp = aVal.localeCompare(bVal);
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }

      return sort.direction === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [allLeads, filters, sort]);

  const handleToggleFavorite = useCallback(async (id: string) => {
    await toggleFavorite(id);
    setAllLeads(prev => prev.map(l => l.id === id ? { ...l, isFavorite: !l.isFavorite } : l));
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await deleteLead(id);
    setAllLeads(prev => prev.filter(l => l.id !== id));
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    const ids = Array.from(selectedIds);
    await deleteLeads(ids);
    setAllLeads(prev => prev.filter(l => !selectedIds.has(l.id)));
    setSelectedIds(new Set());
  }, [selectedIds]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredLeads.map(l => l.id)));
  }, [filteredLeads]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const toggleSort = useCallback((key: keyof Lead) => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const addLeadsToState = useCallback((newLeads: Lead[]) => {
    setAllLeads(prev => [...prev, ...newLeads]);
  }, []);

  return {
    leads: filteredLeads,
    allLeads,
    filters,
    setFilters,
    sort,
    toggleSort,
    selectedIds,
    toggleSelect,
    selectAll,
    deselectAll,
    isLoading,
    loadLeads,
    toggleFavorite: handleToggleFavorite,
    deleteLead: handleDelete,
    deleteSelected: handleDeleteSelected,
    addLeadsToState,
  };
}
