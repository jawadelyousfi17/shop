import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let cached: ReturnType<typeof createClient> | null = null;

export function supabaseAdmin() {
  if (cached) return cached;
  cached = createClient(env.supabaseUrl(), env.supabaseService(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}
