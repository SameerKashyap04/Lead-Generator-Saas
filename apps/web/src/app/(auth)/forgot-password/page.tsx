"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Mail, ArrowRight, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg-primary)" }}
    >
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-15 blur-[100px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, var(--brand-500), transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, var(--brand-500), var(--accent-cyan))",
              }}
            >
              <Zap size={22} color="white" />
            </div>
            <span className="font-bold text-xl" style={{ color: "var(--text-primary)" }}>
              LeadScaper Pro
            </span>
          </Link>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            Reset your password
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-primary)",
            boxShadow: "var(--shadow-xl)",
          }}
        >
          {success ? (
            <div className="text-center py-4">
              <div
                className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{
                  background: "rgba(16, 185, 129, 0.1)",
                  color: "var(--accent-green)",
                }}
              >
                <Mail size={24} />
              </div>
              <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                Check your email
              </h3>
              <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                We&apos;ve sent a password reset link to <strong>{email}</strong>
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium"
                style={{ color: "var(--brand-400)" }}
              >
                <ArrowLeft size={14} />
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              {error && (
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    color: "var(--error)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                  }}
                >
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "var(--bg-tertiary)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-primary)",
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, var(--brand-500), var(--brand-600))",
                  boxShadow: "var(--shadow-glow)",
                }}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-tertiary)" }}>
          <Link href="/login" className="inline-flex items-center gap-1 font-medium hover:underline" style={{ color: "var(--brand-400)" }}>
            <ArrowLeft size={14} />
            Back to login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
