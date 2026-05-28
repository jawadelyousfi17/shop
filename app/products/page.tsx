import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { prisma } from "@/lib/prisma";
import { publicCoverUrl } from "@/lib/storage";

export const revalidate = 60;

type SearchParams = Promise<{ category?: string }>;

async function getProducts(category?: string) {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(category ? { category } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  return Promise.all(
    products.map(async (p) => ({
      ...p,
      coverUrl: await publicCoverUrl(p.coverImagePath),
    })),
  );
}

async function getCategories() {
  const rows = await prisma.product.findMany({
    where: { isActive: true, category: { not: null } },
    select: { category: true },
    distinct: ["category"],
  });
  return rows.map((r) => r.category).filter(Boolean) as string[];
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { category } = await searchParams;
  let products: Awaited<ReturnType<typeof getProducts>> = [];
  let categories: string[] = [];
  try {
    [products, categories] = await Promise.all([
      getProducts(category),
      getCategories(),
    ]);
  } catch {
    // db not configured — show empty
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium uppercase tracking-wider text-[var(--accent)]">
              The shop
            </p>
            <h1
              className="text-5xl tracking-tight text-[var(--color-ink)] md:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {category ?? "Everything in the shop"}
            </h1>
            <p className="max-w-2xl text-lg text-[var(--muted)]">
              Instagram-only. No generic templates, no recycled junk. Every
              product is built for one job — getting your account to grow.
            </p>
          </div>

          {categories.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2">
              <Link
                href="/products"
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  !category
                    ? "bg-[var(--color-ink)] text-white"
                    : "bg-white text-[var(--color-ink)] hover:bg-[var(--color-mint)]/50"
                }`}
              >
                All
              </Link>
              {categories.map((c) => (
                <Link
                  key={c}
                  href={`/products?category=${encodeURIComponent(c)}`}
                  className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                    category === c
                      ? "bg-[var(--color-ink)] text-white"
                      : "bg-white text-[var(--color-ink)] hover:bg-[var(--color-mint)]/50"
                  }`}
                >
                  {c}
                </Link>
              ))}
            </div>
          )}

          {products.length === 0 ? (
            <div className="mt-12 rounded-3xl border border-dashed border-[var(--border)] bg-white p-16 text-center text-[var(--muted)]">
              Nothing here yet.
            </div>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
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
      </main>
      <SiteFooter />
    </>
  );
}
