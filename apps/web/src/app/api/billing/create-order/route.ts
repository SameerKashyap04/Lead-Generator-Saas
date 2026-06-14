import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { generatePaymentHash, payuConfig } from "@/lib/payu";
import crypto from "crypto";

const PLAN_PRICES: Record<string, { monthly: number; yearly: number }> = {
  starter: { monthly: 999, yearly: 9990 },
  pro: { monthly: 2999, yearly: 29990 },
  agency: { monthly: 9999, yearly: 99990 },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plan, billingCycle = "monthly" } = body;

    if (!plan || !PLAN_PRICES[plan]) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    if (billingCycle !== "monthly" && billingCycle !== "yearly") {
      return NextResponse.json({ error: "Invalid billing cycle" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore in route handlers
            }
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const amount = PLAN_PRICES[plan][billingCycle as "monthly" | "yearly"];
    
    // Generate a unique transaction ID (PayU requires unique txnid)
    const txnid = `TXN_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const productinfo = `LeadScaper Pro - ${plan.toUpperCase()} Plan (${billingCycle})`;
    const firstname = profile.full_name || "User";
    const email = profile.email || user.email;

    // We store user.id and plan info in the udf fields so we can identify them in the webhook
    const udf1 = user.id;
    const udf2 = plan;
    const udf3 = billingCycle;

    // Calculate PayU hash
    const hash = generatePaymentHash({
      txnid,
      amount: amount.toString(),
      productinfo,
      firstname,
      email,
      udf1,
      udf2,
      udf3,
    });

    // Determine the base URL for success/fail redirects
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const host = req.headers.get("host") || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    // Store pending payment in database
    const { error: dbError } = await supabase.from("payments").insert({
      user_id: user.id,
      amount,
      currency: "INR",
      payu_txn_id: txnid,
      status: "pending",
      plan,
      billing_cycle: billingCycle,
    });

    if (dbError) {
      console.error("Failed to insert pending payment", dbError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Return parameters needed to construct the PayU form on the client
    const paymentData = {
      key: payuConfig.key,
      txnid,
      amount: amount.toString(),
      productinfo,
      firstname,
      email,
      phone: "0000000000", // Required by PayU but often dummy is ok if not collecting
      surl: `${baseUrl}/api/billing/verify`,
      furl: `${baseUrl}/api/billing/verify`,
      hash,
      udf1,
      udf2,
      udf3,
      payu_url: payuConfig.url,
    };

    return NextResponse.json(paymentData);
  } catch (error: any) {
    console.error("Create order error", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
