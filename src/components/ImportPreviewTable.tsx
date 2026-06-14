import React from 'react';
import { type CampaignRecipient } from '@/types';
import { Phone, Mail, Globe, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/utils/formatters';

interface ImportPreviewTableProps {
  data: Partial<CampaignRecipient>[];
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  duplicatesRemoved: number;
}

export function ImportPreviewTable({
  data,
  totalRecords,
  validRecords,
  invalidRecords,
  duplicatesRemoved
}: ImportPreviewTableProps) {
  // Ensure data is an array
  const safeData = Array.isArray(data) ? data : [];
  // Only show first 50 for preview
  const previewData = safeData.slice(0, 50);

  return (
    <div className="space-y-4 mt-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-secondary)]">
          <div className="text-xs text-[var(--text-secondary)] mb-1">Total Records</div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{totalRecords}</div>
        </div>
        <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/20">
          <div className="text-xs text-green-400 mb-1">Valid Records</div>
          <div className="text-2xl font-bold text-green-400">{validRecords}</div>
        </div>
        <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20">
          <div className="text-xs text-red-400 mb-1">Invalid Records</div>
          <div className="text-2xl font-bold text-red-400">{invalidRecords}</div>
        </div>
        <div className="bg-orange-500/10 p-4 rounded-xl border border-orange-500/20">
          <div className="text-xs text-orange-400 mb-1">Duplicates Removed</div>
          <div className="text-2xl font-bold text-orange-400">{duplicatesRemoved}</div>
        </div>
      </div>

      <div className="bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-xl overflow-hidden shadow-xl">
        <div className="px-4 py-3 border-b border-[var(--border-secondary)] bg-[var(--bg-tertiary)] flex justify-between items-center">
          <h3 className="font-semibold text-sm text-[var(--text-primary)]">Data Preview (First 50)</h3>
        </div>
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-[var(--bg-tertiary)] sticky top-0 z-10">
              <tr>
                <th className="p-3 text-[var(--text-secondary)] font-medium whitespace-nowrap">Status</th>
                <th className="p-3 text-[var(--text-secondary)] font-medium whitespace-nowrap">Business Name</th>
                <th className="p-3 text-[var(--text-secondary)] font-medium whitespace-nowrap">Phone</th>
                <th className="p-3 text-[var(--text-secondary)] font-medium whitespace-nowrap">Email / Web</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-secondary)]">
              {previewData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[var(--text-tertiary)]">
                    No data to preview
                  </td>
                </tr>
              ) : (
                previewData.map((row, idx) => {
                  const isValid = !!row.phone;
                  return (
                    <tr key={idx} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                      <td className="p-3">
                        {isValid ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/10 text-green-400 text-xs font-medium">
                            <CheckCircle2 size={14} /> Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/10 text-red-400 text-xs font-medium">
                            <XCircle size={14} /> Invalid (No Phone)
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-[var(--text-primary)] max-w-[200px] truncate">
                        {row.businessName || '-'}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 text-[var(--text-secondary)] font-mono">
                          <Phone size={14} className="opacity-50" />
                          {row.phone || <span className="text-red-400">Missing</span>}
                        </div>
                      </td>
                      <td className="p-3 text-[var(--text-secondary)]">
                        <div className="flex flex-col gap-1">
                          {row.email && (
                            <div className="flex items-center gap-2 max-w-[200px] truncate">
                              <Mail size={12} className="opacity-50 flex-shrink-0" />
                              <span className="truncate text-xs">{row.email}</span>
                            </div>
                          )}
                          {row.website && (
                            <div className="flex items-center gap-2 max-w-[200px] truncate">
                              <Globe size={12} className="opacity-50 flex-shrink-0" />
                              <span className="truncate text-xs">{row.website}</span>
                            </div>
                          )}
                          {!row.email && !row.website && '-'}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
