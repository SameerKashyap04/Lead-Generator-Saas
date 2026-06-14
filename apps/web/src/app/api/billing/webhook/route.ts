import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { verifyPaymentHash } from "@/lib/payu";

export async function POST(req: NextRequest) {
  try {
    // PayU sends webhooks as Form URL Encoded
    const text = await req.text();
    const searchParams = new URLSearchParams(text);
    const payload: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      payload[key] = value.toString();
    });

    const {
      status,
      txnid,
      mihpayid,
      udf1: user_id,
      udf2: plan,
      udf3: billing_cycle,
    } = payload;

    // Verify hash for security
    const isValid = verifyPaymentHash(payload);

    if (!isValid) {
      console.error("Webhook: Invalid PayU hash detected for txnid", txnid);
      return NextResponse.json({ error: "Invalid hash" }, { status: 400 });
    }

    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return []; },
          setAll() {},
        },
      }
    );

    const paymentStatus = status === "success" ? "success" : "failed";
    
    // Update payment
    const { error: updateError } = await supabaseAdmin
      .from("payments")
      .update({
        status: paymentStatus,
        payu_payment_id: mihpayid,
      })
      .eq("payu_txn_id", txnid);

    if (updateError) {
      console.error("Webhook: Failed to update payment", updateError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (paymentStatus === "success") {
      const current_period_start = new Date();
      const current_period_end = new Date();
      if (billing_cycle === "yearly") {
        current_period_end.setFullYear(current_period_start.getFullYear() + 1);
      } else {
        current_period_end.setMonth(current_period_start.getMonth() + 1);
      }

      await supabaseAdmin
        .from("subscriptions")
        .upsert({
          user_id,
          plan,
          status: "active",
          billing_cycle,
          payu_subscription_id: mihpayid,
          current_period_start: current_period_start.toISOString(),
          current_period_end: current_period_end.toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
        
      await supabaseAdmin
        .from("profiles")
        .update({ plan })
        .eq("id", user_id);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
