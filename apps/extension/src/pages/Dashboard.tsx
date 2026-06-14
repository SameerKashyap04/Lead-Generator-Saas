/* ============================================================
   LeadScaper Pro — Dashboard Page
   ============================================================ */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { StatCard, Card, Badge, Skeleton } from '@/components/ui/SharedComponents';
import { getDashboardStats } from '@/services/database';
import { formatNumber, timeAgo } from '@/utils/formatters';
import type { DashboardStats } from '@/types';
import {
  Users, Mail, Globe, Star, Download, FolderOpen,
  Phone, TrendingUp, BarChart3, PieChart,
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setIsLoading(true);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const successRate = stats
    ? stats.totalLeads > 0
      ? Math.round((stats.leadsWithEmail / stats.totalLeads) * 100)
      : 0
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Overview of your lead generation performance</p>
        </div>
        <Badge variant="brand" size="md">
          <span className="status-dot online mr-2" />
          Live
        </Badge>
      </motion.div>

      {/* Stat Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-5">
              <Skeleton width="32px" height="32px" rounded className="mb-3" />
              <Skeleton width="60px" height="28px" className="mb-1" />
              <Skeleton width="80px" height="14px" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            label="Total Leads"
            value={formatNumber(stats?.totalLeads ?? 0)}
            icon={<Users size={18} />}
            delay={0}
          />
          <StatCard
            label="With Email"
            value={formatNumber(stats?.leadsWithEmail ?? 0)}
            icon={<Mail size={18} />}
            trend={stats?.totalLeads ? `${Math.round(((stats?.leadsWithEmail ?? 0) / stats.totalLeads) * 100)}%` : undefined}
            trendUp
            delay={1}
          />
          <StatCard
            label="With Website"
            value={formatNumber(stats?.leadsWithWebsite ?? 0)}
            icon={<Globe size={18} />}
            delay={2}
          />
          <StatCard
            label="Avg Rating"
            value={stats?.averageRating?.toFixed(1) ?? '0.0'}
            icon={<Star size={18} />}
            delay={3}
          />
          <StatCard
            label="Exports"
            value={formatNumber(stats?.totalExports ?? 0)}
            icon={<Download size={18} />}
            delay={4}
          />
          <StatCard
            label="Success Rate"
            value={`${successRate}%`}
            icon={<TrendingUp size={18} />}
            trend={successRate > 50 ? '↑ Good' : '↓ Low'}
            trendUp={successRate > 50}
            delay={5}
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <PieChart size={16} className="text-brand-400" />
              Category Distribution
            </h3>
          </div>
          {stats && Object.keys(stats.categoryCounts).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.categoryCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([category, count], index) => {
                  const maxCount = Math.max(...Object.values(stats.categoryCounts));
                  const percentage = Math.round((count / maxCount) * 100);
                  return (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <span className="text-xs text-[var(--text-secondary)] min-w-[100px] truncate">
                        {category || 'Unknown'}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.6, delay: index * 0.05 }}
                          className="h-full rounded-full"
                          style={{
                            background: `hsl(${240 + index * 15}, 65%, 60%)`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono text-[var(--text-tertiary)] min-w-[30px] text-right">
                        {count}
                      </span>
                    </motion.div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-8">
              No data yet. Start scraping to see category distribution.
            </p>
          )}
        </Card>

        {/* Quick Stats */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <BarChart3 size={16} className="text-brand-400" />
              Data Quality
            </h3>
          </div>
          {stats && stats.totalLeads > 0 ? (
            <div className="space-y-4">
              {[
                { label: 'Has Email', value: stats.leadsWithEmail, total: stats.totalLeads, color: '#22c55e' },
                { label: 'Has Website', value: stats.leadsWithWebsite, total: stats.totalLeads, color: '#6366f1' },
                { label: 'Has Phone', value: stats.leadsWithPhone, total: stats.totalLeads, color: '#06b6d4' },
              ].map((item, index) => {
                const pct = Math.round((item.value / item.total) * 100);
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-[var(--text-secondary)]">{item.label}</span>
                      <span className="font-medium text-[var(--text-primary)]">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                    </div>
                  </motion.div>
                );
              })}

              <div className="mt-6 pt-4 border-t border-[var(--border-secondary)]">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-[var(--text-primary)]">{stats.totalProjects}</div>
                    <div className="text-xs text-[var(--text-tertiary)] flex items-center justify-center gap-1 mt-0.5">
                      <FolderOpen size={11} /> Projects
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-[var(--text-primary)]">{stats.leadsWithPhone}</div>
                    <div className="text-xs text-[var(--text-tertiary)] flex items-center justify-center gap-1 mt-0.5">
                      <Phone size={11} /> With Phone
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-8">
              No data yet. Start scraping to see data quality metrics.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
