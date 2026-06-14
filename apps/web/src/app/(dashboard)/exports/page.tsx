"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, FileSpreadsheet, FileJson, FileText, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ExportsPage() {
  const [exports, setExports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => { loadExports(); }, []);

  async function loadExports() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: membership } = await supabase
      .from("workspace_members").select("workspace_id").eq("user_id", user.id).limit(1).single();
    if (!membership) return;
    const { data } = await supabase.from("exports").select("*")
      .eq("workspace_id", membership.workspace_id).order("created_at", { ascending: false });
    setExports(data || []);
    setLoading(false);
  }

  const formatIcon = (format: string) => {
    if (format === "xlsx") return <FileSpreadsheet size={16} style={{ color: "var(--accent-green)" }} />;
    if (format === "json") return <FileJson size={16} style={{ color: "var(--accent-amber)" }} />;
    return <FileText size={16} style={{ color: "var(--accent-cyan)" }} />;
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Exports</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Your export history ({exports.length} exports)
        </p>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : exports.length === 0 ? (
        <div className="text-center py-16">
          <Download size={48} className="mx-auto mb-4" style={{ color: "var(--text-tertiary)" }} />
          <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No exports yet</h3>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Export leads from a project to see them here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {exports.map((exp, i) => (
            <motion.div key={exp.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-primary)" }}>
              <div className="flex items-center gap-3">
                {formatIcon(exp.format)}
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{exp.file_name}</p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {exp.lead_count} leads • {exp.format.toUpperCase()}
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                <Calendar size={12} />
                {new Date(exp.created_at).toLocaleDateString("en-IN")}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
