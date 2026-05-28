import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { prisma } from "@/lib/prisma";
import { publicCoverUrl } from "@/lib/storage";
import {
  Zap,
  Film,
  MessageCircle,
  Calendar,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export const revalidate = 60;

async function getFeatured() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });
  return Promise.all(
    products.map(async (p) => ({
      ...p,
      coverUrl: await publicCoverUrl(p.coverImagePath),
    })),
  );
}

export default async function HomePage() {
  let featured: Awaited<ReturnType<typeof getFeatured>> = [];
  try {
    featured = await getFeatured();
  } catch {
    featured = [];
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-24 pt-20 md:pt-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-mint)] px-3 py-1 text-xs font-medium text-emerald-900">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                Instagram growth, no bots, no fluff
              </span>
              <h1
                className="mt-6 text-[3.25rem] leading-[1.05] tracking-tight text-[var(--color-ink)] md:text-[4.5rem]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Grow your Instagram
                <br />
                <span className="italic text-[var(--accent)]">without</span> guessing.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-[var(--muted)]">
                Hook libraries, Reels templates, content calendars, and growth
                playbooks — built by creators who actually grew real audiences.
                Download once, post forever.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  href="/products"
                  className="rounded-full bg-[var(--color-ink)] px-7 py-3.5 text-sm font-medium text-white hover:opacity-90"
                >
                  Browse the shop
                </Link>
                <Link
                  href="#how"
                  className="rounded-full border border-[var(--border)] bg-white px-7 py-3.5 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-mint)]/40"
                >
                  How it works
                </Link>
              </div>

              <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-[var(--muted)]">
                <span className="flex items-center gap-2">
                  <span className="text-[var(--color-ink)] font-semibold">12,400+</span>
                  creators served
                </span>
                <span className="hidden h-1 w-1 rounded-full bg-[var(--border)] md:block" />
                <span className="flex items-center gap-2">
                  <span className="text-[var(--color-ink)] font-semibold">4.9 / 5</span>
                  avg rating
                </span>
                <span className="hidden h-1 w-1 rounded-full bg-[var(--border)] md:block" />
                <span>Instant email delivery</span>
              </div>
            </div>

            {/* Visual stack */}
            <div className="relative mx-auto w-full max-w-sm">
              <div className="relative aspect-[9/16] overflow-hidden rounded-[2rem] bg-[var(--color-mint)] p-6 shadow-xl">
                <div className="flex items-center gap-2 text-xs text-[var(--color-ink)]">
                  <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                  rise.co
                </div>
                <p
                  className="mt-6 text-3xl leading-tight text-[var(--color-ink)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  “Stop scrolling.<br />Start shipping.”
                </p>
                <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/80 p-4 text-xs text-[var(--color-ink)] backdrop-blur">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Followers</span>
                    <span className="font-semibold text-emerald-700">+ 24.6k</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-[var(--color-mint-deep)]">
                    <div className="h-full w-3/4 rounded-full bg-emerald-600" />
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 hidden h-32 w-32 rotate-[-8deg] rounded-3xl bg-[var(--color-peach)] p-5 shadow-xl md:block">
                <p className="text-xs text-[var(--color-ink)]/70">Reels saved</p>
                <p
                  className="mt-2 text-3xl tracking-tight text-[var(--color-ink)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  18.2k
                </p>
              </div>
              <div className="absolute -right-6 -top-6 hidden h-28 w-28 rotate-[6deg] rounded-3xl bg-[var(--color-sky)] p-5 shadow-xl md:block">
                <p className="text-xs text-[var(--color-ink)]/70">Hook CTR</p>
                <p
                  className="mt-2 text-3xl tracking-tight text-[var(--color-ink)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  12%
                </p>
              </div>
            </div>
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute -left-32 top-1/3 h-[420px] w-[420px] rounded-full bg-[var(--color-mint)]/60 blur-3xl"
          />
        </section>

        {/* Stat strip */}
        <section className="border-y border-[var(--border)] bg-white">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4">
            {[
              { v: "180M+", l: "impressions our creators added" },
              { v: "12.4k", l: "customers worldwide" },
              { v: "94%", l: "report follower growth in 30d" },
              { v: "< 60s", l: "from purchase to inbox" },
            ].map((s) => (
              <div key={s.l}>
                <p
                  className="text-3xl tracking-tight text-[var(--color-ink)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {s.v}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">{s.l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-[var(--accent)]">
                The shop
              </p>
              <h2
                className="mt-2 text-4xl tracking-tight text-[var(--color-ink)] md:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Latest drops
              </h2>
            </div>
            <Link
              href="/products"
              className="hidden text-sm font-medium text-[var(--muted)] hover:text-[var(--color-ink)] md:block"
            >
              View all →
            </Link>
          </div>

          {featured.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-dashed border-[var(--border)] bg-white p-12 text-center text-[var(--muted)]">
              No products yet. Add some from{" "}
              <Link href="/admin" className="underline">
                /admin
              </Link>
              .
            </div>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => (
                <ProductCard
                  key={p.id}
                  slug={p.slug}
                  title={p.title}
                  shortDescription={p.shortDescription}
                  price={p.price}
                  currency={p.currency}
                  coverUrl={p.coverUrl}
                  category={p.category}
                />
              ))}
            </div>
          )}
        </section>

        {/* What you get */}
        <section id="how" className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-wider text-[var(--accent)]">
              What's inside
            </p>
            <h2
              className="mt-2 text-4xl tracking-tight text-[var(--color-ink)] md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Everything you need to post like a pro.
            </h2>
            <p className="mt-4 text-lg text-[var(--muted)]">
              Forget guesswork. Every product is battle-tested on accounts with
              real reach — and built so you can copy, paste, post.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                tone: "bg-[var(--color-mint)]",
                icon: <Zap size={20} strokeWidth={1.8} />,
                t: "500+ scroll-stopping hooks",
                d: "Plug-and-play first lines that stop the thumb mid-scroll, sorted by niche.",
              },
              {
                tone: "bg-[var(--color-sky)]",
                icon: <Film size={20} strokeWidth={1.8} />,
                t: "Reels templates that convert",
                d: "CapCut and Premiere templates with hooks, beats, and B-roll cues already mapped.",
              },
              {
                tone: "bg-[var(--color-peach)]",
                icon: <MessageCircle size={20} strokeWidth={1.8} />,
                t: "Caption frameworks",
                d: "Story-driven caption skeletons engineered for saves, shares, and comments.",
              },
              {
                tone: "bg-[var(--color-sky)]",
                icon: <Calendar size={20} strokeWidth={1.8} />,
                t: "30-day content calendars",
                d: "Themed posting plans for creators, coaches, brands, and shops.",
              },
              {
                tone: "bg-[var(--color-peach)]",
                icon: <Sparkles size={20} strokeWidth={1.8} />,
                t: "Bio + profile audits",
                d: "Optimize the first impression every new visitor sees in under five minutes.",
              },
              {
                tone: "bg-[var(--color-mint)]",
                icon: <TrendingUp size={20} strokeWidth={1.8} />,
                t: "Growth playbooks",
                d: "End-to-end strategies you can run in 30 / 60 / 90 day sprints.",
              },
            ].map((b) => (
              <div
                key={b.t}
                className="rounded-3xl bg-white p-6 transition-shadow hover:shadow-md"
              >
                <span
                  className={`grid h-10 w-10 place-items-center rounded-full ${b.tone} text-[var(--color-ink)]`}
                >
                  {b.icon}
                </span>
                <h3 className="mt-5 text-lg font-semibold text-[var(--color-ink)]">
                  {b.t}
                </h3>
                <p className="mt-2 text-sm text-[var(--muted)]">{b.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-[var(--accent)]">
                How it works
              </p>
              <h2
                className="mt-2 text-4xl tracking-tight text-[var(--color-ink)] md:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Buy. Download. Post.
              </h2>
              <p className="mt-4 text-lg text-[var(--muted)]">
                No accounts, no subscriptions, no waiting on a delivery team.
                Stripe handles checkout, we email the file the moment you pay.
              </p>
            </div>
            <ol className="space-y-4">
              {[
                {
                  n: "01",
                  t: "Pick your product",
                  d: "Browse the shop and grab the kit that fixes your bottleneck — hooks, Reels, captions, or strategy.",
                },
                {
                  n: "02",
                  t: "Check out with Stripe",
                  d: "Pay with card, Apple Pay, or Google Pay. Test mode on for now — no real charges.",
                },
                {
                  n: "03",
                  t: "Open your inbox",
                  d: "Your secure download link lands in under a minute. Save it — you can re-download anytime within the window.",
                },
                {
                  n: "04",
                  t: "Start posting",
                  d: "Copy a hook, drop a template, follow the playbook. Watch the saves stack up.",
                },
              ].map((s) => (
                <li
                  key={s.n}
                  className="flex gap-5 rounded-2xl bg-white p-5"
                >
                  <span
                    className="text-2xl tracking-tight text-[var(--accent)]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {s.n}
                  </span>
                  <div>
                    <p className="font-semibold text-[var(--color-ink)]">{s.t}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Testimonials */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <h2
            className="text-4xl tracking-tight text-[var(--color-ink)] md:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Loved by creators who post for a living.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                tone: "bg-[var(--color-mint)]",
                n: "Mira K.",
                r: "@miradesigns · 248k",
                q: "Went from 1 viral Reel a month to four in a row using these hooks. Money back in two days.",
              },
              {
                tone: "bg-[var(--color-sky)]",
                n: "Daniel S.",
                r: "@danielbuilds · 92k",
                q: "The 30-day calendar took the “what do I post” off my plate completely. Just execution now.",
              },
              {
                tone: "bg-[var(--color-peach)]",
                n: "Priya R.",
                r: "@priyathecoach · 41k",
                q: "Sold out my workshop using the bio audit + lead-magnet caption frame. Worth 100x what I paid.",
              },
            ].map((t) => (
              <figure
                key={t.n}
                className={`flex flex-col gap-6 rounded-3xl ${t.tone} p-7 text-[var(--color-ink)]`}
              >
                <blockquote
                  className="text-xl leading-snug"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  “{t.q}”
                </blockquote>
                <figcaption className="text-sm">
                  <span className="font-semibold">{t.n}</span>
                  <br />
                  <span className="text-[var(--color-ink)]/70">{t.r}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-3xl px-6 py-20">
          <h2
            className="text-4xl tracking-tight text-[var(--color-ink)] md:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Questions, answered.
          </h2>
          <div className="mt-10 divide-y divide-[var(--border)] rounded-3xl bg-white">
            {[
              {
                q: "Will this actually grow my Instagram?",
                a: "Our products give you the systems creators with real audiences use. Growth still requires you to post — but you'll never wonder what to post or how to frame it.",
              },
              {
                q: "Is this just AI-generated junk?",
                a: "No. Every hook, caption frame, template, and playbook is written and tested by working creators. We update them quarterly to track what the algorithm rewards.",
              },
              {
                q: "Do you use bots or fake followers?",
                a: "Never. We don't sell engagement, follows, or growth services. We sell the systems behind organic growth.",
              },
              {
                q: "How do I receive my product?",
                a: "Right after Stripe confirms your payment, we email a secure download link to the address you used at checkout.",
              },
              {
                q: "Do I need an account?",
                a: "No accounts. Checkout, then use the link in your inbox.",
              },
              {
                q: "What about refunds?",
                a: "Because everything is delivered instantly and digitally, all sales are final unless legally required.",
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

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="overflow-hidden rounded-[2rem] bg-[var(--color-ink)] px-10 py-16 text-white md:px-16 md:py-20">
            <p className="text-sm font-medium uppercase tracking-wider text-[var(--color-mint)]">
              Ready when you are
            </p>
            <h2
              className="mt-3 max-w-2xl text-4xl tracking-tight md:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Stop guessing.
              <br />
              <span className="italic text-[var(--color-mint)]">Start growing.</span>
            </h2>
            <p className="mt-4 max-w-xl text-white/70">
              Pick a product, get the kit, post tomorrow. That's it.
            </p>
            <Link
              href="/products"
              className="mt-10 inline-flex rounded-full bg-white px-7 py-3.5 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-mint)]"
            >
              Shop the catalog
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
