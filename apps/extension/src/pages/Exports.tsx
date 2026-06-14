/* ============================================================
   LeadScaper Pro — Exports Page
   ============================================================ */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import { Card, Badge, EmptyState } from '@/components/ui/SharedComponents';
import { getAllExportRecords, deleteExportRecord } from '@/services/database';
import { getAllLeads } from '@/services/database';
import { exportLeads } from '@/services/export';
import { timeAgo } from '@/utils/formatters';
import type { ExportRecord, ExportFormat } from '@/types';
import {
  Download, FileSpreadsheet, FileJson, FileText, Trash2,
  Clock, Package, RefreshCw,
} from 'lucide-react';

interface ExportsProps {
  onToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const formatIcons: Record<ExportFormat, React.ReactNode> = {
  csv: <FileText size={18} className="text-green-400" />,
  xlsx: <FileSpreadsheet size={18} className="text-blue-400" />,
  json: <FileJson size={18} className="text-yellow-400" />,
};

const formatColors: Record<ExportFormat, string> = {
  csv: 'success',
  xlsx: 'info',
  json: 'warning',
};

export default function Exports({ onToast }: ExportsProps) {
  const [records, setRecords] = useState<ExportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadRecords();
  }, []);

  async function loadRecords() {
    setIsLoading(true);
    try {
      const data = await getAllExportRecords();
      setRecords(data);
    } catch (err) {
      console.error('Failed to load exports:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleQuickExport(format: ExportFormat) {
    setIsExporting(true);
    try {
      const leads = await getAllLeads();
      if ((leads?.length || 0) === 0) {
        onToast?.('No leads to export', 'warning');
        return;
      }
      await exportLeads(leads, format);
      onToast?.(`Exported ${leads.length} leads as ${format.toUpperCase()}`, 'success');
      loadRecords();
    } catch (err) {
      onToast?.('Export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteExportRecord(id);
    setRecords(prev => prev.filter(r => r.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Exports</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Download your leads in multiple formats</p>
        </div>
      </motion.div>

      {/* Quick Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {([
          { format: 'csv' as ExportFormat, title: 'CSV Export', desc: 'Comma-separated values for spreadsheets' },
          { format: 'xlsx' as ExportFormat, title: 'Excel Export', desc: 'Formatted Excel workbook with auto-sized columns' },
          { format: 'json' as ExportFormat, title: 'JSON Export', desc: 'Structured JSON data for developers' },
        ]).map(({ format, title, desc }, index) => (
          <motion.div
            key={format}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hoverable className="!p-6">
              <div className="flex items-center gap-3 mb-3">
                {formatIcons[format]}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
                  <p className="text-xs text-[var(--text-tertiary)]">{desc}</p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={<Download size={14} />}
                onClick={() => handleQuickExport(format)}
                isLoading={isExporting}
                className="w-full mt-2"
              >
                Export All Leads
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Export History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Clock size={16} className="text-brand-400" />
            Export History
          </h2>
          <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={loadRecords}>
            Refresh
          </Button>
        </div>

        {(records?.length || 0) === 0 && !isLoading ? (
          <EmptyState
            icon={<Package size={32} />}
            title="No exports yet"
            description="Export your leads to CSV, Excel, or JSON using the cards above."
          />
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {(records || []).map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="!p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {formatIcons[record.format]}
                      <div>
                        <div className="text-sm font-medium text-[var(--text-primary)]">{record.fileName}</div>
                        <div className="text-xs text-[var(--text-tertiary)] flex items-center gap-2">
                          <span>{record.leadCount} leads</span>
                          <span>·</span>
                          <span>{timeAgo(record.exportedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={formatColors[record.format] as any} size="sm">
                        {record.format.toUpperCase()}
                      </Badge>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
