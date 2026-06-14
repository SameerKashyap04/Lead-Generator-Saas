"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Crown, Search, Loader2 } from "lucide-react";

type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  plan: string;
  role: string;
  created_at: string;
  workspaces: any[];
  subscriptions: any[];
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/admin/users");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setUsers(data.users || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>All Users</h2>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
          <input 
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-xl text-sm border focus:outline-none transition-colors"
            style={{ 
              background: "var(--bg-tertiary)", 
              borderColor: "var(--border-primary)",
              color: "var(--text-primary)"
            }}
          />
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "var(--border-primary)", background: "var(--bg-elevated)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b" style={{ borderColor: "var(--border-primary)", background: "var(--bg-tertiary)" }}>
              <tr>
                <th className="px-6 py-4 font-semibold" style={{ color: "var(--text-secondary)" }}>User</th>
                <th className="px-6 py-4 font-semibold" style={{ color: "var(--text-secondary)" }}>Plan</th>
                <th className="px-6 py-4 font-semibold" style={{ color: "var(--text-secondary)" }}>Role</th>
                <th className="px-6 py-4 font-semibold" style={{ color: "var(--text-secondary)" }}>Joined Date</th>
                <th className="px-6 py-4 font-semibold" style={{ color: "var(--text-secondary)" }}>Workspaces</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ divideColor: "var(--border-primary)" }}>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <Loader2 size={24} className="animate-spin mx-auto" style={{ color: "var(--brand-500)" }} />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium" style={{ color: "var(--text-primary)" }}>{user.full_name}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${
                        user.plan === 'pro' || user.plan === 'agency' ? 'bg-amber-500/10 text-amber-500' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                      }`}>
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'admin' ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--brand-400)" }}>
                          <Crown size={14} /> Admin
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>User</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs" style={{ color: "var(--text-secondary)" }}>
                      {format(new Date(user.created_at), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-xs" style={{ color: "var(--text-secondary)" }}>
                      {user.workspaces?.length || 0} workspaces
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
