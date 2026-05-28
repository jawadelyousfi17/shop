import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { Check } from "lucide-react";

type SearchParams = Promise<{ session_id?: string }>;

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { session_id } = await searchParams;
  let order: Awaited<ReturnType<typeof prisma.order.findUnique>> | null = null;
  if (session_id) {
    try {
      order = await prisma.order.findUnique({
        where: { stripeSessionId: session_id },
        include: { product: true },
      });
    } catch {
      order = null;
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-xl px-6 py-24">
          <div className="rounded-[2rem] bg-white p-10 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--color-mint)] text-emerald-700">
              <Check size={22} strokeWidth={2.5} />
            </div>
            <h1
              className="mt-6 text-4xl tracking-tight text-[var(--color-ink)] md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              You're in.
            </h1>
            <p className="mt-3 text-[var(--muted)]">
              Your secure download link is on its way. Check your inbox (and
              spam) within a minute.
            </p>

            {order && (
              <div className="mt-8 rounded-2xl bg-[var(--color-mint)]/40 p-5 text-left text-sm text-[var(--color-ink)]">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Order</span>
                  <span className="font-mono">{order.id.slice(0, 12)}</span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-[var(--muted)]">Product</span>
                  <span className="font-medium">
                    {(order as { product?: { title: string } }).product?.title}
                  </span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-[var(--muted)]">Total</span>
                  <span>{formatPrice(order.amount, order.currency)}</span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-[var(--muted)]">Email</span>
                  <span>{order.customerEmail}</span>
                </div>
              </div>
            )}

            <Link
              href="/products"
              className="mt-8 inline-flex rounded-full bg-[var(--color-ink)] px-7 py-3 text-sm font-medium text-white hover:opacity-90"
            >
              Keep shopping
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
