"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Check, Crown, Sparkles, ArrowRight, Calendar, IndianRupee } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const PLANS = [
  { id: "free", name: "Free", price: 0, period: "/month", features: ["100 Leads / Month", "1 Project", "CSV Export", "Basic Dashboard"], popular: false },
  { id: "starter", name: "Starter", price: 999, period: "/month", features: ["2,000 Leads / Month", "Unlimited Projects", "CSV + Excel + JSON", "WhatsApp Campaigns", "Import from Files"], popular: false },
  { id: "pro", name: "Pro", price: 2999, period: "/month", features: ["10,000 Leads / Month", "Unlimited Projects", "All Exports", "WhatsApp Campaigns", "Email Discovery", "Advanced Analytics", "Priority Support"], popular: true },
  { id: "agency", name: "Agency", price: 9999, period: "/month", features: ["50,000 Leads / Month", "Unlimited Projects", "All Exports", "WhatsApp Campaigns", "Email Discovery", "Advanced Analytics", "10 Team Members", "API Access"], popular: false },
];

export default function BillingPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => { loadBilling(); }, []);

  async function loadBilling() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: sub }, { data: pay }] = await Promise.all([
      supabase.from("subscriptions").select("*").eq("user_id", user.id).single(),
      supabase.from("payments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
    ]);
    setSubscription(sub);
    setPayments(pay || []);
    setLoading(false);
  }

  const currentPlan = subscription?.plan || "free";

  async function handleCheckout(planId: string) {
    try {
      setProcessingPlan(planId);
      const res = await fetch("/api/billing/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, billingCycle: "monthly" }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to initiate payment");
        setProcessingPlan(null);
        return;
      }

      // Create a hidden form and submit to PayU
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.payu_url;

      const params: Record<string, string> = {
        key: data.key,
        txnid: data.txnid,
        amount: data.amount,
        productinfo: data.productinfo,
        firstname: data.firstname,
        email: data.email,
        phone: data.phone,
        surl: data.surl,
        furl: data.furl,
        hash: data.hash,
        udf1: data.udf1,
        udf2: data.udf2,
        udf3: data.udf3,
      };

      for (const key in params) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = params[key];
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
      setProcessingPlan(null);
    }
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Billing</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Manage your subscription and payments</p>
      </motion.div>

      {/* Current Plan */}
      {subscription && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="p-6 rounded-xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-primary)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown size={20} style={{ color: "var(--brand-400)" }} />
              <div>
                <h2 className="font-semibold capitalize" style={{ color: "var(--text-primary)" }}>
                  {subscription.plan} Plan
                </h2>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {subscription.status === "active" ? "Active" : subscription.status} •
                  Renews {new Date(subscription.current_period_end).toLocaleDateString("en-IN")}
                </p>
              </div>
            </div>
            <span className="text-xs font-medium px-3 py-1 rounded-full"
              style={{
                background: subscription.status === "active" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                color: subscription.status === "active" ? "var(--success)" : "var(--error)",
              }}>
              {subscription.status}
            </span>
          </div>
        </motion.div>
      )}

      {/* Plans */}
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan, i) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08 }}
              className="relative p-5 rounded-xl flex flex-col"
              style={{
                background: "var(--bg-elevated)",
                border: plan.popular ? "2px solid var(--brand-500)" : "1px solid var(--border-primary)",
                boxShadow: plan.popular ? "0 0 30px rgba(99,102,241,0.1)" : "none",
              }}>
              {plan.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-white px-2.5 py-0.5 rounded-full"
                  style={{ background: "linear-gradient(135deg, var(--brand-500), var(--accent-violet))" }}>
                  Popular
                </span>
              )}
              <h3 className="font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>{plan.name}</h3>
              <div className="flex items-baseline gap-0.5 mb-4">
                <span className="text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>
                  ₹{plan.price.toLocaleString("en-IN")}
                </span>
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{plan.period}</span>
              </div>
              <ul className="space-y-2 flex-1 mb-4">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                    <Check size={13} className="mt-0.5 flex-shrink-0" style={{ color: "var(--success)" }} />
                    {f}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handleCheckout(plan.id)}
                disabled={currentPlan === plan.id || processingPlan !== null}
                className="w-full py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 flex justify-center items-center gap-2"
                style={{
                  background: currentPlan === plan.id ? "var(--bg-tertiary)" : plan.popular ? "linear-gradient(135deg, var(--brand-500), var(--brand-600))" : "var(--bg-tertiary)",
                  color: currentPlan === plan.id ? "var(--text-tertiary)" : plan.popular ? "white" : "var(--text-primary)",
                  border: plan.popular ? "none" : "1px solid var(--border-primary)",
                }}>
                {processingPlan === plan.id ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : currentPlan === plan.id ? "Current Plan" : currentPlan !== "free" && PLANS.findIndex(p => p.id === currentPlan) > PLANS.findIndex(p => p.id === plan.id) ? "Downgrade" : "Upgrade"}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Payment History */}
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Payment History</h2>
        {payments.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: "var(--text-tertiary)" }}>No payments yet</p>
        ) : (
          <div className="space-y-2">
            {payments.map(p => (
              <div key={p.id} className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-primary)" }}>
                <div className="flex items-center gap-3">
                  <IndianRupee size={16} style={{ color: "var(--brand-400)" }} />
                  <div>
                    <p className="text-sm font-medium capitalize" style={{ color: "var(--text-primary)" }}>
                      {p.plan} Plan — ₹{p.amount}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {new Date(p.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{
                  background: p.status === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                  color: p.status === "success" ? "var(--success)" : "var(--error)",
                }}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
