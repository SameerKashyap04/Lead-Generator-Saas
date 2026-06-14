"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Plus, Search, Users, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => { loadCampaigns(); }, []);

  async function loadCampaigns() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: membership } = await supabase
      .from("workspace_members").select("workspace_id").eq("user_id", user.id).limit(1).single();
    if (!membership) return;
    const { data } = await supabase.from("campaigns").select("*, projects(name, color, icon)")
      .eq("workspace_id", membership.workspace_id).order("created_at", { ascending: false });
    setCampaigns(data || []);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Campaigns</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Manage your WhatsApp campaigns
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, var(--brand-500), var(--brand-600))", boxShadow: "var(--shadow-glow)" }}>
          <Plus size={16} /> New Campaign
        </button>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-5 rounded-xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-primary)" }}>
              <div className="skeleton w-32 h-5 rounded mb-2" />
              <div className="skeleton w-48 h-4 rounded mb-4" />
              <div className="skeleton w-full h-3 rounded" />
            </div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare size={48} className="mx-auto mb-4" style={{ color: "var(--text-tertiary)" }} />
          <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No campaigns yet</h3>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Create your first WhatsApp campaign</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign, i) => (
            <motion.div key={campaign.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}>
              <Link href={`/campaigns/${campaign.id}`}
                className="block p-5 rounded-xl transition-all hover:-translate-y-0.5 group"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-primary)" }}>
                <h3 className="font-semibold text-sm mb-1 group-hover:text-[var(--brand-400)]"
                  style={{ color: "var(--text-primary)" }}>{campaign.name}</h3>
                {campaign.projects && (
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: `${campaign.projects.color}15`, color: campaign.projects.color }}>
                    {campaign.projects.icon} {campaign.projects.name}
                  </span>
                )}
                <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: "1px solid var(--border-secondary)" }}>
                  <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                    <Users size={12} /> {campaign.total_recipients} recipients
                  </span>
                  <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                    <Calendar size={12} /> {new Date(campaign.created_at).toLocaleDateString("en-IN")}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
