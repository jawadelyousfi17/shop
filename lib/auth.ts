import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export async function requireAdmin() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  if (user.email !== env.adminEmail()) {
    redirect("/admin/login?error=not_admin");
  }
  return user;
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
