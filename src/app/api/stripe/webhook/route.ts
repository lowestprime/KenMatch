import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { markSponsorshipCheckoutPaid } from "@/lib/db";
import { env } from "@/lib/env";
import { getStripeClient } from "@/lib/stripe";

export async function POST(request: Request) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();

  let event;
  try {
    event = getStripeClient().webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.payment_status === "paid") {
      await markSponsorshipCheckoutPaid(session.id);
      revalidatePath("/");
      revalidatePath("/kens");
      revalidatePath("/economics");
    }
  }

  return NextResponse.json({ ok: true });
}
