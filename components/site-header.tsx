import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-2xl tracking-tight text-[var(--color-ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Rise<span className="text-[var(--accent)]">.</span>
        </Link>
        <nav className="flex items-center gap-7 text-sm">
          <Link href="/products" className="text-[var(--muted)] hover:text-[var(--color-ink)]">
            Shop
          </Link>
          <Link href="/#how" className="text-[var(--muted)] hover:text-[var(--color-ink)]">
            How it works
          </Link>
          <Link href="/#faq" className="text-[var(--muted)] hover:text-[var(--color-ink)]">
            FAQ
          </Link>
          <Link
            href="/products"
            className="rounded-full bg-[var(--color-ink)] px-4 py-2 text-white font-medium hover:opacity-90"
          >
            Browse products
          </Link>
        </nav>
      </div>
    </header>
  );
}
