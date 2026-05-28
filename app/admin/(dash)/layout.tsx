import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { LogoutButton } from "../logout-button";
import {
  LayoutDashboard,
  Package,
  Receipt,
  Users,
  Moon,
} from "lucide-react";
import { ActiveNavLink } from "./active-nav-link";

export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: Receipt },
  { href: "/admin/customers", label: "Customers", icon: Users },
];

export default async function AdminDashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  const initials = (user.email ?? "A")
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="grid min-h-screen grid-cols-[260px_1fr] bg-[#f3f4ef]">
      <aside className="m-3 mr-0 flex flex-col rounded-3xl bg-white p-5">
        <div className="px-3 py-4">
          <Link
            href="/admin"
            className="font-[var(--font-display)] text-3xl tracking-tight text-[var(--color-ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Rise<span className="text-[var(--accent)]">.</span>
          </Link>
        </div>

        <nav className="mt-6 flex flex-col gap-1">
          {nav.map((n) => (
            <ActiveNavLink
              key={n.href}
              href={n.href}
              exact={n.exact}
              icon={<n.icon size={18} strokeWidth={1.8} />}
              label={n.label}
            />
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between rounded-2xl bg-[#f3f4ef] p-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-ink)] text-sm font-semibold text-white">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                  Admin
                </p>
                <p className="truncate text-xs text-[var(--muted)]">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Theme"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[var(--muted)] hover:bg-white"
            >
              <Moon size={16} strokeWidth={1.8} />
            </button>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <main className="overflow-x-hidden p-8">{children}</main>
    </div>
  );
}
