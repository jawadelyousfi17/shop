"use client";

import { useState } from "react";

export function BuyButton({
  productId,
  trackedEmail,
  label = "Buy now — instant delivery",
}: {
  productId: string;
  trackedEmail?: string | null;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId, trackedEmail: trackedEmail ?? null }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Checkout failed");
      }
      window.location.assign(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex h-14 w-full items-center justify-center rounded-full bg-[var(--color-ink)] px-8 text-base font-medium text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Redirecting…" : label}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
