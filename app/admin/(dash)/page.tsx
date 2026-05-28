import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  Wallet,
  ListChecks,
  Package,
  PlusSquare,
  Store,
  Receipt,
  Users,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function getStats() {
  const [orders, productCount, recent, top] = await Promise.all([
    prisma.order.findMany({ select: { amount: true, currency: true } }),
    prisma.product.count(),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { product: { select: { title: true } } },
    }),
    prisma.order.groupBy({
      by: ["productId"],
      _count: { _all: true },
      orderBy: { _count: { productId: "desc" } },
      take: 5,
    }),
  ]);

  const revenueByCurrency = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.currency] = (acc[o.currency] ?? 0) + o.amount;
    return acc;
  }, {});
  const primaryCurrency = Object.keys(revenueByCurrency)[0] ?? "usd";
  const primaryRevenue = revenueByCurrency[primaryCurrency] ?? 0;

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const ordersToday = await prisma.order.count({
    where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
  });
  const ordersYesterday = await prisma.order.count({
    where: {
      createdAt: {
        gte: new Date(yesterday.setHours(0, 0, 0, 0)),
        lt: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
  });

  return {
    totalOrders: orders.length,
    productCount,
    primaryCurrency,
    primaryRevenue,
    recent,
    topProductIds: top.map((t) => t.productId),
    ordersToday,
    ordersYesterday,
  };
}

export default async function AdminOverview() {
  let stats: Awaited<ReturnType<typeof getStats>> | null = null;
  let dbError: string | null = null;
  try {
    stats = await getStats();
  } catch (e) {
    dbError = e instanceof Error ? e.message : "Database not reachable";
  }

  const todayDelta = stats
    ? stats.ordersToday - stats.ordersYesterday
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-4xl tracking-tight text-[var(--color-ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Manage products, orders, and customers
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          <ExternalLink size={14} strokeWidth={2} />
          View Store
        </Link>
      </div>

      {dbError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Database not reachable: {dbError}. Run <code>npx prisma migrate dev</code>.
        </div>
      )}

      {stats && (
        <>
          {/* Stat cards */}
          <div className="grid gap-5 md:grid-cols-3">
            <StatCard
              tone="mint"
              icon={<Wallet size={18} strokeWidth={1.8} />}
              label="Total Revenue"
              value={formatPrice(stats.primaryRevenue, stats.primaryCurrency)}
              hint={`${stats.totalOrders} order${stats.totalOrders === 1 ? "" : "s"} all-time`}
            />
            <StatCard
              tone="sky"
              icon={<ListChecks size={18} strokeWidth={1.8} />}
              label="Today's Orders"
              value={String(stats.ordersToday)}
              hint={
                todayDelta === 0
                  ? "same as yesterday"
                  : todayDelta > 0
                    ? `+${todayDelta} from yesterday`
                    : `${todayDelta} from yesterday`
              }
            />
            <StatCard
              tone="peach"
              icon={<Package size={18} strokeWidth={1.8} />}
              label="Active Products"
              value={String(stats.productCount)}
              hint="in the catalog"
            />
          </div>

          {/* Quick Actions */}
          <section className="rounded-3xl bg-white p-6">
            <h2 className="text-lg font-semibold text-[var(--color-ink)]">
              Quick Actions
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <ActionCard
                href="/admin/products/new"
                icon={<PlusSquare size={20} strokeWidth={1.8} />}
                title="New Product"
                subtitle="Add a digital item"
                accent
              />
              <ActionCard
                href="/admin/products"
                icon={<Store size={20} strokeWidth={1.8} />}
                title="Products"
                subtitle="Manage catalog"
              />
              <ActionCard
                href="/admin/orders"
                icon={<Receipt size={20} strokeWidth={1.8} />}
                title="Orders"
                subtitle="Review purchases"
              />
              <ActionCard
                href="/admin/customers"
                icon={<Users size={20} strokeWidth={1.8} />}
                title="Customers"
                subtitle="Browse buyers"
              />
            </div>
          </section>

          {/* Recent Orders */}
          <section className="rounded-3xl bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--color-ink)]">
                Recent Orders
              </h2>
              <Link
                href="/admin/orders"
                className="text-sm text-[var(--muted)] hover:text-[var(--color-ink)]"
              >
                View all →
              </Link>
            </div>

            {stats.recent.length === 0 ? (
              <p className="mt-6 text-sm text-[var(--muted)]">
                No orders yet.
              </p>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                      <th className="pb-3 pr-4">Order ID</th>
                      <th className="pb-3 pr-4">Customer</th>
                      <th className="pb-3 pr-4">Product</th>
                      <th className="pb-3 pr-4">Amount</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent.map((o) => (
                      <tr
                        key={o.id}
                        className="border-t border-[#eef0eb] text-[var(--color-ink)]"
                      >
                        <td className="py-4 pr-4 font-mono text-xs">
                          {o.id.slice(0, 8)}
                        </td>
                        <td className="py-4 pr-4">{o.customerEmail}</td>
                        <td className="py-4 pr-4">{o.product.title}</td>
                        <td className="py-4 pr-4">
                          {formatPrice(o.amount, o.currency)}
                        </td>
                        <td className="py-4 pr-4">
                          <StatusPill status={o.paymentStatus} />
                        </td>
                        <td className="py-4 text-[var(--muted)]">
                          {formatDate(o.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({
  tone,
  icon,
  label,
  value,
  hint,
}: {
  tone: "mint" | "sky" | "peach";
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  const bg = {
    mint: "bg-[var(--color-mint)]",
    sky: "bg-[var(--color-sky)]",
    peach: "bg-[var(--color-peach)]",
  }[tone];
  return (
    <div className={`rounded-3xl ${bg} p-6`}>
      <div className="flex items-center justify-between text-[var(--color-ink)]">
        <span className="text-sm font-medium">{label}</span>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-white/60">
          {icon}
        </span>
      </div>
      <p
        className="mt-6 text-3xl tracking-tight text-[var(--color-ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </p>
      <p className="mt-2 text-xs text-[var(--color-ink)]/70">{hint}</p>
    </div>
  );
}

function ActionCard({
  href,
  icon,
  title,
  subtitle,
  accent,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center rounded-2xl px-5 py-6 text-center transition-colors ${
        accent
          ? "bg-[var(--color-ink)] text-white hover:opacity-95"
          : "bg-[#f7f8f4] text-[var(--color-ink)] hover:bg-[#eef0eb]"
      }`}
    >
      <span
        className={`grid h-10 w-10 place-items-center rounded-full ${
          accent ? "bg-white/10" : "bg-white"
        }`}
      >
        {icon}
      </span>
      <p className="mt-4 text-base font-semibold">{title}</p>
      <p
        className={`mt-1 text-xs ${accent ? "text-white/70" : "text-[var(--muted)]"}`}
      >
        {subtitle}
      </p>
    </Link>
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
