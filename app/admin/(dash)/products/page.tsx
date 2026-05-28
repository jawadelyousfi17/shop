import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate } from "@/lib/utils";
import { DeleteProductButton } from "./delete-button";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  let products: Awaited<ReturnType<typeof prisma.product.findMany>> = [];
  let dbError: string | null = null;
  try {
    products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (e) {
    dbError = e instanceof Error ? e.message : "Database not reachable";
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-4xl tracking-tight text-[var(--color-ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Products
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Add, edit, and manage your catalog
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus size={16} strokeWidth={2} />
          New Product
        </Link>
      </div>

      {dbError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {dbError}
        </div>
      )}

      <section className="overflow-hidden rounded-3xl bg-white">
        {products.length === 0 ? (
          <div className="p-12 text-center text-sm text-[var(--muted)]">
            No products yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-[#eef0eb] text-[var(--color-ink)]"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium">{p.title}</div>
                      <div className="text-xs text-[var(--muted)]">/{p.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      {formatPrice(p.price, p.currency)}
                    </td>
                    <td className="px-6 py-4">
                      {p.isActive ? (
                        <span className="inline-flex rounded-full bg-[var(--color-mint)] px-3 py-1 text-xs font-medium text-emerald-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-[#f3f4ef] px-3 py-1 text-xs font-medium text-[var(--muted)]">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[var(--muted)]">
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="mr-4 text-sm hover:underline"
                      >
                        Edit
                      </Link>
                      <DeleteProductButton id={p.id} title={p.title} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
