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

## Deployment

1. Push to GitHub and import into Vercel.
2. Set every env var from `.env.example` in Vercel project settings.
3. Add a Stripe webhook endpoint at `https://<your-domain>/api/webhook` listening to `checkout.session.completed`; copy its signing secret to `STRIPE_WEBHOOK_SECRET`.
4. Run `npx prisma migrate deploy` against the production DB (or wire it into the Vercel build command).
5. Confirm the Supabase Storage bucket is **private** in production.

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
