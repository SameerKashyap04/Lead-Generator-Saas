"use client";

import { useRouter } from "next/navigation";
import { Menu, Search, Bell, Sun, Moon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";

interface HeaderProps {
  user: User;
  profile: {
    full_name: string;
    avatar_url: string | null;
    plan: string;
  } | null;
  onMenuClick: () => void;
}

export function Header({ user, profile, onMenuClick }: HeaderProps) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
    }
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  return (
    <header
      className="h-16 flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-20"
      style={{
        background: "var(--glass-bg)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border-secondary)",
      }}
    >
      {/* Left — Mobile menu + Search */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
          style={{ color: "var(--text-secondary)" }}
        >
          <Menu size={20} />
        </button>

        <div
          className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl transition-all flex-1 max-w-md"
          style={{
            background: searchFocused
              ? "var(--bg-primary)"
              : "var(--bg-tertiary)",
            border: searchFocused
              ? "1px solid var(--border-focus)"
              : "1px solid transparent",
          }}
        >
          <Search
            size={15}
            style={{ color: "var(--text-tertiary)" }}
          />
          <input
            type="text"
            placeholder="Search leads, projects..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)" }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd
            className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded font-mono"
            style={{
              background: "var(--bg-secondary)",
              color: "var(--text-tertiary)",
              border: "1px solid var(--border-primary)",
            }}
          >
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
          style={{ color: "var(--text-secondary)" }}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-hover)] relative"
          style={{ color: "var(--text-secondary)" }}
        >
          <Bell size={18} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: "var(--accent-rose)" }}
          />
        </button>
      </div>
    </header>
  );
}
