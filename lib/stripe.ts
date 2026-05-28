import Stripe from "stripe";
import { env } from "@/lib/env";

let cached: Stripe | null = null;

export function stripe() {
  if (cached) return cached;
  const secret = env.stripeSecret();
  const pub = env.stripePublishable;
  const secretTest = secret.startsWith("sk_test_");
  const pubTest = pub.startsWith("pk_test_");
  if (pub && secretTest !== pubTest) {
    throw new Error(
      "Stripe key mode mismatch: STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY are not both test or both live.",
    );
  }
  cached = new Stripe(secret, {
    apiVersion: "2026-05-27.dahlia",
    typescript: true,
  });
  return cached;
}
