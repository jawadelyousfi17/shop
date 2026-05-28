import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { publicCoverUrl } from "@/lib/storage";

export const runtime = "nodejs";

const Body = z.object({
  productId: z.string().min(1),
  trackedEmail: z.string().email().nullable().optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
  });
  if (!product || !product.isActive) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const coverUrl = await publicCoverUrl(product.coverImagePath);

  const trackedEmail = parsed.data.trackedEmail ?? null;

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_creation: "if_required",
    ...(trackedEmail ? { customer_email: trackedEmail } : {}),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: product.currency,
          unit_amount: product.price,
          product_data: {
            name: product.title,
            description: product.shortDescription,
            ...(coverUrl ? { images: [coverUrl] } : {}),
          },
        },
      },
    ],
    metadata: {
      productId: product.id,
      ...(trackedEmail ? { trackedEmail } : {}),
    },
    success_url: trackedEmail
      ? buildElyosoftSuccessUrl(env.elyosoftSuccessUrl, trackedEmail)
      : `${env.siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.siteUrl}/cancel`,
  });

  if (!session.url) {
    return NextResponse.json(
      { error: "Stripe did not return a URL" },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: session.url });
}

function buildElyosoftSuccessUrl(base: string, email: string): string {
  try {
    const url = new URL(base);
    url.searchParams.set("rise_paid", "1");
    url.searchParams.set("u", email);
    return url.toString();
  } catch {
    return base;
  }
}
