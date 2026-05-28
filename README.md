# Stack — Digital Products Store

Production-ready full-stack store for selling digital products (e-books, templates, guides) built with:

- **Next.js 16** App Router + TypeScript + Tailwind v4
- **Prisma** + **Neon** Postgres
- **Stripe Checkout** + webhooks for payments
- **Resend** for transactional email
- **Supabase** Auth (admin) + Storage (covers & digital files)

Public visitors browse, buy via Stripe, and receive a secure, tokenized download link by email. An admin dashboard manages products, orders, and customers.

---

## Architecture

```
app/
  page.tsx                  # Home (hero, featured, benefits, FAQ, CTA)
  products/                 # /products listing + /products/[slug]
  success/, cancel/         # Stripe redirect pages
  download/[token]/route.ts # Tokenized, signed download
  api/
    checkout/route.ts       # Creates Stripe Checkout session
    webhook/route.ts        # Stripe webhook → order + email
  admin/
    login/                  # Public login form (Supabase Auth)
    (dash)/                 # Protected dashboard (overview, products, orders, customers)
lib/
  prisma.ts, env.ts, utils.ts
  stripe.ts, email.ts, storage.ts
  supabase/{server,client,admin}.ts
  auth.ts, admin-actions.ts # Server Actions (CRUD + resend email)
middleware.ts               # Refreshes Supabase session + guards /admin
prisma/schema.prisma        # Product, Order, AdminUser
```

### Payment flow

1. Customer clicks **Buy now** → `POST /api/checkout`.
2. Server creates Stripe Checkout session with `metadata.productId`.
3. Customer pays on Stripe → redirected to `/success?session_id=...`.
4. Stripe sends `checkout.session.completed` → `POST /api/webhook`.
5. Webhook validates signature, creates `Order`, generates `downloadToken`, emails secure link.
6. Customer visits `/download/<token>` → server validates → signed Supabase URL → 302 redirect.

> Product files are **never** delivered from the success page. Only the webhook can create an `Order`, so a leaked `session_id` cannot trigger delivery.

### Security

- Webhook signature verified using `STRIPE_WEBHOOK_SECRET`.
- Digital files live in a **private** Supabase Storage bucket; only signed URLs are emitted, valid for 60s.
- Download tokens expire after `DOWNLOAD_EXPIRY_DAYS` days and `DOWNLOAD_MAX_COUNT` downloads.
- `/admin/*` is guarded by middleware (must be logged in) and by `requireAdmin()` in the layout (`user.email === ADMIN_EMAIL`).
- All Server Actions re-check `requireAdmin()` themselves — never trust the client.

---

## Quick start

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in:

| Var | Where to get it |
| --- | --- |
| `DATABASE_URL`, `DIRECT_URL` | Neon project → Connection details (pooled URL for `DATABASE_URL`, direct URL for migrations) |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe dashboard → Developers → API keys (test mode) |
| `STRIPE_WEBHOOK_SECRET` | `stripe listen` (see below) or Stripe Dashboard webhook endpoint |
| `RESEND_API_KEY` | Resend dashboard → API Keys |
| `RESEND_FROM_EMAIL` | A verified sender domain, e.g. `Store <orders@yourdomain.com>` |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API |
| `SUPABASE_STORAGE_BUCKET` | Private bucket name (default `digital-products`) |
| `ADMIN_EMAIL` | The single email allowed to access `/admin` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` in dev, your domain in prod |
| `SUPPORT_EMAIL` | Customer-facing support address |
| `DOWNLOAD_EXPIRY_DAYS`, `DOWNLOAD_MAX_COUNT` | Token validity policy |

### 3. Database

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Supabase setup

1. Create a **private** Storage bucket named `digital-products` (or whatever you put in `SUPABASE_STORAGE_BUCKET`).
   - Must **not** be public — files are served only through signed URLs.
2. Authentication → Users → create the admin account (email matches `ADMIN_EMAIL`, set a password).
3. Auth → Providers → ensure Email is enabled.

### 5. Stripe webhook (local dev)

In a second terminal:

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

Copy the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET`.

### 6. Run

```bash
npm run dev
```

- Public store: <http://localhost:3000>
- Admin login: <http://localhost:3000/admin/login>

---

## Deploy to Vercel

### One-time setup

1. **Push to GitHub.**
   ```bash
   git add .
   git commit -m "Vercel ready"
   git push
   ```
2. **Import** the repo at <https://vercel.com/new>. Framework auto-detects as Next.js.
3. **Production database** — run migrations once against your production Neon DB from your laptop:
   ```bash
   DATABASE_URL="<prod>" DIRECT_URL="<prod-direct>" npx prisma migrate deploy
   ```
   On every later schema change repeat this (Vercel does not run migrations).
4. **Environment variables** — Vercel Dashboard → Project → Settings → Environment Variables. Paste every key from `.env.example`. Set scope to **Production** (and optionally **Preview** with test keys).
   - `NEXT_PUBLIC_SITE_URL` = `https://<your-vercel-domain>` (or your custom domain). No trailing slash.
   - Stripe keys: use **live** for Production, **test** for Preview.
   - `ADMIN_EMAIL` must match a confirmed Supabase Auth user.
5. **Stripe webhook (live)** — Stripe Dashboard → Developers → Webhooks → Add endpoint:
   - URL: `https://<your-domain>/api/webhook`
   - Event: `checkout.session.completed`
   - Copy the signing secret → paste into Vercel as `STRIPE_WEBHOOK_SECRET` for Production → **Redeploy**.
6. **Supabase** — confirm the Storage bucket is **private** in prod (it's enforced via signed URLs anyway, but defense in depth).
7. **Elyosoft webhook** — set `ELYOSOFT_WEBHOOK_URL` and `ELYOSOFT_WEBHOOK_SECRET` in Vercel. The matching secret on Elyosoft must be identical.

### How the build works on Vercel

- `package.json` → `"build": "prisma generate && next build"` — Prisma client is generated against the bundled binary `rhel-openssl-3.0.x` set in `prisma/schema.prisma`.
- `"postinstall": "prisma generate"` — guarantees the client exists even if a deploy skips the build script.
- `vercel.json` extends `maxDuration` on the webhook (30s), checkout, and download routes.

### Vercel body-size limit (important if uploading large files)

Server Action body limit is set to `100mb` in `next.config.ts`, **but Vercel enforces a hard 4.5MB request cap on serverless function payloads on the Hobby plan and 100MB+ on Pro**.

If you ship on Hobby and need to upload digital files larger than 4.5MB:

- Option A: upgrade to Pro.
- Option B: switch the admin file upload to direct-to-Supabase using `createSignedUploadUrl` (browser PUTs straight to Supabase Storage; the Server Action only saves the path). Ask Claude to wire this if needed.

### Triggering a redeploy after env changes

Vercel does **not** auto-rebuild when env vars change. Click **Redeploy** on the latest deployment or push an empty commit.

### Verify the deploy

1. Visit `https://<domain>` → home loads.
2. Visit `/admin/login` → log in with `ADMIN_EMAIL`.
3. Create a product.
4. Open `/products/<slug>?u=you@example.com`, buy with Stripe test card `4242 4242 4242 4242`.
5. Stripe Dashboard → Webhooks → endpoint → confirm `200 OK` event delivery.
6. Inbox → secure download link arrives.
7. Elyosoft logs → `/upadte-user` returned `200`.

If a step fails, check Vercel → Project → Logs (Functions tab) for the matching route.

---

## Operations

- Add a product → `/admin/products/new`. Cover image and digital file upload to Supabase Storage.
- Resend a download email → `/admin/orders` → **Resend email**.
- Search → `/admin/orders?q=email`, `/admin/customers?q=email`.

---

## Notes on Next.js 16

- `params`, `searchParams`, `cookies()`, `headers()` are **async** and must be awaited.
- Route handlers are **not cached by default**; checkout/webhook/download routes opt into `runtime = "nodejs"` and `dynamic = "force-dynamic"` where needed.
- Server Actions are POST endpoints — every action re-authenticates via `requireAdmin()`.
