function required(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

export const env = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  stripeSecret: () => required("STRIPE_SECRET_KEY"),
  stripePublishable: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
  stripeIsTestMode:
    (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "").startsWith("pk_test_"),
  stripeWebhookSecret: () => required("STRIPE_WEBHOOK_SECRET"),
  resendKey: () => required("RESEND_API_KEY"),
  resendFrom: () => required("RESEND_FROM_EMAIL"),
  supportEmail: process.env.SUPPORT_EMAIL ?? "support@example.com",
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnon: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseService: () => required("SUPABASE_SERVICE_ROLE_KEY"),
  bucket: process.env.SUPABASE_STORAGE_BUCKET ?? "digital-products",
  adminEmail: () => required("ADMIN_EMAIL"),
  downloadExpiryDays: Number(process.env.DOWNLOAD_EXPIRY_DAYS ?? 7),
  downloadMaxCount: Number(process.env.DOWNLOAD_MAX_COUNT ?? 5),
  elyosoftWebhookUrl: process.env.ELYOSOFT_WEBHOOK_URL ?? "",
  elyosoftWebhookSecret: process.env.ELYOSOFT_WEBHOOK_SECRET ?? "",
};
