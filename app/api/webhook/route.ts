import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { sendProductEmail } from "@/lib/email";
import { notifyElyosoft } from "@/lib/elyosoft";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, sig, env.stripeWebhookSecret());
  } catch (e) {
    return NextResponse.json(
      { error: `Bad signature: ${(e as Error).message}` },
      { status: 400 },
    );
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true });
  }

  const existing = await prisma.order.findUnique({
    where: { stripeSessionId: session.id },
  });
  if (existing) return NextResponse.json({ received: true, idempotent: true });

  const productId = session.metadata?.productId;
  if (!productId) {
    return NextResponse.json(
      { error: "missing productId metadata" },
      { status: 400 },
    );
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: "product missing" }, { status: 400 });
  }

  const email =
    session.customer_details?.email ?? session.customer_email ?? null;
  if (!email) {
    return NextResponse.json({ error: "no email" }, { status: 400 });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + env.downloadExpiryDays * 24 * 60 * 60 * 1000,
  );

  const order = await prisma.order.create({
    data: {
      productId: product.id,
      customerEmail: email,
      customerName: session.customer_details?.name ?? null,
      amount: session.amount_total ?? product.price,
      currency: session.currency ?? product.currency,
      stripeSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null),
      paymentStatus: session.payment_status,
      downloadToken: token,
      downloadExpiresAt: expiresAt,
    },
  });

  try {
    await sendProductEmail({
      to: email,
      customerName: session.customer_details?.name ?? null,
      productTitle: product.title,
      orderId: order.id,
      downloadUrl: `${env.siteUrl}/download/${token}`,
    });
  } catch (e) {
    console.error("email send failed", e);
  }

  const trackedEmail = session.metadata?.trackedEmail ?? null;
  if (trackedEmail) {
    try {
      await notifyElyosoft({
        email: trackedEmail,
        price: order.amount,
        currency: order.currency,
        productId: product.id,
        productTitle: product.title,
        orderId: order.id,
      });
    } catch (e) {
      console.error("elyosoft notify failed", e);
    }
  }

  return NextResponse.json({ received: true });
}
