"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  MessageSquare,
  Download,
  Settings,
  CreditCard,
  UserPlus,
  Zap,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Crown,
  MapPin,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface SidebarProps {
  user: User;
  profile: {
    full_name: string;
    avatar_url: string | null;
    plan: string;
    role: string;
  } | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/projects", icon: FolderOpen, label: "Projects" },
  { href: "/leads", icon: Users, label: "Leads" },
  { href: "/campaigns", icon: MessageSquare, label: "Campaigns" },
  { href: "/exports", icon: Download, label: "Exports" },
];

const BOTTOM_ITEMS = [
  { href: "/billing", icon: CreditCard, label: "Billing" },
  { href: "/team", icon: UserPlus, label: "Team" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const PLAN_COLORS: Record<string, string> = {
  free: "var(--text-tertiary)",
  starter: "var(--accent-cyan)",
  pro: "var(--brand-400)",
  agency: "var(--accent-amber)",
};

export function Sidebar({
  user,
  profile,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const sidebarContent = (
    <div
      className="h-full flex flex-col"
      style={{
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--border-primary)",
      }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 gap-3 flex-shrink-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background:
              "linear-gradient(135deg, var(--brand-500), var(--accent-cyan))",
          }}
        >
          <Zap size={16} color="white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="font-bold text-sm whitespace-nowrap overflow-hidden"
              style={{ color: "var(--text-primary)" }}
            >
              LeadScaper Pro
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="mb-6">
          {!collapsed && (
            <p
              className="text-[10px] font-semibold uppercase tracking-wider px-3 mb-2"
              style={{ color: "var(--text-tertiary)" }}
            >
              Main
            </p>
          )}
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all relative"
                style={{
                  color: isActive
                    ? "var(--brand-400)"
                    : "var(--text-secondary)",
                  background: isActive
                    ? "var(--sidebar-active)"
                    : "transparent",
                }}
                title={collapsed ? item.label : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                    style={{ background: "var(--brand-500)" }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <item.icon
                  size={18}
                  className="flex-shrink-0 transition-colors group-hover:text-[var(--brand-400)]"
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </div>

        <div>
          {!collapsed && (
            <p
              className="text-[10px] font-semibold uppercase tracking-wider px-3 mb-2"
              style={{ color: "var(--text-tertiary)" }}
            >
              Account
            </p>
          )}
          
          {profile?.role === 'admin' && (
            <Link
              href="/admin/users"
              className="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all mb-2"
              style={{
                color: pathname.startsWith("/admin") ? "var(--brand-400)" : "var(--accent-amber)",
                background: pathname.startsWith("/admin") ? "var(--sidebar-active)" : "rgba(245, 158, 11, 0.05)",
                border: "1px solid rgba(245, 158, 11, 0.2)",
              }}
              title={collapsed ? "Admin Panel" : undefined}
            >
              <Crown size={18} className="flex-shrink-0 transition-colors" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-nowrap"
                  >
                    Admin Panel
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )}

          {BOTTOM_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  color: isActive
                    ? "var(--brand-400)"
                    : "var(--text-secondary)",
                  background: isActive
                    ? "var(--sidebar-active)"
                    : "transparent",
                }}
                title={collapsed ? item.label : undefined}
              >
                <item.icon
                  size={18}
                  className="flex-shrink-0 transition-colors group-hover:text-[var(--brand-400)]"
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Section */}
      <div
        className="p-3 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border-primary)" }}
      >
        {/* Plan badge */}
        {!collapsed && profile && (
          <div
            className="mb-3 px-3 py-2 rounded-lg flex items-center gap-2"
            style={{
              background: "var(--bg-hover)",
              border: "1px solid var(--border-secondary)",
            }}
          >
            <Crown
              size={14}
              style={{ color: PLAN_COLORS[profile.plan] || "var(--text-tertiary)" }}
            />
            <span
              className="text-xs font-semibold capitalize"
              style={{ color: PLAN_COLORS[profile.plan] || "var(--text-tertiary)" }}
            >
              {profile.plan} Plan
            </span>
          </div>
        )}

        {/* User avatar & name */}
        <div className="flex items-center gap-3 px-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
            style={{
              background:
                "linear-gradient(135deg, var(--brand-500), var(--accent-violet))",
            }}
          >
            {profile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {profile?.full_name || "User"}
                </p>
                <p
                  className="text-[11px] truncate"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {user.email}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-hover)]"
              style={{ color: "var(--text-tertiary)" }}
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggleCollapse}
        className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full items-center justify-center transition-all hover:scale-110"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-primary)",
          color: "var(--text-tertiary)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:block fixed top-0 left-0 h-full z-30 transition-all duration-300"
        style={{ width: collapsed ? "72px" : "260px" }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="lg:hidden fixed top-0 left-0 h-full z-50"
            style={{ width: "260px" }}
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
