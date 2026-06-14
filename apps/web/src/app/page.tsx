"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap,
  Globe,
  BarChart3,
  MessageSquare,
  Download,
  Shield,
  Users,
  ArrowRight,
  Check,
  Star,
  Sparkles,
  ChevronRight,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";

const FEATURES = [
  {
    icon: <MapPin size={22} />,
    title: "Google Maps Extraction",
    desc: "Scrape business names, phones, emails, websites, ratings, and addresses from Google Maps at scale.",
    gradient: "from-indigo-500 to-cyan-500",
  },
  {
    icon: <BarChart3 size={22} />,
    title: "Analytics Dashboard",
    desc: "Real-time insights on your lead generation performance with beautiful charts and metrics.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: <MessageSquare size={22} />,
    title: "WhatsApp Campaigns",
    desc: "Send personalized WhatsApp messages to your leads with dynamic templates and tracking.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: <Download size={22} />,
    title: "Smart Exports",
    desc: "Export leads to CSV, Excel, or JSON. Import data from files with column mapping.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: <Users size={22} />,
    title: "Team Workspaces",
    desc: "Collaborate with your team. Share projects, leads, and campaigns across members.",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    icon: <Shield size={22} />,
    title: "Enterprise Security",
    desc: "Row-level security, encrypted data, server-side validation. Your data is safe.",
    gradient: "from-slate-500 to-zinc-500",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "₹0",
    period: "/month",
    desc: "Get started with basics",
    features: [
      "100 Leads / Month",
      "1 Project",
      "CSV Export",
      "Basic Dashboard",
    ],
    cta: "Start Free",
    popular: false,
    gradient: "from-slate-600 to-slate-700",
  },
  {
    name: "Starter",
    price: "₹999",
    period: "/month",
    desc: "For growing businesses",
    features: [
      "2,000 Leads / Month",
      "Unlimited Projects",
      "CSV + Excel + JSON Export",
      "WhatsApp Campaigns",
      "Import from CSV/Excel",
      "Advanced Filters",
    ],
    cta: "Get Starter",
    popular: false,
    gradient: "from-cyan-500 to-teal-500",
  },
  {
    name: "Pro",
    price: "₹2,999",
    period: "/month",
    desc: "Advanced lead generation",
    features: [
      "10,000 Leads / Month",
      "Unlimited Projects",
      "All Export Formats",
      "WhatsApp Campaigns",
      "Email Discovery",
      "Advanced Analytics",
      "Priority Support",
    ],
    cta: "Get Pro",
    popular: true,
    gradient: "from-indigo-500 to-violet-500",
  },
  {
    name: "Agency",
    price: "₹9,999",
    period: "/month",
    desc: "For teams & agencies",
    features: [
      "50,000 Leads / Month",
      "Unlimited Projects",
      "All Export Formats",
      "WhatsApp Campaigns",
      "Email Discovery",
      "Advanced Analytics",
      "10 Team Members",
      "API Access",
      "Dedicated Support",
    ],
    cta: "Get Agency",
    popular: false,
    gradient: "from-amber-500 to-orange-500",
  },
];

const STATS = [
  { value: "10M+", label: "Leads Extracted" },
  { value: "5K+", label: "Active Users" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9★", label: "User Rating" },
];

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* ─── Navbar ──────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 glass-card"
        style={{
          borderRadius: 0,
          borderTop: "none",
          borderLeft: "none",
          borderRight: "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, var(--brand-500), var(--accent-cyan))",
              }}
            >
              <Zap size={18} color="white" />
            </div>
            <span
              className="font-bold text-lg"
              style={{ color: "var(--text-primary)" }}
            >
              LeadScaper Pro
            </span>
          </Link>

          <div
            className="hidden md:flex items-center gap-8 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            <a href="#features" className="hover:text-[var(--text-primary)] transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-[var(--text-primary)] transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-[var(--text-primary)] transition-colors">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 rounded-lg transition-all hover:bg-[var(--bg-hover)]"
              style={{ color: "var(--text-secondary)" }}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold px-5 py-2 rounded-lg text-white transition-all hover:opacity-90"
              style={{
                background:
                  "linear-gradient(135deg, var(--brand-500), var(--brand-600))",
                boxShadow: "var(--shadow-glow)",
              }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background Glow */}
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-20 blur-[120px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse, var(--brand-500), transparent 70%)",
          }}
        />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span
              className="inline-flex items-center gap-2 text-xs font-medium px-4 py-1.5 rounded-full mb-8"
              style={{
                background: "var(--bg-active)",
                color: "var(--brand-400)",
                border: "1px solid rgba(99, 102, 241, 0.2)",
              }}
            >
              <Sparkles size={12} />
              SaaS Platform — Extract, Manage, Convert
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6"
            style={{ color: "var(--text-primary)" }}
          >
            Turn Google Maps Into{" "}
            <span className="gradient-text">Your Lead Engine</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10"
            style={{ color: "var(--text-secondary)" }}
          >
            Extract business leads from Google Maps, manage projects, run
            WhatsApp campaigns, and track performance — all from one premium
            dashboard built for Indian businesses.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link
              href="/signup"
              className="flex items-center gap-2 text-base font-semibold px-8 py-3.5 rounded-xl text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background:
                  "linear-gradient(135deg, var(--brand-500), var(--brand-600))",
                boxShadow:
                  "0 0 30px rgba(99, 102, 241, 0.3), var(--shadow-lg)",
              }}
            >
              Start Free — No Credit Card
              <ArrowRight size={18} />
            </Link>
            <Link
              href="#features"
              className="flex items-center gap-2 text-base font-medium px-8 py-3.5 rounded-xl transition-all hover:bg-[var(--bg-hover)]"
              style={{
                color: "var(--text-secondary)",
                border: "1px solid var(--border-primary)",
              }}
            >
              See How It Works
              <ChevronRight size={16} />
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div
                  className="text-2xl md:text-3xl font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {stat.value}
                </div>
                <div
                  className="text-xs mt-1"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Features Section ────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Everything You Need to{" "}
              <span className="gradient-text">Generate Leads</span>
            </h2>
            <p
              className="text-lg max-w-xl mx-auto"
              style={{ color: "var(--text-secondary)" }}
            >
              A complete lead generation platform with extraction, management,
              campaigns, and analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group p-6 rounded-2xl transition-all hover:-translate-y-1 cursor-default"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-primary)",
                }}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${feature.gradient} text-white`}
                >
                  {feature.icon}
                </div>
                <h3
                  className="text-base font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {feature.title}
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ────────────────────────────────────── */}
      <section
        className="py-24 px-6"
        style={{ background: "var(--bg-secondary)" }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              How It Works
            </h2>
            <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
              Get started in minutes — no technical skills required
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Sign Up",
                desc: "Create your free account in seconds",
                icon: <Users size={20} />,
              },
              {
                step: "02",
                title: "Install Extension",
                desc: "Add the Chrome extension to your browser",
                icon: <Globe size={20} />,
              },
              {
                step: "03",
                title: "Scrape Leads",
                desc: "Search Google Maps and extract business data",
                icon: <MapPin size={20} />,
              },
              {
                step: "04",
                title: "Manage & Convert",
                desc: "Organize, campaign, export, and convert",
                icon: <BarChart3 size={20} />,
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.15 }}
                className="text-center"
              >
                <div
                  className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{
                    background: "var(--bg-active)",
                    color: "var(--brand-400)",
                  }}
                >
                  {item.icon}
                </div>
                <div
                  className="text-xs font-mono mb-2"
                  style={{ color: "var(--brand-400)" }}
                >
                  STEP {item.step}
                </div>
                <h3
                  className="font-semibold mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  {item.title}
                </h3>
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing Section ─────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Simple, Transparent{" "}
              <span className="gradient-text">Pricing</span>
            </h2>
            <p className="text-lg mb-8" style={{ color: "var(--text-secondary)" }}>
              Start free. Upgrade when you&apos;re ready.
            </p>

            {/* Billing Toggle */}
            <div
              className="inline-flex items-center gap-1 p-1 rounded-full"
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-primary)",
              }}
            >
              <button
                onClick={() => setBillingCycle("monthly")}
                className="px-5 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  background:
                    billingCycle === "monthly"
                      ? "var(--brand-500)"
                      : "transparent",
                  color:
                    billingCycle === "monthly"
                      ? "white"
                      : "var(--text-secondary)",
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className="px-5 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  background:
                    billingCycle === "yearly"
                      ? "var(--brand-500)"
                      : "transparent",
                  color:
                    billingCycle === "yearly"
                      ? "white"
                      : "var(--text-secondary)",
                }}
              >
                Yearly{" "}
                <span
                  className="ml-1 text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    background:
                      billingCycle === "yearly"
                        ? "rgba(255,255,255,0.2)"
                        : "var(--bg-active)",
                    color:
                      billingCycle === "yearly"
                        ? "white"
                        : "var(--accent-green)",
                  }}
                >
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative rounded-2xl p-6 flex flex-col transition-all hover:-translate-y-1"
                style={{
                  background: plan.popular
                    ? "var(--bg-elevated)"
                    : "var(--bg-elevated)",
                  border: plan.popular
                    ? "2px solid var(--brand-500)"
                    : "1px solid var(--border-primary)",
                  boxShadow: plan.popular
                    ? "0 0 40px rgba(99, 102, 241, 0.15)"
                    : "none",
                }}
              >
                {plan.popular && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold text-white"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--brand-500), var(--accent-violet))",
                    }}
                  >
                    Most Popular
                  </div>
                )}

                <h3
                  className="text-lg font-bold mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  {plan.name}
                </h3>
                <p
                  className="text-sm mb-4"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {plan.desc}
                </p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span
                    className="text-3xl font-extrabold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {plan.price}
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {plan.period}
                  </span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <Check
                        size={16}
                        className="mt-0.5 flex-shrink-0"
                        style={{ color: "var(--accent-green)" }}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className="w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                  style={{
                    background: plan.popular
                      ? "linear-gradient(135deg, var(--brand-500), var(--brand-600))"
                      : "var(--bg-tertiary)",
                    color: plan.popular ? "white" : "var(--text-primary)",
                    border: plan.popular
                      ? "none"
                      : "1px solid var(--border-primary)",
                  }}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl p-12 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, var(--brand-600), var(--brand-800))",
            }}
          >
            <div className="absolute inset-0 opacity-20">
              <div
                className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl"
                style={{ background: "var(--accent-cyan)" }}
              />
              <div
                className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-3xl"
                style={{ background: "var(--accent-violet)" }}
              />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Supercharge Your Lead Generation?
              </h2>
              <p className="text-lg text-indigo-200 mb-8">
                Join thousands of businesses using LeadScaper Pro to find and
                convert leads faster.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "white",
                  color: "var(--brand-600)",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                }}
              >
                Start Free Today
                <ArrowRight size={18} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer
        className="py-12 px-6"
        style={{
          borderTop: "1px solid var(--border-primary)",
          background: "var(--bg-secondary)",
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, var(--brand-500), var(--accent-cyan))",
                }}
              >
                <Zap size={14} color="white" />
              </div>
              <span
                className="font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                LeadScaper Pro
              </span>
              <span
                className="text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                by Devify
              </span>
            </div>

            <p
              className="text-sm"
              style={{ color: "var(--text-tertiary)" }}
            >
              © {new Date().getFullYear()} LeadScaper Pro by Devify. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
