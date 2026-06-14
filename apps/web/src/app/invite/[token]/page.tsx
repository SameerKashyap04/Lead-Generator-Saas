"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Check, X, Loader2 } from "lucide-react";

export default function InvitePage({ params }: { params: { token: string } }) {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "login_required">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    processInvite();
  }, [params.token]);

  async function processInvite() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // User must log in first. Save token to session storage to process after login.
      sessionStorage.setItem("pending_invite_token", params.token);
      setStatus("login_required");
      setTimeout(() => {
        router.push("/login?redirect=/invite/" + params.token);
      }, 3000);
      return;
    }

    try {
      const res = await fetch("/api/team/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: params.token, userId: user.id }),
      });
      const data = await res.json();

      if (data.success) {
        setStatus("success");
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Failed to accept invite");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg("An unexpected error occurred.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: "var(--bg-primary)" }}>
      <div className="w-full max-w-md p-8 rounded-3xl text-center shadow-xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
        
        {status === "loading" && (
          <div className="flex flex-col items-center">
            <Loader2 size={48} className="animate-spin mb-4" style={{ color: "var(--brand-500)" }} />
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Processing Invite...</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>Please wait while we verify your invitation.</p>
          </div>
        )}

        {status === "login_required" && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--bg-tertiary)" }}>
              <Check size={32} style={{ color: "var(--text-tertiary)" }} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Sign In Required</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>You must be signed in to accept this invitation. Redirecting you to login...</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-green-500/10 text-green-500">
              <Check size={32} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Invitation Accepted!</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>You have been added to the workspace. Redirecting to dashboard...</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-red-500/10 text-red-500">
              <X size={32} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Invalid or Expired Invite</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>{errorMsg}</p>
            <button 
              onClick={() => router.push("/dashboard")}
              className="mt-6 px-6 py-2.5 rounded-xl font-semibold text-white"
              style={{ background: "linear-gradient(135deg, var(--brand-500), var(--brand-600))" }}
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
