"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen, Plus, Search, MoreVertical, Trash2, Edit3,
  Users, Mail, Phone, MessageSquare, X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
  total_leads: number;
  total_emails: number;
  total_phones: number;
}

const COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#ef4444", "#f97316",
  "#f59e0b", "#22c55e", "#14b8a6", "#06b6d4",
];

const ICONS = ["📁", "📊", "🎯", "🚀", "💼", "🏢", "🏠", "⚡", "🌟", "💡", "🎨", "📱"];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    color: COLORS[0],
    icon: ICONS[0],
  });
  const [creating, setCreating] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (!membership) return;
      setWorkspaceId(membership.workspace_id);

      // Use project_stats view for computed counts
      const { data } = await supabase
        .from("project_stats")
        .select("*")
        .eq("workspace_id", membership.workspace_id)
        .order("updated_at", { ascending: false });

      setProjects(data || []);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newProject.name.trim() || !workspaceId) return;
    setCreating(true);

    const { error } = await supabase.from("projects").insert({
      workspace_id: workspaceId,
      name: newProject.name.trim(),
      description: newProject.description.trim(),
      color: newProject.color,
      icon: newProject.icon,
    });

    if (!error) {
      setShowCreateModal(false);
      setNewProject({ name: "", description: "", color: COLORS[0], icon: ICONS[0] });
      loadProjects();
    }
    setCreating(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this project and all its leads?")) return;
    await supabase.from("projects").delete().eq("id", id);
    loadProjects();
  }

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Projects
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Organize your leads into projects
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, var(--brand-500), var(--brand-600))",
            boxShadow: "var(--shadow-glow)",
          }}
        >
          <Plus size={16} />
          New Project
        </button>
      </motion.div>

      {/* Search */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
        style={{
          background: "var(--bg-tertiary)",
          border: "1px solid var(--border-primary)",
        }}
      >
        <Search size={16} style={{ color: "var(--text-tertiary)" }} />
        <input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "var(--text-primary)" }}
        />
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-xl"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-primary)" }}
            >
              <div className="skeleton w-10 h-10 rounded-lg mb-3" />
              <div className="skeleton w-32 h-5 rounded mb-2" />
              <div className="skeleton w-48 h-4 rounded mb-4" />
              <div className="skeleton w-full h-3 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen size={48} className="mx-auto mb-4" style={{ color: "var(--text-tertiary)" }} />
          <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            {searchQuery ? "No projects found" : "No projects yet"}
          </h3>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {searchQuery ? "Try a different search" : "Create your first project to start organizing leads"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/projects/${project.id}`}
                className="block p-5 rounded-xl transition-all hover:-translate-y-0.5 group"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-primary)",
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                      style={{ background: `${project.color}15`, color: project.color }}
                    >
                      {project.icon}
                    </div>
                    <div>
                      <h3
                        className="font-semibold text-sm group-hover:text-[var(--brand-400)] transition-colors"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-tertiary)" }}>
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(project.id);
                    }}
                    className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all hover:bg-[rgba(239,68,68,0.1)]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3" style={{ borderTop: "1px solid var(--border-secondary)" }}>
                  <div className="text-center">
                    <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      {project.total_leads || 0}
                    </div>
                    <div className="text-[10px] flex items-center justify-center gap-0.5" style={{ color: "var(--text-tertiary)" }}>
                      <Users size={9} /> Leads
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      {project.total_emails || 0}
                    </div>
                    <div className="text-[10px] flex items-center justify-center gap-0.5" style={{ color: "var(--text-tertiary)" }}>
                      <Mail size={9} /> Emails
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      {project.total_phones || 0}
                    </div>
                    <div className="text-[10px] flex items-center justify-center gap-0.5" style={{ color: "var(--text-tertiary)" }}>
                      <Phone size={9} /> Phones
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-2xl p-6"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-primary)",
                boxShadow: "var(--shadow-xl)",
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  Create Project
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-md hover:bg-[var(--bg-hover)]"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="e.g. Restaurants in Mumbai"
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{
                      background: "var(--bg-tertiary)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-primary)",
                    }}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Description
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="Optional description..."
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                    style={{
                      background: "var(--bg-tertiary)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-primary)",
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    Icon
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ICONS.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setNewProject({ ...newProject, icon })}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all"
                        style={{
                          background: newProject.icon === icon ? "var(--bg-active)" : "var(--bg-tertiary)",
                          border: newProject.icon === icon ? "2px solid var(--brand-500)" : "1px solid var(--border-primary)",
                        }}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewProject({ ...newProject, color })}
                        className="w-7 h-7 rounded-full transition-all"
                        style={{
                          background: color,
                          border: newProject.color === color ? "3px solid white" : "2px solid transparent",
                          boxShadow: newProject.color === color ? `0 0 0 2px ${color}` : "none",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: "var(--bg-tertiary)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-primary)",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newProject.name.trim() || creating}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, var(--brand-500), var(--brand-600))",
                  }}
                >
                  {creating ? "Creating..." : "Create Project"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
