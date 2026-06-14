"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Users, Mail, Phone, Globe, Star, Download,
  Search, Trash2, ExternalLink, Heart, MapPin, MoreVertical,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Lead {
  id: string;
  business_name: string;
  category: string;
  phone: string | null;
  website: string | null;
  emails: string[];
  full_address: string | null;
  city: string | null;
  rating: number | null;
  review_count: number | null;
  google_maps_url: string | null;
  is_favorite: boolean;
  contacted: boolean;
  created_at: string;
}

interface ProjectInfo {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, [projectId]);

  async function loadData() {
    setLoading(true);
    try {
      const [{ data: proj }, { data: leadsData }] = await Promise.all([
        supabase.from("projects").select("*").eq("id", projectId).single(),
        supabase.from("leads").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
      ]);
      setProject(proj);
      setLeads(leadsData || []);
    } catch (err) {
      console.error("Failed to load project:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteLead(id: string) {
    await supabase.from("leads").delete().eq("id", id);
    setLeads(leads.filter((l) => l.id !== id));
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selectedLeads.size} leads?`)) return;
    const ids = Array.from(selectedLeads);
    await supabase.from("leads").delete().in("id", ids);
    setLeads(leads.filter((l) => !selectedLeads.has(l.id)));
    setSelectedLeads(new Set());
  }

  async function toggleFavorite(id: string) {
    const lead = leads.find((l) => l.id === id);
    if (!lead) return;
    await supabase.from("leads").update({ is_favorite: !lead.is_favorite }).eq("id", id);
    setLeads(leads.map((l) => (l.id === id ? { ...l, is_favorite: !l.is_favorite } : l)));
  }

  const filtered = leads.filter(
    (l) =>
      l.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.city?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const stats = {
    total: leads.length,
    emails: leads.filter((l) => l.emails?.length > 0).length,
    phones: leads.filter((l) => l.phone).length,
    websites: leads.filter((l) => l.website).length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton w-48 h-8 rounded" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
        <div className="skeleton h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <button
          onClick={() => router.push("/projects")}
          className="flex items-center gap-1.5 text-sm mb-4 hover:underline"
          style={{ color: "var(--text-tertiary)" }}
        >
          <ArrowLeft size={14} /> Back to projects
        </button>

        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
            style={{
              background: `${project?.color || "#6366f1"}15`,
              color: project?.color || "#6366f1",
            }}
          >
            {project?.icon || "📁"}
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {project?.name}
            </h1>
            {project?.description && (
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {project.description}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Leads", value: stats.total, icon: <Users size={16} />, color: "var(--brand-400)" },
          { label: "With Email", value: stats.emails, icon: <Mail size={16} />, color: "var(--accent-green)" },
          { label: "With Phone", value: stats.phones, icon: <Phone size={16} />, color: "var(--accent-cyan)" },
          { label: "With Website", value: stats.websites, icon: <Globe size={16} />, color: "var(--accent-violet)" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-xl"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-primary)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span style={{ color: stat.color }}>{stat.icon}</span>
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{stat.label}</span>
            </div>
            <div className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              {stat.value.toLocaleString("en-IN")}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search + Actions */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1"
          style={{
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border-primary)",
          }}
        >
          <Search size={16} style={{ color: "var(--text-tertiary)" }} />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)" }}
          />
        </div>
        {selectedLeads.size > 0 && (
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{
              background: "rgba(239,68,68,0.1)",
              color: "var(--error)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <Trash2 size={14} />
            Delete ({selectedLeads.size})
          </button>
        )}
      </div>

      {/* Leads Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-primary)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                <th className="text-left text-xs font-semibold px-4 py-3" style={{ color: "var(--text-tertiary)" }}>
                  <input
                    type="checkbox"
                    checked={selectedLeads.size === filtered.length && filtered.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedLeads(new Set(filtered.map((l) => l.id)));
                      } else {
                        setSelectedLeads(new Set());
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th className="text-left text-xs font-semibold px-4 py-3" style={{ color: "var(--text-tertiary)" }}>Business</th>
                <th className="text-left text-xs font-semibold px-4 py-3" style={{ color: "var(--text-tertiary)" }}>Category</th>
                <th className="text-left text-xs font-semibold px-4 py-3" style={{ color: "var(--text-tertiary)" }}>Phone</th>
                <th className="text-left text-xs font-semibold px-4 py-3" style={{ color: "var(--text-tertiary)" }}>Email</th>
                <th className="text-left text-xs font-semibold px-4 py-3" style={{ color: "var(--text-tertiary)" }}>Rating</th>
                <th className="text-left text-xs font-semibold px-4 py-3" style={{ color: "var(--text-tertiary)" }}>City</th>
                <th className="text-left text-xs font-semibold px-4 py-3" style={{ color: "var(--text-tertiary)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Users size={32} className="mx-auto mb-2" style={{ color: "var(--text-tertiary)" }} />
                    <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                      {searchQuery ? "No leads match your search" : "No leads in this project yet"}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    className="transition-colors hover:bg-[var(--bg-hover)]"
                    style={{ borderBottom: "1px solid var(--border-secondary)" }}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedLeads.has(lead.id)}
                        onChange={(e) => {
                          const next = new Set(selectedLeads);
                          if (e.target.checked) next.add(lead.id);
                          else next.delete(lead.id);
                          setSelectedLeads(next);
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleFavorite(lead.id)}>
                          <Heart
                            size={14}
                            fill={lead.is_favorite ? "var(--accent-rose)" : "none"}
                            style={{ color: lead.is_favorite ? "var(--accent-rose)" : "var(--text-tertiary)" }}
                          />
                        </button>
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {lead.business_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg-active)", color: "var(--brand-400)" }}>
                        {lead.category || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: lead.phone ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                      {lead.phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: lead.emails?.length ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                      {lead.emails?.[0] || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {lead.rating ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Star size={12} fill="var(--accent-amber)" style={{ color: "var(--accent-amber)" }} />
                          <span style={{ color: "var(--text-primary)" }}>{lead.rating}</span>
                        </span>
                      ) : (
                        <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                      {lead.city || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {lead.google_maps_url && (
                          <a
                            href={lead.google_maps_url}
                            target="_blank"
                            rel="noopener"
                            className="p-1.5 rounded-md hover:bg-[var(--bg-hover)]"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            <MapPin size={13} />
                          </a>
                        )}
                        {lead.website && (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener"
                            className="p-1.5 rounded-md hover:bg-[var(--bg-hover)]"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="p-1.5 rounded-md hover:bg-[rgba(239,68,68,0.1)]"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
