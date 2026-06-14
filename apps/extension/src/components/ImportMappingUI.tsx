import React from 'react';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { type Lead } from '@/types';

interface ImportMappingUIProps {
  fileHeaders: string[];
  mapping: Record<string, string>;
  onMappingChange: (targetField: string, sourceHeader: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const TARGET_FIELDS = [
  { key: 'phone', label: 'Phone Number (Required)', required: true },
  { key: 'businessName', label: 'Business Name', required: false },
  { key: 'email', label: 'Email Address', required: false },
  { key: 'website', label: 'Website', required: false },
  { key: 'city', label: 'City', required: false },
  { key: 'category', label: 'Category', required: false },
  { key: 'address', label: 'Address', required: false }
];

export function ImportMappingUI({
  fileHeaders,
  mapping,
  onMappingChange,
  onConfirm,
  onCancel
}: ImportMappingUIProps) {
  
  // Check if required fields are mapped
  const isPhoneMapped = !!mapping['phone'];

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
          <ArrowRight size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Map Your Columns</h3>
          <p className="text-sm text-[var(--text-secondary)]">Match the columns from your file to our system fields.</p>
        </div>
      </div>

      <div className="space-y-4 my-6 bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-secondary)]">
        {TARGET_FIELDS.map(field => (
          <div key={field.key} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center p-3 hover:bg-[var(--bg-primary)] rounded-lg transition-colors border border-transparent hover:border-[var(--border-secondary)]">
            <div className="flex items-center gap-2">
              <span className={`font-medium ${field.required ? 'text-brand-400' : 'text-[var(--text-primary)]'}`}>
                {field.label}
              </span>
              {field.required && !mapping[field.key] && (
                <AlertCircle size={14} className="text-red-400" />
              )}
            </div>
            
            <select
              value={mapping[field.key] || ''}
              onChange={(e) => onMappingChange(field.key, e.target.value)}
              className={`w-full bg-[var(--bg-secondary)] border text-sm rounded-lg p-2.5 outline-none transition-all ${
                field.required && !mapping[field.key]
                  ? 'border-red-500/50 focus:border-red-500'
                  : 'border-[var(--border-secondary)] focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50'
              } text-[var(--text-primary)]`}
            >
              <option value="">-- Ignore this field --</option>
              {fileHeaders.map(header => (
                <option key={header} value={header}>{header}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[var(--border-secondary)]">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          Cancel Import
        </button>
        <button
          onClick={onConfirm}
          disabled={!isPhoneMapped}
          className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-brand-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Preview Data <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
