"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Search, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

type Subscription = {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  billing_cycle: string;
  current_period_end: string;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
};

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchSubs() {
      try {
        const res = await fetch("/api/admin/subscriptions");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSubs();
  }, []);

  const filteredSubs = subscriptions.filter(sub => 
    sub.profiles?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.profiles?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle2 size={16} className="text-green-500" />;
      case 'canceled': return <XCircle size={16} className="text-red-500" />;
      default: return <AlertCircle size={16} className="text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>All Subscriptions</h2>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
          <input 
            type="text"
            placeholder="Search subscriptions..."
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
                <th className="px-6 py-4 font-semibold" style={{ color: "var(--text-secondary)" }}>Status</th>
                <th className="px-6 py-4 font-semibold" style={{ color: "var(--text-secondary)" }}>Billing Cycle</th>
                <th className="px-6 py-4 font-semibold" style={{ color: "var(--text-secondary)" }}>Renews/Ends On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <Loader2 size={24} className="animate-spin mx-auto" style={{ color: "var(--brand-500)" }} />
                  </td>
                </tr>
              ) : filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
                    No subscriptions found.
                  </td>
                </tr>
              ) : (
                filteredSubs.map(sub => (
                  <tr key={sub.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium" style={{ color: "var(--text-primary)" }}>{sub.profiles?.full_name}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{sub.profiles?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${
                        sub.plan === 'pro' || sub.plan === 'agency' ? 'bg-amber-500/10 text-amber-500' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                      }`}>
                        {sub.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 capitalize text-sm font-medium">
                        {getStatusIcon(sub.status)}
                        <span style={{ color: "var(--text-secondary)" }}>{sub.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize text-sm" style={{ color: "var(--text-secondary)" }}>
                      {sub.billing_cycle}
                    </td>
                    <td className="px-6 py-4 text-xs" style={{ color: "var(--text-secondary)" }}>
                      {format(new Date(sub.current_period_end), "MMM d, yyyy")}
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
