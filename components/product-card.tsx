import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

type Props = {
  slug: string;
  title: string;
  shortDescription: string;
  price: number;
  currency: string;
  coverUrl?: string | null;
  category?: string | null;
};

const tonePalette = [
  "bg-[var(--color-mint)]",
  "bg-[var(--color-sky)]",
  "bg-[var(--color-peach)]",
];

function toneFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return tonePalette[Math.abs(h) % tonePalette.length];
}

export function ProductCard({
  slug,
  title,
  shortDescription,
  price,
  currency,
  coverUrl,
  category,
}: Props) {
  const tone = toneFor(slug);

  return (
    <Link
      href={`/products/${slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className={`relative aspect-[4/3] overflow-hidden ${tone}`}>
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full items-center justify-center text-7xl tracking-tight text-[var(--color-ink)]/30"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title.slice(0, 1)}
          </div>
        )}
        {category && (
          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-[var(--color-ink)] backdrop-blur">
            {category}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3
          className="text-xl tracking-tight text-[var(--color-ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">
          {shortDescription}
        </p>
        <div className="mt-5 flex items-center justify-between">
          <span className="text-lg font-semibold text-[var(--color-ink)]">
            {formatPrice(price, currency)}
          </span>
          <span className="text-sm font-medium text-[var(--accent)] group-hover:underline">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
