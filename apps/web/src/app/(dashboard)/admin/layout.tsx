"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Users, CreditCard } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "admin") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        router.push("/dashboard");
      }
    }
    checkAdmin();
  }, []);

  if (isAdmin === null) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-[var(--brand-500)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAdmin === false) {
    return null; // Redirecting
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Platform Administration</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Manage users, workspaces, and subscriptions.</p>
      </div>

      {/* Admin Nav */}
      <div className="flex items-center gap-2 border-b" style={{ borderColor: "var(--border-primary)" }}>
        <Link 
          href="/admin/users"
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            pathname.includes("/admin/users") 
              ? "border-[var(--brand-500)] text-[var(--brand-400)]" 
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Users size={16} /> Users & Workspaces
        </Link>
        <Link 
          href="/admin/subscriptions"
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            pathname.includes("/admin/subscriptions") 
              ? "border-[var(--brand-500)] text-[var(--brand-400)]" 
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <CreditCard size={16} /> Subscriptions
        </Link>
      </div>

      <div className="pt-2">
        {children}
      </div>
    </div>
  );
}
