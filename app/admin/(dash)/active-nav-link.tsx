"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ActiveNavLink({
  href,
  label,
  icon,
  exact,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
        active
          ? "bg-[var(--color-ink)] text-white"
          : "text-[#5b6b5f] hover:bg-[#f3f4ef]",
      )}
    >
      <span className={cn(active ? "text-white" : "text-[#5b6b5f]")}>{icon}</span>
      {label}
    </Link>
  );
}
