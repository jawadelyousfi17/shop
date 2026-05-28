import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function CancelPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-xl px-6 py-24">
          <div className="rounded-[2rem] bg-white p-10 text-center">
            <h1
              className="text-4xl tracking-tight text-[var(--color-ink)] md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              No worries.
            </h1>
            <p className="mt-3 text-[var(--muted)]">
              Your card wasn't charged. Whenever you're ready, the catalog is
              waiting.
            </p>
            <Link
              href="/products"
              className="mt-8 inline-flex rounded-full bg-[var(--color-ink)] px-7 py-3 text-sm font-medium text-white hover:opacity-90"
            >
              Back to the shop
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
