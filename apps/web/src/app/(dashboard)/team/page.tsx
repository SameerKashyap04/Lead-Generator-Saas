"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Crown, Shield, Users, Mail, Trash2, X, Check, Copy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState("free");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => { loadTeam(); }, []);

  async function loadTeam() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: profile }, { data: membership }] = await Promise.all([
      supabase.from("profiles").select("plan").eq("id", user.id).single(),
      supabase.from("workspace_members").select("workspace_id").eq("user_id", user.id).limit(1).single(),
    ]);
    setPlan(profile?.plan || "free");
    if (!membership) { setLoading(false); return; }
    
    setWorkspaceId(membership.workspace_id);
    
    const { data } = await supabase.from("workspace_members")
      .select("*, profiles(email, full_name, avatar_url)")
      .eq("workspace_id", membership.workspace_id);
    setMembers(data || []);
    setLoading(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail || !workspaceId) return;
    
    setInviting(true);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole, workspaceId }),
      });
      const data = await res.json();
      if (data.inviteLink) {
        setInviteLink(data.inviteLink);
      } else if (data.error) {
        alert("Error: " + data.error);
      }
    } catch (err) {
      alert("Failed to send invite.");
    }
    setInviting(false);
  }

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert("Invite link copied!");
  };

  const roleIcon = (role: string) => {
    if (role === "owner") return <Crown size={14} style={{ color: "var(--accent-amber)" }} />;
    if (role === "admin") return <Shield size={14} style={{ color: "var(--brand-400)" }} />;
    return <Users size={14} style={{ color: "var(--text-tertiary)" }} />;
  };

  const isAgency = plan === "agency";

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Team</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Manage workspace members</p>
        </div>
        {isAgency && (
          <button 
            onClick={() => {
              setInviteEmail("");
              setInviteLink("");
              setShowInvite(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--brand-500), var(--brand-600))" }}>
            <UserPlus size={16} /> Invite Member
          </button>
        )}
      </motion.div>

      {!isAgency ? (
        <div className="text-center py-16 rounded-xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-primary)" }}>
          <Crown size={48} className="mx-auto mb-4" style={{ color: "var(--accent-amber)" }} />
          <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Team features require the Agency plan</h3>
          <p className="text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>
            Upgrade to Agency to invite up to 10 team members
          </p>
          <a href="/billing" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--brand-500), var(--brand-600))" }}>
            Upgrade to Agency
          </a>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-primary)" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: "linear-gradient(135deg, var(--brand-500), var(--accent-violet))" }}>
                  {m.profiles?.full_name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {m.profiles?.full_name || "Unknown"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{m.profiles?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs font-medium capitalize px-2 py-0.5 rounded-full"
                  style={{ background: "var(--bg-active)", color: "var(--brand-400)" }}>
                  {roleIcon(m.role)} {m.role}
                </span>
                {m.role !== "owner" && (
                  <button className="p-1.5 rounded-md hover:bg-[rgba(239,68,68,0.1)]" style={{ color: "var(--text-tertiary)" }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      <AnimatePresence>
        {showInvite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
              style={{ background: "var(--bg-primary)", border: "1px solid var(--border-primary)" }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Invite Team Member</h3>
                <button onClick={() => setShowInvite(false)} className="p-1 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]">
                  <X size={18} />
                </button>
              </div>

              {!inviteLink ? (
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                      placeholder="colleague@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Role</label>
                    <select
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={inviting}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-70"
                      style={{ background: "linear-gradient(135deg, var(--brand-500), var(--brand-600))" }}
                    >
                      {inviting ? "Generating Invite..." : "Send Invite"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                    <Check size={24} />
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Invite generated successfully! Send this link to your colleague.</p>
                  
                  <div className="flex items-center gap-2 p-2 rounded-xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
                    <input 
                      type="text" 
                      readOnly 
                      value={inviteLink}
                      className="flex-1 bg-transparent text-sm outline-none px-2"
                      style={{ color: "var(--text-primary)" }}
                    />
                    <button onClick={copyLink} className="p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors">
                      <Copy size={16} />
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => setShowInvite(false)}
                    className="mt-4 text-sm font-medium"
                    style={{ color: "var(--brand-400)" }}
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
