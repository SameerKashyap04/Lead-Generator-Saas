"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, Download, Filter } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();

  useEffect(() => { loadLeads(); }, []);

  async function loadLeads() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: membership } = await supabase
      .from("workspace_members").select("workspace_id").eq("user_id", user.id).limit(1).single();
    if (!membership) return;
    const { data } = await supabase
      .from("leads").select("*, projects(name, color, icon)")
      .eq("workspace_id", membership.workspace_id)
      .order("created_at", { ascending: false }).limit(500);
    setLeads(data || []);
    setLoading(false);
  }

  const filtered = leads.filter(l =>
    l.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>All Leads</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          View and manage all leads across projects ({leads.length} total)
        </p>
      </motion.div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1"
          style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}>
          <Search size={16} style={{ color: "var(--text-tertiary)" }} />
          <input type="text" placeholder="Search leads..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--text-primary)" }} />
        </div>
      </div>

      <div className="rounded-xl overflow-hidden"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-primary)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                {["Business", "Project", "Category", "Phone", "Email", "City", "Rating"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold px-4 py-3" style={{ color: "var(--text-tertiary)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border-secondary)" }}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton w-20 h-4 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <Users size={32} className="mx-auto mb-2" style={{ color: "var(--text-tertiary)" }} />
                  <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No leads found</p>
                </td></tr>
              ) : filtered.map(lead => (
                <tr key={lead.id} className="transition-colors hover:bg-[var(--bg-hover)]"
                  style={{ borderBottom: "1px solid var(--border-secondary)" }}>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {lead.business_name}
                  </td>
                  <td className="px-4 py-3">
                    {lead.projects ? (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${lead.projects.color}15`, color: lead.projects.color }}>
                        {lead.projects.icon} {lead.projects.name}
                      </span>
                    ) : <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>{lead.category || "—"}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: lead.phone ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                    {lead.phone || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: lead.emails?.length ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                    {lead.emails?.[0] || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>{lead.city || "—"}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>{lead.rating || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
