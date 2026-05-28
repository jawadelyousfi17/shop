import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-[var(--border)] bg-[var(--color-mint)]/30">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-3">
        <div>
          <Link
            href="/"
            className="text-3xl tracking-tight text-[var(--color-ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Rise<span className="text-[var(--accent)]">.</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-[var(--muted)]">
            Instagram growth products built by creators who shipped real
            audiences. No bots. No engagement pods. Just what works in 2026.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[var(--color-ink)]">Shop</h4>
          <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
            <li><Link href="/products">All products</Link></li>
            <li><Link href="/products?category=Hooks">Hook libraries</Link></li>
            <li><Link href="/products?category=Reels">Reels templates</Link></li>
            <li><Link href="/products?category=Playbooks">Growth playbooks</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[var(--color-ink)]">Support</h4>
          <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
            <li>
              <a href={`mailto:${process.env.SUPPORT_EMAIL ?? "support@example.com"}`}>
                {process.env.SUPPORT_EMAIL ?? "support@example.com"}
              </a>
            </li>
            <li><Link href="/#faq">FAQ</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 text-xs text-[var(--muted)]">
          <span>© {new Date().getFullYear()} Rise. All rights reserved.</span>
          <span>Secure checkout by Stripe</span>
        </div>
      </div>
    </footer>
  );
}
