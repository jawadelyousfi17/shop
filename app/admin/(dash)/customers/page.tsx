import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string }>;

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q } = await searchParams;
  let groups: {
    customerEmail: string;
    customerName: string | null;
    orders: Array<{
      id: string;
      amount: number;
      currency: string;
      createdAt: Date;
      product: { title: string };
    }>;
    total: number;
  }[] = [];
  let dbError: string | null = null;

  try {
    const orders = await prisma.order.findMany({
      where: q
        ? { customerEmail: { contains: q, mode: "insensitive" } }
        : undefined,
      orderBy: { createdAt: "desc" },
      include: { product: { select: { title: true } } },
    });

    const map = new Map<string, (typeof groups)[number]>();
    for (const o of orders) {
      const key = o.customerEmail;
      const ex = map.get(key);
      if (ex) {
        ex.orders.push({
          id: o.id,
          amount: o.amount,
          currency: o.currency,
          createdAt: o.createdAt,
          product: o.product,
        });
        ex.total += o.amount;
      } else {
        map.set(key, {
          customerEmail: o.customerEmail,
          customerName: o.customerName,
          orders: [
            {
              id: o.id,
              amount: o.amount,
              currency: o.currency,
              createdAt: o.createdAt,
              product: o.product,
            },
          ],
          total: o.amount,
        });
      }
    }
    groups = Array.from(map.values());
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
          Customers
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Everyone who bought from your store
        </p>
      </div>

      <form className="max-w-md">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by email…"
          className="h-11 w-full rounded-full bg-white px-4 text-sm placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]/20"
        />
      </form>

      {dbError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {dbError}
        </div>
      )}

      <div className="space-y-4">
        {groups.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center text-sm text-[var(--muted)]">
            No customers yet.
          </div>
        ) : (
          groups.map((g) => {
            const currency = g.orders[0]?.currency ?? "usd";
            return (
              <div
                key={g.customerEmail}
                className="rounded-3xl bg-white p-6 text-[var(--color-ink)]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{g.customerEmail}</p>
                    {g.customerName && (
                      <p className="text-sm text-[var(--muted)]">
                        {g.customerName}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-[var(--muted)]">
                      {g.orders.length} order{g.orders.length === 1 ? "" : "s"}
                    </p>
                    <p className="font-medium">
                      {formatPrice(g.total, currency)}
                    </p>
                  </div>
                </div>
                <ul className="mt-4 divide-y divide-[#eef0eb] text-sm">
                  {g.orders.map((o) => (
                    <li
                      key={o.id}
                      className="flex items-center justify-between py-2"
                    >
                      <span>{o.product.title}</span>
                      <span className="text-[var(--muted)]">
                        {formatDate(o.createdAt)} ·{" "}
                        {formatPrice(o.amount, o.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
