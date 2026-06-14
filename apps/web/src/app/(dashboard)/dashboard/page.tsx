"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Mail,
  Globe,
  Star,
  Download,
  FolderOpen,
  Phone,
  TrendingUp,
  BarChart3,
  PieChart,
  MessageSquare,
  CreditCard,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  delay?: number;
  gradient?: string;
}

function StatCard({ label, value, icon, trend, trendUp, delay = 0, gradient }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.08 }}
      className="p-5 rounded-xl transition-all hover:-translate-y-0.5"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-primary)",
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
        style={{
          background: gradient || "var(--bg-active)",
          color: gradient ? "white" : "var(--brand-400)",
        }}
      >
        {icon}
      </div>
      <div className="text-2xl font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>
        {value}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {label}
        </span>
        {trend && (
          <span
            className="text-[10px] font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
            style={{
              background: trendUp ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              color: trendUp ? "var(--success)" : "var(--error)",
            }}
          >
            {trendUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {trend}
          </span>
        )}
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div
      className="p-5 rounded-xl"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-primary)",
      }}
    >
      <div className="skeleton w-9 h-9 rounded-lg mb-3" />
      <div className="skeleton w-16 h-7 rounded mb-1" />
      <div className="skeleton w-20 h-4 rounded" />
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<{
    totalLeads: number;
    leadsThisMonth: number;
    totalProjects: number;
    totalCampaigns: number;
    leadsWithEmail: number;
    leadsWithPhone: number;
    leadsWithWebsite: number;
    totalExports: number;
    avgRating: number;
    categoryCounts: Record<string, number>;
    plan: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get workspace
      const { data: membership } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (!membership) return;

      const wsId = membership.workspace_id;

      // Fetch counts
      const [
        { count: totalLeads },
        { count: totalProjects },
        { count: totalCampaigns },
        { count: totalExports },
        { data: profileData },
      ] = await Promise.all([
        supabase.from("leads").select("*", { count: "exact", head: true }).eq("workspace_id", wsId),
        supabase.from("projects").select("*", { count: "exact", head: true }).eq("workspace_id", wsId),
        supabase.from("campaigns").select("*", { count: "exact", head: true }).eq("workspace_id", wsId),
        supabase.from("exports").select("*", { count: "exact", head: true }).eq("workspace_id", wsId),
        supabase.from("profiles").select("plan").eq("id", user.id).single(),
      ]);

      // Get leads with details for this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: leadsThisMonth } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", wsId)
        .gte("created_at", startOfMonth.toISOString());

      // Get leads details
      const { data: leads } = await supabase
        .from("leads")
        .select("emails, phone, website, rating, category")
        .eq("workspace_id", wsId);

      const leadsWithEmail = leads?.filter(l => l.emails && l.emails.length > 0).length || 0;
      const leadsWithPhone = leads?.filter(l => l.phone).length || 0;
      const leadsWithWebsite = leads?.filter(l => l.website).length || 0;
      const ratings = leads?.filter(l => l.rating != null).map(l => l.rating as number) || [];
      const avgRating = ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : 0;

      const categoryCounts: Record<string, number> = {};
      leads?.forEach(l => {
        if (l.category) {
          categoryCounts[l.category] = (categoryCounts[l.category] || 0) + 1;
        }
      });

      setStats({
        totalLeads: totalLeads || 0,
        leadsThisMonth: leadsThisMonth || 0,
        totalProjects: totalProjects || 0,
        totalCampaigns: totalCampaigns || 0,
        leadsWithEmail,
        leadsWithPhone,
        leadsWithWebsite,
        totalExports: totalExports || 0,
        avgRating,
        categoryCounts,
        plan: profileData?.plan || "free",
      });
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setLoading(false);
    }
  }

  const successRate = stats && stats.totalLeads > 0
    ? Math.round((stats.leadsWithEmail / stats.totalLeads) * 100)
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
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Overview of your lead generation performance
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{
            background: "rgba(16,185,129,0.1)",
            color: "var(--success)",
            border: "1px solid rgba(16,185,129,0.2)",
          }}
        >
          <span className="status-dot online" />
          Live
        </div>
      </motion.div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            label="Total Leads"
            value={stats?.totalLeads?.toLocaleString("en-IN") || "0"}
            icon={<Users size={16} />}
            delay={0}
          />
          <StatCard
            label="This Month"
            value={stats?.leadsThisMonth?.toLocaleString("en-IN") || "0"}
            icon={<TrendingUp size={16} />}
            trend={stats?.totalLeads ? `${Math.round((stats.leadsThisMonth / Math.max(stats.totalLeads, 1)) * 100)}%` : undefined}
            trendUp={true}
            delay={1}
          />
          <StatCard
            label="With Email"
            value={stats?.leadsWithEmail?.toLocaleString("en-IN") || "0"}
            icon={<Mail size={16} />}
            delay={2}
          />
          <StatCard
            label="Projects"
            value={stats?.totalProjects?.toString() || "0"}
            icon={<FolderOpen size={16} />}
            delay={3}
          />
          <StatCard
            label="Campaigns"
            value={stats?.totalCampaigns?.toString() || "0"}
            icon={<MessageSquare size={16} />}
            delay={4}
          />
          <StatCard
            label="Email Rate"
            value={`${successRate}%`}
            icon={<Sparkles size={16} />}
            trend={successRate > 50 ? "Good" : "Low"}
            trendUp={successRate > 50}
            delay={5}
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-xl"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-primary)",
          }}
        >
          <div className="flex items-center gap-2 mb-5">
            <PieChart size={16} style={{ color: "var(--brand-400)" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
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
                  const pct = Math.round((count / maxCount) * 100);
                  return (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <span
                        className="text-xs min-w-[100px] truncate"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {category || "Unknown"}
                      </span>
                      <div
                        className="flex-1 h-2 rounded-full overflow-hidden"
                        style={{ background: "var(--bg-tertiary)" }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: 0.4 + index * 0.05 }}
                          className="h-full rounded-full"
                          style={{
                            background: `hsl(${240 + index * 15}, 65%, 60%)`,
                          }}
                        />
                      </div>
                      <span
                        className="text-xs font-mono min-w-[30px] text-right"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {count}
                      </span>
                    </motion.div>
                  );
                })}
            </div>
          ) : (
            <p
              className="text-sm text-center py-8"
              style={{ color: "var(--text-tertiary)" }}
            >
              No data yet. Start scraping to see category distribution.
            </p>
          )}
        </motion.div>

        {/* Data Quality */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="p-6 rounded-xl"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-primary)",
          }}
        >
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 size={16} style={{ color: "var(--brand-400)" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Data Quality
            </h3>
          </div>
          {stats && stats.totalLeads > 0 ? (
            <div className="space-y-4">
              {[
                { label: "Has Email", value: stats.leadsWithEmail, total: stats.totalLeads, color: "#22c55e" },
                { label: "Has Website", value: stats.leadsWithWebsite, total: stats.totalLeads, color: "#6366f1" },
                { label: "Has Phone", value: stats.leadsWithPhone, total: stats.totalLeads, color: "#06b6d4" },
              ].map((item, index) => {
                const pct = Math.round((item.value / item.total) * 100);
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <div className="flex justify-between text-sm mb-1.5">
                      <span style={{ color: "var(--text-secondary)" }}>{item.label}</span>
                      <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                        {pct}%
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: "var(--bg-tertiary)" }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.4 + index * 0.1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                    </div>
                  </motion.div>
                );
              })}

              <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--border-secondary)" }}>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                      {stats.totalProjects}
                    </div>
                    <div className="text-[10px] flex items-center justify-center gap-1 mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      <FolderOpen size={10} /> Projects
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                      {stats.totalExports}
                    </div>
                    <div className="text-[10px] flex items-center justify-center gap-1 mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      <Download size={10} /> Exports
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                      {stats.avgRating || "—"}
                    </div>
                    <div className="text-[10px] flex items-center justify-center gap-1 mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      <Star size={10} /> Avg Rating
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-center py-8" style={{ color: "var(--text-tertiary)" }}>
              No data yet. Start scraping to see data quality metrics.
            </p>
          )}
        </motion.div>
      </div>

      {/* Subscription Info */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 rounded-xl"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-primary)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={16} style={{ color: "var(--brand-400)" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Subscription Overview
            </h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span
                className="text-xs font-semibold capitalize px-2 py-1 rounded-full"
                style={{
                  background: "var(--bg-active)",
                  color: "var(--brand-400)",
                }}
              >
                {stats.plan} Plan
              </span>
            </div>
            <a
              href="/billing"
              className="text-sm font-medium hover:underline"
              style={{ color: "var(--brand-400)" }}
            >
              Manage subscription →
            </a>
          </div>
        </motion.div>
      )}
    </div>
  );
}
