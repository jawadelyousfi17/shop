import { supabaseAdmin } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

export async function publicCoverUrl(path: string | null | undefined) {
  if (!path) return null;
  const { data } = supabaseAdmin().storage.from(env.bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function signedDownloadUrl(path: string, expiresInSeconds = 60) {
  const { data, error } = await supabaseAdmin()
    .storage.from(env.bucket)
    .createSignedUrl(path, expiresInSeconds, { download: true });
  if (error || !data) throw new Error(error?.message ?? "signing failed");
  return data.signedUrl;
}
