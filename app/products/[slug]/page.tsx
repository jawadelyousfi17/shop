import Image from "next/image";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BuyButton } from "@/components/buy-button";
import { prisma } from "@/lib/prisma";
import { publicCoverUrl } from "@/lib/storage";
import { formatPrice } from "@/lib/utils";
import { Check } from "lucide-react";

export const revalidate = 60;

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ u?: string }>;

async function getProduct(slug: string) {
  const p = await prisma.product.findUnique({ where: { slug } });
  if (!p || !p.isActive) return null;
  return { ...p, coverUrl: await publicCoverUrl(p.coverImagePath) };
}

export async function generateMetadata({ params }: { params: Params }) {
  try {
    const { slug } = await params;
    const product = await getProduct(slug);
    if (!product) return { title: "Product not found" };
    return {
      title: `${product.title} — Rise`,
      description: product.shortDescription,
    };
  } catch {
    return { title: "Rise" };
  }
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const { u } = await searchParams;
  const trackedEmail = u && /.+@.+\..+/.test(u) ? u : null;
  let product: Awaited<ReturnType<typeof getProduct>> = null;
  try {
    product = await getProduct(slug);
  } catch {
    notFound();
  }
  if (!product) notFound();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-[var(--color-mint)]">
            {product.coverUrl ? (
              <Image
                src={product.coverUrl}
                alt={product.title}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div
                className="grid h-full place-items-center text-[10rem] tracking-tight text-[var(--color-ink)]/20"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {product.title.slice(0, 1)}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            {product.category && (
              <span className="inline-flex w-fit rounded-full bg-[var(--color-mint)] px-3 py-1 text-xs font-medium text-emerald-900">
                {product.category}
              </span>
            )}
            <h1
              className="mt-4 text-5xl tracking-tight text-[var(--color-ink)] md:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {product.title}
            </h1>
            <p
              className="mt-4 text-3xl text-[var(--color-ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {formatPrice(product.price, product.currency)}
            </p>
            <p className="mt-5 text-lg text-[var(--muted)]">
              {product.shortDescription}
            </p>

            <div className="mt-8 max-w-sm">
              <BuyButton productId={product.id} trackedEmail={trackedEmail} />
              {trackedEmail && (
                <p className="mt-3 text-center text-xs text-[var(--muted)]">
                  Linked to <span className="font-medium">{trackedEmail}</span>
                </p>
              )}
              <p className="mt-2 text-center text-xs text-[var(--muted)]">
                Stripe checkout · Instant email delivery · No account needed
              </p>
            </div>

            <ul className="mt-10 grid gap-3 border-t border-[var(--border)] pt-8 text-sm text-[var(--color-ink)]">
              {[
                "Delivered instantly to your inbox",
                "Re-download anytime within the validity window",
                "Built for the 2026 Instagram algorithm",
                "Lifetime access — no subscription",
              ].map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--color-mint)] text-emerald-700">
                    <Check size={12} strokeWidth={2.5} />
                  </span>
                  {b}
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <h2
                className="text-2xl tracking-tight text-[var(--color-ink)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                About this product
              </h2>
              <p className="mt-3 whitespace-pre-line text-[var(--muted)]">
                {product.description}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-16">
          <h2
            className="text-3xl tracking-tight text-[var(--color-ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            FAQ
          </h2>
          <div className="mt-6 divide-y divide-[var(--border)] rounded-3xl bg-white">
            {[
              {
                q: "When do I get the file?",
                a: "Immediately after Stripe confirms your payment. Check inbox (and spam) within a minute.",
              },
              {
                q: "What format is the product?",
                a: "PDFs, Notion templates, CapCut links, or ZIPs depending on the product — listed on each detail page.",
              },
              {
                q: "Can I share it with my team?",
                a: "License is for one creator / one account. For agencies and teams, contact support for a multi-seat license.",
              },
              {
                q: "Will it work for my niche?",
                a: "Most products are built to be niche-agnostic and ship with examples from creators, coaches, e-com, and personal brands.",
              },
            ].map((f) => (
              <details key={f.q} className="group p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-[var(--color-ink)]">
                  {f.q}
                  <span className="ml-4 text-[var(--muted)] transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-[var(--muted)]">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
