import { env } from "@/lib/env";

export function TestModeBanner() {
  if (!env.stripeIsTestMode) return null;
  return (
    <div className="w-full bg-amber-400 text-amber-950 text-xs font-medium">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-1.5">
        <span>
          <strong>STRIPE TEST MODE</strong> — no real charges. Use card{" "}
          <code className="font-mono">4242 4242 4242 4242</code>, any future
          expiry, any CVC.
        </span>
        <a
          href="https://stripe.com/docs/testing"
          target="_blank"
          rel="noreferrer"
          className="underline whitespace-nowrap"
        >
          Test cards →
        </a>
      </div>
    </div>
  );
}
