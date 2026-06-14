/* ============================================================
   LeadScaper Pro — Settings Page
   ============================================================ */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import { Card, Switch, Badge } from '@/components/ui/SharedComponents';
import { getSettings, saveSettings } from '@/services/storage';
import { clearAllData, deleteOldLeads, removeDuplicates } from '@/services/database';
import type { Settings } from '@/types';
import { cn } from '@/utils/formatters';
import {
  Sun, Moon, Monitor, Gauge, Download, Shield, Trash2,
  Zap, AlertTriangle, Info, Keyboard, Heart, MessageCircle,
} from 'lucide-react';

interface SettingsProps {
  onToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function SettingsPage({ onToast }: SettingsProps) {
  const [settings, setSettingsState] = useState<Settings | null>(null);

  useEffect(() => {
    getSettings().then(setSettingsState);
  }, []);

  async function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    setSettingsState(updated);
    await saveSettings({ [key]: value });
  }

  async function handleClearData() {
    if (confirm('Are you sure you want to delete ALL leads, projects, and export history? This cannot be undone.')) {
      await clearAllData();
      onToast?.('All data cleared', 'info');
    }
  }

  async function handleRemoveDuplicates() {
    const count = await removeDuplicates();
    onToast?.(`Removed ${count} duplicate leads`, 'success');
  }

  async function handleCleanOldData() {
    const days = settings?.dataRetentionDays ?? 90;
    const count = await deleteOldLeads(days);
    onToast?.(`Removed ${count} leads older than ${days} days`, 'info');
  }

  if (!settings) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Configure your LeadScaper Pro experience</p>
      </motion.div>

      {/* Theme */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Sun size={16} className="text-brand-400" />
            Appearance
          </h3>
          <div className="flex gap-3">
            {([
              { value: 'light' as const, icon: <Sun size={16} />, label: 'Light' },
              { value: 'dark' as const, icon: <Moon size={16} />, label: 'Dark' },
              { value: 'system' as const, icon: <Monitor size={16} />, label: 'System' },
            ]).map(({ value, icon, label }) => (
              <button
                key={value}
                onClick={() => {
                  updateSetting('theme', value);
                  // Apply theme immediately
                  const root = document.documentElement;
                  if (value === 'dark') root.classList.add('dark');
                  else if (value === 'light') root.classList.remove('dark');
                  else {
                    if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark');
                    else root.classList.remove('dark');
                  }
                }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                  settings.theme === value
                    ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-transparent hover:border-[var(--border-primary)]'
                )}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Scraping Speed */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-2">
            <Gauge size={16} className="text-brand-400" />
            Scraping Speed
          </h3>
          <p className="text-xs text-[var(--text-tertiary)] mb-4">
            Faster speeds may trigger rate limiting. Moderate is recommended.
          </p>
          <div className="flex gap-3">
            {([
              { value: 'slow' as const, label: 'Slow', desc: '4s delay' },
              { value: 'moderate' as const, label: 'Moderate', desc: '2.5s delay' },
              { value: 'fast' as const, label: 'Fast', desc: '1.2s delay' },
            ]).map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => updateSetting('scrapingSpeed', value)}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                  settings.scrapingSpeed === value
                    ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-transparent hover:border-[var(--border-primary)]'
                )}
              >
                <span>{label}</span>
                <span className="text-[10px] text-[var(--text-tertiary)]">{desc}</span>
              </button>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Export Preferences */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Download size={16} className="text-brand-400" />
            Export Preferences
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-2 block">Default Export Format</label>
              <div className="flex gap-3">
                {(['csv', 'xlsx', 'json'] as const).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => updateSetting('exportFormat', fmt)}
                    className={cn(
                      'px-4 py-2 rounded-xl text-sm font-medium uppercase transition-all',
                      settings.exportFormat === fmt
                        ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-transparent'
                    )}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-[var(--text-primary)]">Auto-save Progress</span>
                <p className="text-xs text-[var(--text-tertiary)]">Save scraping progress periodically</p>
              </div>
              <Switch checked={settings.autoSaveProgress} onChange={v => updateSetting('autoSaveProgress', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-[var(--text-primary)]">Show Notifications</span>
                <p className="text-xs text-[var(--text-tertiary)]">Toast notifications for scraping events</p>
              </div>
              <Switch checked={settings.showNotifications} onChange={v => updateSetting('showNotifications', v)} />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* WhatsApp Settings */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
        <Card>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <MessageCircle size={16} className="text-green-500" />
            WhatsApp Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-2 block">Preferred Mode</label>
              <div className="flex gap-3">
                {(['web', 'desktop'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => updateSetting('whatsAppMode', mode)}
                    className={cn(
                      'px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all',
                      (settings.whatsAppMode || 'web') === mode
                        ? 'bg-green-500/15 text-green-500 border border-green-500/30'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-transparent'
                    )}
                  >
                    WhatsApp {mode}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-2">
                WhatsApp Web ensures links open properly in a Chrome tab without triggering OS prompts.
              </p>
            </div>
            
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-2 block">Default Country Code</label>
              <div className="relative w-32">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">+</span>
                <input 
                  type="text" 
                  value={settings.defaultCountryCode || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    updateSetting('defaultCountryCode', val);
                  }}
                  className="w-full px-3 py-2 pl-7 rounded-xl text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  placeholder="e.g. 91"
                />
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-2">
                Used to format local numbers automatically (e.g. 91 for India, 44 for UK, 1 for USA).
              </p>
            </div>
            <div className="pt-4 border-t border-[var(--border-secondary)]">
              <label className="text-xs text-[var(--text-secondary)] mb-2 block">Messaging Mode</label>
              <div className="flex gap-3 mb-2">
                {(['manual', 'auto'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => updateSetting('whatsappSendMode', mode)}
                    className={cn(
                      'px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all',
                      (settings.whatsappSendMode || 'manual') === mode
                        ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-transparent'
                    )}
                  >
                    {mode === 'manual' ? 'Manual (Click-to-Chat)' : 'Auto-Sender (DOM)'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--text-tertiary)]">
                Auto-Sender uses DOM manipulation to type and send messages automatically. <span className="text-red-400">High risk of WhatsApp ban if overused!</span>
              </p>
            </div>

            <div className="pt-4 border-t border-[var(--border-secondary)]">
              <label className="text-xs text-[var(--text-secondary)] mb-2 block">Device Operating System</label>
              <div className="flex gap-3 mb-2">
                {(['mac', 'windows'] as const).map(os => (
                  <button
                    key={os}
                    onClick={() => updateSetting('osType', os)}
                    className={cn(
                      'px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all',
                      (settings.osType || 'mac') === os
                        ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-transparent'
                    )}
                  >
                    {os === 'mac' ? 'Macbook / macOS' : 'Windows PC'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--text-tertiary)]">
                Used to correctly simulate paragraph spacing (Shift+Enter vs Line Break) during Auto-Sending.
              </p>
            </div>

            {settings.whatsappSendMode === 'auto' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-red-500/5 border border-red-500/20 rounded-xl mt-4">
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-2 block">Daily Limit (Max Messages)</label>
                  <input 
                    type="number" 
                    min="1"
                    max="150"
                    value={settings.whatsappDailyLimit || 40}
                    onChange={(e) => updateSetting('whatsappDailyLimit', parseInt(e.target.value) || 40)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-brand-500"
                  />
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-1">Recommended: max 40-50/day</p>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-2 block">Min Delay (sec)</label>
                  <input 
                    type="number" 
                    min="5"
                    value={settings.whatsappMinDelay || 30}
                    onChange={(e) => updateSetting('whatsappMinDelay', parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-2 block">Max Delay (sec)</label>
                  <input 
                    type="number" 
                    min="10"
                    value={settings.whatsappMaxDelay || 120}
                    onChange={(e) => updateSetting('whatsappMaxDelay', parseInt(e.target.value) || 120)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Data Retention */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Shield size={16} className="text-brand-400" />
            Data Management
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-2 block">Data Retention</label>
              <select
                value={settings.dataRetentionDays}
                onChange={e => updateSetting('dataRetentionDays', Number(e.target.value))}
                className="text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
              >
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
                <option value={365}>1 year</option>
                <option value={99999}>Forever</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="secondary" size="sm" icon={<Zap size={14} />} onClick={async () => {
                const { getLastSessionId } = await import('@/services/storage');
                const { deleteLeadsBySession } = await import('@/services/database');
                const lastSessionId = await getLastSessionId();
                if (!lastSessionId) {
                  onToast?.('No recent session found to undo', 'warning');
                  return;
                }
                if (confirm('Are you sure you want to undo the last scrape? This will delete all leads collected in that session.')) {
                  const count = await deleteLeadsBySession(lastSessionId);
                  onToast?.(`Deleted ${count} leads from the last session`, 'success');
                }
              }}>
                Undo Last Scrape
              </Button>
              <Button variant="secondary" size="sm" icon={<Zap size={14} />} onClick={handleRemoveDuplicates}>
                Remove Duplicates
              </Button>
              <Button variant="secondary" size="sm" icon={<Trash2 size={14} />} onClick={handleCleanOldData}>
                Clean Old Data
              </Button>
              <Button variant="destructive" size="sm" icon={<AlertTriangle size={14} />} onClick={handleClearData}>
                Clear All Data
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Keyboard Shortcuts */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Keyboard size={16} className="text-brand-400" />
            Keyboard Shortcuts
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { keys: '⌘ + S', action: 'Start/Stop scraping' },
              { keys: '⌘ + E', action: 'Export leads' },
              { keys: '⌘ + F', action: 'Search leads' },
              { keys: '⌘ + A', action: 'Select all' },
              { keys: 'Esc', action: 'Clear selection' },
              { keys: '⌘ + D', action: 'Toggle dark mode' },
            ].map(({ keys, action }) => (
              <div key={keys} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--bg-tertiary)]">
                <span className="text-xs text-[var(--text-secondary)]">{action}</span>
                <kbd className="text-[10px] font-mono text-[var(--text-tertiary)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded border border-[var(--border-primary)]">
                  {keys}
                </kbd>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* About */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <div className="text-center py-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mb-3 shadow-brand">
              <Zap size={24} className="text-white" />
            </div>
            <div className="p-4 bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-secondary)]">
              <h3 className="font-semibold text-[var(--text-primary)]">LeadScaper Pro</h3>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">v1.0.0</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
