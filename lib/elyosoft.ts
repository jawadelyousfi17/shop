import crypto from "node:crypto";
import { env } from "@/lib/env";

type NotifyArgs = {
  email: string;
  price: number;
  currency: string;
  productId: string;
  productTitle: string;
  orderId: string;
};

export async function notifyElyosoft(args: NotifyArgs) {
  const url = env.elyosoftWebhookUrl;
  const secret = env.elyosoftWebhookSecret;
  if (!url || !secret) {
    console.warn("Elyosoft webhook not configured — skipping");
    return { ok: false, skipped: true };
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const payload = {
    email: args.email,
    price: args.price,
    currency: args.currency,
    productId: args.productId,
    productTitle: args.productTitle,
    orderId: args.orderId,
    timestamp,
  };

  const canonical = `${payload.timestamp}.${JSON.stringify(payload)}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(canonical)
    .digest("hex");

  const body = JSON.stringify(payload);

  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-rise-signature": `t=${payload.timestamp},v1=${signature}`,
      },
      body,
      signal: controller.signal,
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      console.error("Elyosoft webhook failed", res.status, text);
      return { ok: false, status: res.status, body: text };
    }
    return { ok: true, status: res.status };
  } catch (e) {
    console.error("Elyosoft webhook error", e);
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  } finally {
    clearTimeout(to);
  }
}
