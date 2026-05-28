"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  async function signOut() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.refresh();
    router.replace("/admin/login");
  }
  return (
    <button
      onClick={signOut}
      className="flex w-full items-center gap-3 rounded-xl bg-[var(--color-mint)] px-4 py-3 text-sm font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-mint-deep)]"
    >
      <LogOut size={16} strokeWidth={1.8} />
      Sign Out
    </button>
  );
}
