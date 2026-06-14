"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Settings, Save, Moon, Sun, Zap, Globe, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("settings").select("*").eq("user_id", user.id).single();
    setSettings(data);
    setLoading(false);
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    await supabase.from("settings").update(settings).eq("id", settings.id);
    setSaving(false);
  }

  if (loading) {
    return <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
    </div>;
  }

  const updateSetting = (key: string, value: any) => setSettings({ ...settings, [key]: value });

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Manage your preferences</p>
      </motion.div>

      {/* Appearance */}
      <div className="p-6 rounded-xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-primary)" }}>
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <Sun size={16} /> Appearance
        </h2>
        <div className="flex gap-3">
          {(["light", "dark", "system"] as const).map(theme => (
            <button key={theme} onClick={() => updateSetting("theme", theme)}
              className="flex-1 py-3 rounded-xl text-sm font-medium capitalize transition-all"
              style={{
                background: settings?.theme === theme ? "var(--bg-active)" : "var(--bg-tertiary)",
                border: settings?.theme === theme ? "2px solid var(--brand-500)" : "1px solid var(--border-primary)",
                color: settings?.theme === theme ? "var(--brand-400)" : "var(--text-secondary)",
              }}>
              {theme}
            </button>
          ))}
        </div>
      </div>

      {/* Scraping */}
      <div className="p-6 rounded-xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-primary)" }}>
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <Zap size={16} /> Scraping
        </h2>
        <div>
          <label className="text-sm mb-2 block" style={{ color: "var(--text-secondary)" }}>Speed</label>
          <div className="flex gap-3">
            {(["slow", "moderate", "fast"] as const).map(speed => (
              <button key={speed} onClick={() => updateSetting("scraping_speed", speed)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium capitalize transition-all"
                style={{
                  background: settings?.scraping_speed === speed ? "var(--bg-active)" : "var(--bg-tertiary)",
                  border: settings?.scraping_speed === speed ? "2px solid var(--brand-500)" : "1px solid var(--border-primary)",
                  color: settings?.scraping_speed === speed ? "var(--brand-400)" : "var(--text-secondary)",
                }}>
                {speed}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="p-6 rounded-xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-primary)" }}>
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <Globe size={16} /> Export Defaults
        </h2>
        <div className="flex gap-3">
          {(["csv", "xlsx", "json"] as const).map(format => (
            <button key={format} onClick={() => updateSetting("export_format", format)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium uppercase transition-all"
              style={{
                background: settings?.export_format === format ? "var(--bg-active)" : "var(--bg-tertiary)",
                border: settings?.export_format === format ? "2px solid var(--brand-500)" : "1px solid var(--border-primary)",
                color: settings?.export_format === format ? "var(--brand-400)" : "var(--text-secondary)",
              }}>
              {format}
            </button>
          ))}
        </div>
      </div>

      {/* WhatsApp */}
      <div className="p-6 rounded-xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-primary)" }}>
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <MessageSquare size={16} /> WhatsApp
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm mb-1.5 block" style={{ color: "var(--text-secondary)" }}>Country Code</label>
            <input type="text" value={settings?.default_country_code || "+91"}
              onChange={(e) => updateSetting("default_country_code", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border-primary)" }} />
          </div>
          <div>
            <label className="text-sm mb-1.5 block" style={{ color: "var(--text-secondary)" }}>Daily Limit</label>
            <input type="number" value={settings?.whatsapp_daily_limit || 50}
              onChange={(e) => updateSetting("whatsapp_daily_limit", parseInt(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border-primary)" }} />
          </div>
        </div>
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, var(--brand-500), var(--brand-600))", boxShadow: "var(--shadow-glow)" }}>
        <Save size={16} /> {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
