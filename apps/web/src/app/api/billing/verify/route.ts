import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { verifyPaymentHash } from "@/lib/payu";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const payload: Record<string, string> = {};
    formData.forEach((value, key) => {
      payload[key] = value.toString();
    });

    const {
      status,
      txnid,
      mihpayid,
      hash,
      udf1: user_id,
      udf2: plan,
      udf3: billing_cycle,
    } = payload;

    // Verify hash for security
    const isValid = verifyPaymentHash(payload);

    if (!isValid) {
      console.error("Invalid PayU hash detected for txnid", txnid);
      // Redirect to a failure page
      return NextResponse.redirect(new URL("/billing?error=hash_mismatch", req.url));
    }

    // Set up supabase with service role or use RLS bypass if needed
    // Since this is a server-to-server or redirect from PayU, user cookies MIGHT be present,
    // but to securely update DB regardless of session, we might need a service role key.
    // For now we will try using standard client but we might need to bypass RLS.
    // In our schema, `public.payments` policy says "Users can view own payments". 
    // It does not explicitly allow update. Wait, we need an admin policy to update payment statuses from webhooks.
    // Let's use service_role key to update the database securely as admin.

    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Fallback to anon for development if service key missing
      {
        cookies: {
          getAll() { return []; },
          setAll() {},
        },
      }
    );

    // Update payment status
    const paymentStatus = status === "success" ? "success" : "failed";
    
    await supabaseAdmin
      .from("payments")
      .update({
        status: paymentStatus,
        payu_payment_id: mihpayid,
      })
      .eq("payu_txn_id", txnid);

    if (paymentStatus === "success") {
      // Create or update subscription
      // We calculate current_period_end based on billing cycle
      const current_period_start = new Date();
      const current_period_end = new Date();
      if (billing_cycle === "yearly") {
        current_period_end.setFullYear(current_period_start.getFullYear() + 1);
      } else {
        current_period_end.setMonth(current_period_start.getMonth() + 1);
      }

      // Upsert subscription
      await supabaseAdmin
        .from("subscriptions")
        .upsert({
          user_id,
          plan,
          status: "active",
          billing_cycle,
          payu_subscription_id: mihpayid, // We use the payment id as a reference for now
          current_period_start: current_period_start.toISOString(),
          current_period_end: current_period_end.toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
        
      // Update profile plan
      await supabaseAdmin
        .from("profiles")
        .update({
          plan
        })
        .eq("id", user_id);
        
      return NextResponse.redirect(new URL("/billing?success=true", req.url), 303);
    } else {
      return NextResponse.redirect(new URL("/billing?error=payment_failed", req.url), 303);
    }
  } catch (error: any) {
    console.error("Verification error", error);
    return NextResponse.redirect(new URL("/billing?error=internal_error", req.url), 303);
  }
}
