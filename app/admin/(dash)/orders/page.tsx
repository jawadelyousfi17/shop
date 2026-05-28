import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate } from "@/lib/utils";
import { ResendButton } from "./resend-button";
import { Search } from "lucide-react";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string }>;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q } = await searchParams;
  type OrderRow = Awaited<ReturnType<typeof prisma.order.findFirstOrThrow<{
    include: { product: { select: { title: true } } };
  }>>>;
  let orders: OrderRow[] = [];
  let dbError: string | null = null;
  try {
    orders = await prisma.order.findMany({
      where: q
        ? { customerEmail: { contains: q, mode: "insensitive" } }
        : undefined,
      orderBy: { createdAt: "desc" },
      include: { product: { select: { title: true } } },
      take: 100,
    });
  } catch (e) {
    dbError = e instanceof Error ? e.message : "Database not reachable";
  }

  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-4xl tracking-tight text-[var(--color-ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Orders
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          All purchases from your store
        </p>
      </div>

      <form className="relative max-w-md">
        <Search
          size={16}
          strokeWidth={1.8}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
        />
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by email…"
          className="h-11 w-full rounded-full bg-white pl-11 pr-4 text-sm placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]/20"
        />
      </form>

      {dbError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {dbError}
        </div>
      )}

      <section className="overflow-hidden rounded-3xl bg-white">
        {orders.length === 0 ? (
          <div className="p-12 text-center text-sm text-[var(--muted)]">
            No orders yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-t border-[#eef0eb] text-[var(--color-ink)]"
                  >
                    <td className="px-6 py-4 font-mono text-xs">
                      {o.id.slice(0, 10)}
                    </td>
                    <td className="px-6 py-4">
                      <div>{o.customerEmail}</div>
                      {o.customerName && (
                        <div className="text-xs text-[var(--muted)]">
                          {o.customerName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">{o.product.title}</td>
                    <td className="px-6 py-4">
                      {formatPrice(o.amount, o.currency)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill status={o.paymentStatus} />
                    </td>
                    <td className="px-6 py-4 text-[var(--muted)]">
                      {formatDate(o.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ResendButton orderId={o.id} />
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

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "bg-[var(--color-mint)] text-emerald-800",
    unpaid: "bg-[var(--color-peach)] text-amber-800",
    pending: "bg-[var(--color-sky)] text-sky-800",
  };
  const cls = map[status] ?? "bg-[#f3f4ef] text-[var(--color-ink)]";
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${cls}`}
    >
      {status}
    </span>
  );
}
