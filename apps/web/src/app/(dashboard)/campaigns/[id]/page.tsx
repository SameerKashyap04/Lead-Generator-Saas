"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Campaign Detail</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Campaign ID: {campaignId}
        </p>
      </motion.div>

      <div className="text-center py-16 rounded-xl"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-primary)" }}>
        <MessageSquare size={48} className="mx-auto mb-4" style={{ color: "var(--text-tertiary)" }} />
        <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
          Campaign detail view
        </h3>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          Full campaign management with recipient tracking coming in Phase 2
        </p>
      </div>
    </div>
  );
}
