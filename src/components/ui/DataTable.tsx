/* ============================================================
   LeadScaper Pro — DataTable Component
   Interactive data table with sorting, selection, and search.
   ============================================================ */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/formatters';
import { Badge, Skeleton } from './SharedComponents';
import type { Lead, SortConfig } from '@/types';
import {
  ArrowUpDown, ArrowUp, ArrowDown, Star, StarOff,
  ExternalLink, Mail, Phone, MapPin, Trash2, Copy, MoreHorizontal,
} from 'lucide-react';

interface DataTableProps {
  leads: Lead[];
  sort: SortConfig;
  onToggleSort: (key: keyof Lead) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

const columns: { key: keyof Lead; label: string; width: string; sortable: boolean }[] = [
  { key: 'businessName', label: 'Business', width: '220px', sortable: true },
  { key: 'category', label: 'Category', width: '120px', sortable: true },
  { key: 'rating', label: 'Rating', width: '80px', sortable: true },
  { key: 'reviewCount', label: 'Reviews', width: '90px', sortable: true },
  { key: 'phone', label: 'Phone', width: '140px', sortable: false },
  { key: 'emails', label: 'Email', width: '180px', sortable: false },
  { key: 'website', label: 'Website', width: '140px', sortable: false },
  { key: 'fullAddress', label: 'Address', width: '200px', sortable: false },
  { key: 'contacted', label: 'WhatsApp', width: '110px', sortable: true },
  { key: 'status', label: 'Status', width: '80px', sortable: true },
];

export default function DataTable({
  leads,
  sort,
  onToggleSort,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onToggleFavorite,
  onDelete,
  isLoading,
}: DataTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const allSelected = (leads?.length || 0) > 0 && selectedIds.size === (leads?.length || 0);

  if (isLoading) {
    return (
      <div className="glass-card overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton width="20px" height="20px" />
              <Skeleton width="200px" height="20px" />
              <Skeleton width="100px" height="20px" />
              <Skeleton width="60px" height="20px" />
              <Skeleton width="80px" height="20px" />
              <Skeleton width="120px" height="20px" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => allSelected ? onDeselectAll() : onSelectAll()}
                  className="rounded border-[var(--border-primary)] accent-brand-500"
                />
              </th>
              <th style={{ width: '40px' }}>★</th>
              {columns.map(col => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && onToggleSort(col.key)}
                  className={cn(col.sortable && 'cursor-pointer hover:text-[var(--text-primary)]')}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      sort.key === col.key ? (
                        sort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                      ) : (
                        <ArrowUpDown size={12} className="opacity-30" />
                      )
                    )}
                  </span>
                </th>
              ))}
              <th style={{ width: '60px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {(leads || []).map((lead, index) => (
                <React.Fragment key={lead.id}>
                  <motion.tr
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: Math.min(index * 0.02, 0.3) }}
                    className={cn(
                      selectedIds.has(lead.id) && 'selected',
                      'cursor-pointer'
                    )}
                    onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                  >
                    <td onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(lead.id)}
                        onChange={() => onToggleSelect(lead.id)}
                        className="rounded border-[var(--border-primary)] accent-brand-500"
                      />
                    </td>
                    <td onClick={e => { e.stopPropagation(); onToggleFavorite(lead.id); }}>
                      {lead.isFavorite ? (
                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      ) : (
                        <StarOff size={14} className="text-[var(--text-tertiary)] hover:text-yellow-400" />
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {lead.thumbnailUrl ? (
                          <img src={lead.thumbnailUrl} alt="Logo" className="w-8 h-8 rounded-full object-cover border border-[var(--border-primary)] flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex items-center justify-center text-xs font-bold text-[var(--text-tertiary)] flex-shrink-0">
                            {lead.businessName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-[var(--text-primary)] truncate max-w-[150px]" title={lead.businessName}>
                          {lead.businessName}
                        </span>
                      </div>
                    </td>
                    <td>
                      <Badge variant="default">{lead.category || '—'}</Badge>
                    </td>
                    <td>
                      {lead.rating !== null ? (
                        <span className="inline-flex items-center gap-1">
                          <Star size={12} className="text-yellow-400 fill-yellow-400" />
                          <span className="font-medium">{lead.rating.toFixed(1)}</span>
                        </span>
                      ) : '—'}
                    </td>
                    <td className="text-[var(--text-secondary)]">
                      {lead.reviewCount !== null ? lead.reviewCount.toLocaleString() : '—'}
                    </td>
                    <td>
                      {lead.phone ? (
                        <span className="inline-flex items-center gap-1 text-[var(--text-secondary)]">
                          <Phone size={11} />
                          <span className="truncate max-w-[110px]">{lead.phone}</span>
                        </span>
                      ) : <span className="text-[var(--text-tertiary)]">—</span>}
                    </td>
                    <td>
                      {(lead.emails?.length || 0) > 0 ? (
                        <span className="inline-flex items-center gap-1 text-green-400">
                          <Mail size={11} />
                          <span className="truncate max-w-[150px]">{lead.emails?.[0]}</span>
                          {(lead.emails?.length || 0) > 1 && (
                            <Badge variant="info" size="sm">+{lead.emails!.length - 1}</Badge>
                          )}
                        </span>
                      ) : <span className="text-[var(--text-tertiary)]">—</span>}
                    </td>
                    <td>
                      {lead.website ? (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 truncate max-w-[120px]"
                        >
                          <ExternalLink size={11} />
                          <span className="truncate">{new URL(lead.website).hostname.replace('www.', '')}</span>
                        </a>
                      ) : <span className="text-[var(--text-tertiary)]">—</span>}
                    </td>
                    <td>
                      {lead.fullAddress ? (
                        <span className="inline-flex items-center gap-1 text-[var(--text-secondary)]">
                          <MapPin size={11} />
                          <span className="truncate max-w-[170px]">{lead.fullAddress}</span>
                        </span>
                      ) : <span className="text-[var(--text-tertiary)]">—</span>}
                    </td>
                    <td>
                      <Badge variant={lead.contacted ? 'success' : 'default'}>
                        {lead.contacted ? 'Contacted' : 'Pending'}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={lead.status === 'open' ? 'success' : lead.status === 'closed' ? 'error' : 'default'}>
                        {lead.status}
                      </Badge>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onDelete(lead.id)}
                          className="p-1 rounded-lg text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete lead"
                        >
                          <Trash2 size={14} />
                        </button>
                        {lead.googleMapsUrl && (
                          <a
                            href={lead.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-lg text-[var(--text-tertiary)] hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
                            title="Open in Maps"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </td>
                  </motion.tr>

                  {/* Expanded row details */}
                  {expandedId === lead.id && (
                    <motion.tr
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <td colSpan={columns.length + 3} className="!p-0">
                        <div className="bg-[var(--bg-tertiary)] px-8 py-4 border-t border-[var(--border-secondary)]">
                          <div className="grid grid-cols-3 gap-6 text-sm">
                            <div>
                              <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-2">Contact</h4>
                              <div className="space-y-1">
                                <p><span className="text-[var(--text-tertiary)]">Phone:</span> {lead.phone || '—'}</p>
                                <p><span className="text-[var(--text-tertiary)]">Website:</span> {lead.website || '—'}</p>
                                <p><span className="text-[var(--text-tertiary)]">Emails:</span> {(lead.emails || []).join(', ') || '—'}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-2">Location</h4>
                              <div className="space-y-1">
                                <p><span className="text-[var(--text-tertiary)]">Address:</span> {lead.fullAddress || '—'}</p>
                                <p><span className="text-[var(--text-tertiary)]">City:</span> {lead.city || '—'}</p>
                                <p><span className="text-[var(--text-tertiary)]">Coordinates:</span> {lead.latitude && lead.longitude ? `${lead.latitude}, ${lead.longitude}` : '—'}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-2">Social</h4>
                              <div className="space-y-1">
                                {Object.entries(lead.socialMedia || {}).map(([platform, url]) => (
                                  <p key={platform}>
                                    <span className="text-[var(--text-tertiary)] capitalize">{platform}:</span>{' '}
                                    {url ? (
                                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">Link</a>
                                    ) : '—'}
                                  </p>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </React.Fragment>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {(leads?.length || 0) === 0 && (
        <div className="text-center py-12 text-[var(--text-tertiary)]">
          <p className="text-sm">No leads found</p>
        </div>
      )}
    </div>
  );
}
