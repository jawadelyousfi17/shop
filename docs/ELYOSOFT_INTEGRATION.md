# Implement: Rise → Elyosoft purchase webhook

**Audience:** AI coding agent working inside the `elyosoft.online` codebase.
**Goal:** Add one endpoint that receives signed purchase events from the Rise store and grants the matching user their purchase on the Elyosoft side.

You are working on **Elyosoft** (`elyosoft.online`). The **Rise** store (`https://<rise-domain>`) is a separate Next.js app. You do **not** modify Rise — only Elyosoft.

---

## 1. Why this exists

Rise sells digital products. Every product page can be opened with a query string:

```
https://<rise-domain>/products/<slug>?u=<user-email>
```

When a customer pays via Stripe, Rise:

1. Stores the order.
2. Emails the customer a download link.
3. Sends a signed HTTP POST to **your** endpoint with the email + price + order info.

You must:

1. Receive that POST.
2. Verify the HMAC signature.
3. Find the user by email in your DB.
4. Grant whatever entitlement matches the purchase.
5. Store a `rise_orders` ledger row so duplicate deliveries are no-ops.

---

## 2. Contract (exact wire format)

### Request

- **Method:** `POST`
- **URL:** `https://www.elyosoft.online/upadte-user`
  > Yes, the typo `upadte` is intentional — Rise is already configured to hit this exact path. Do not "fix" it.
- **Content-Type:** `application/json`
- **Headers:**
  - `x-rise-signature: t=<unix_ts>,v1=<hex_hmac_sha256>`

### Body (JSON)

```json
{
  "email": "user@example.com",
  "price": 1900,
  "currency": "usd",
  "productId": "cmxyz123abc",
  "productTitle": "Hook Library 2026",
  "orderId": "ord_clx987...",
  "timestamp": 1738096800
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `email` | string | Comes from `?u=` on Rise. Trust only after signature verification. |
| `price` | integer | **Cents.** `1900` = $19.00. |
| `currency` | string | Lowercase ISO 4217, usually `usd`. |
| `productId` | string | Opaque ID from Rise. Stable per product. |
| `productTitle` | string | Human label, may change. Don't key on it. |
| `orderId` | string | Unique per purchase. **Use this as the idempotency key.** |
| `timestamp` | integer | Unix seconds when Rise sent the event. |

### Responses you must return

| Situation | Status | Body |
| --- | --- | --- |
| Success / already processed | `200` | `{"ok": true}` |
| Missing or malformed signature header | `400` | `{"error": "bad signature header"}` |
| Timestamp outside ±5 minutes | `400` | `{"error": "stale"}` |
| Signature does not match | `401` | `{"error": "bad signature"}` |
| User not found and you don't auto-create | `404` | `{"error": "user not found"}` |
| Internal error | `500` | `{"error": "server"}` |

**Reply within 10 seconds.** Rise aborts the request after 10s.

---

## 3. Environment variable

Add one env var to Elyosoft:

```
RISE_WEBHOOK_SECRET=<long-random-string>
```

This is a **shared symmetric secret** between Rise and Elyosoft. Generate once with `openssl rand -hex 32` and paste the same value into both apps.

Never log it. Never expose it client-side.

---

## 4. Signature verification (canonical algorithm)

The signature is HMAC-SHA256 over `"<timestamp>.<raw_request_body>"`, hex-encoded.

You must:

1. Capture the **raw request body** as a string — _before_ any JSON parser touches it. If your framework auto-parses JSON, you must opt out for this route.
2. Parse the header `x-rise-signature: t=<ts>,v1=<hex>`.
3. Reject if `|now_seconds - ts| > 300`.
4. Compute `expected = HMAC_SHA256(RISE_WEBHOOK_SECRET, ts + "." + raw_body)` as hex.
5. Compare `expected` to `v1` using a **constant-time** comparison.
6. Only then `JSON.parse(raw_body)`.

If the signature passes, the payload is authentic and from Rise.

---

## 5. Implementation

Pick the section that matches Elyosoft's stack. If the stack is unknown, scan `package.json` / `requirements.txt` / `composer.json` / `Gemfile` first.

### 5.1 Node + Express

```js
// routes/rise-webhook.js
import express from "express";
import crypto from "node:crypto";
import { handleRiseOrder } from "../services/rise.js";

export const riseRouter = express.Router();

riseRouter.post(
  "/upadte-user",
  // CRITICAL: capture raw body. Do NOT mount express.json() before this route.
  express.raw({ type: "application/json", limit: "256kb" }),
  async (req, res) => {
    const raw = req.body.toString("utf8");
    const header = req.headers["x-rise-signature"];
    if (typeof header !== "string") {
      return res.status(400).json({ error: "bad signature header" });
    }

    const parts = Object.fromEntries(
      header.split(",").map((p) => p.split("=")),
    );
    const ts = Number(parts.t);
    const v1 = parts.v1;
    if (!ts || !v1) {
      return res.status(400).json({ error: "bad signature header" });
    }

    if (Math.abs(Date.now() / 1000 - ts) > 300) {
      return res.status(400).json({ error: "stale" });
    }

    const expected = crypto
      .createHmac("sha256", process.env.RISE_WEBHOOK_SECRET)
      .update(`${ts}.${raw}`)
      .digest("hex");

    const a = Buffer.from(v1, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(401).json({ error: "bad signature" });
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return res.status(400).json({ error: "bad json" });
    }

    try {
      await handleRiseOrder(payload);
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error("rise webhook", e);
      return res.status(500).json({ error: "server" });
    }
  },
);
```

Mount it before any global `express.json()` middleware:

```js
import express from "express";
import { riseRouter } from "./routes/rise-webhook.js";

const app = express();
app.use(riseRouter);      // raw body route FIRST
app.use(express.json());  // global JSON parser AFTER
```

### 5.2 Next.js App Router (route handler)

```ts
// app/upadte-user/route.ts
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { handleRiseOrder } from "@/lib/rise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const raw = await req.text(); // never .json() here

  const header = req.headers.get("x-rise-signature");
  if (!header) {
    return NextResponse.json({ error: "bad signature header" }, { status: 400 });
  }

  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=")));
  const ts = Number(parts.t);
  const v1 = parts.v1;
  if (!ts || !v1) {
    return NextResponse.json({ error: "bad signature header" }, { status: 400 });
  }

  if (Math.abs(Date.now() / 1000 - ts) > 300) {
    return NextResponse.json({ error: "stale" }, { status: 400 });
  }

  const expected = crypto
    .createHmac("sha256", process.env.RISE_WEBHOOK_SECRET!)
    .update(`${ts}.${raw}`)
    .digest("hex");

  const a = Buffer.from(v1, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }

  let payload: RisePayload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  try {
    await handleRiseOrder(payload);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("rise webhook", e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

type RisePayload = {
  email: string;
  price: number;
  currency: string;
  productId: string;
  productTitle: string;
  orderId: string;
  timestamp: number;
};
```

### 5.3 Python + FastAPI

```python
# app/routes/rise.py
import hmac, hashlib, json, time, os
from fastapi import APIRouter, Request, Response
from app.services.rise import handle_rise_order

router = APIRouter()

@router.post("/upadte-user")
async def rise_webhook(request: Request):
    raw = await request.body()
    header = request.headers.get("x-rise-signature")
    if not header:
        return Response('{"error":"bad signature header"}', 400, media_type="application/json")

    try:
        parts = dict(p.split("=") for p in header.split(","))
        ts = int(parts["t"])
        v1 = parts["v1"]
    except Exception:
        return Response('{"error":"bad signature header"}', 400, media_type="application/json")

    if abs(time.time() - ts) > 300:
        return Response('{"error":"stale"}', 400, media_type="application/json")

    secret = os.environ["RISE_WEBHOOK_SECRET"].encode()
    expected = hmac.new(secret, f"{ts}.{raw.decode()}".encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, v1):
        return Response('{"error":"bad signature"}', 401, media_type="application/json")

    try:
        payload = json.loads(raw)
    except Exception:
        return Response('{"error":"bad json"}', 400, media_type="application/json")

    try:
        await handle_rise_order(payload)
        return {"ok": True}
    except Exception as e:
        print("rise webhook", e)
        return Response('{"error":"server"}', 500, media_type="application/json")
```

### 5.4 PHP (raw body)

```php
// upadte-user.php
$raw = file_get_contents("php://input");
$header = $_SERVER["HTTP_X_RISE_SIGNATURE"] ?? "";
$parts = [];
foreach (explode(",", $header) as $p) {
    [$k, $v] = array_pad(explode("=", $p, 2), 2, null);
    $parts[$k] = $v;
}
$ts = isset($parts["t"]) ? (int)$parts["t"] : 0;
$v1 = $parts["v1"] ?? "";

http_response_code(200);
header("Content-Type: application/json");

if (!$ts || !$v1)                       { http_response_code(400); echo '{"error":"bad signature header"}'; exit; }
if (abs(time() - $ts) > 300)            { http_response_code(400); echo '{"error":"stale"}'; exit; }

$expected = hash_hmac("sha256", $ts . "." . $raw, getenv("RISE_WEBHOOK_SECRET"));
if (!hash_equals($expected, $v1))       { http_response_code(401); echo '{"error":"bad signature"}'; exit; }

$payload = json_decode($raw, true);
if (!$payload)                          { http_response_code(400); echo '{"error":"bad json"}'; exit; }

// handleRiseOrder($payload);
echo '{"ok":true}';
```

---

## 6. `handleRiseOrder` — what to actually do

The verifier only proves the message is real. **You** decide what "update user" means. Common patterns:

### Required steps (do all of these)

1. **Dedupe.** Look up `rise_orders` by `payload.orderId`. If a row exists, return `{ok:true}` immediately. Do not mutate anything.
2. **Resolve user.** `SELECT * FROM users WHERE lower(email) = lower(payload.email)`.
   - If found → use that user.
   - If not found → pick one policy:
     - **Auto-create stub user** (`email`, no password, marked "from-rise"), and continue.
     - **Reject with 404** so Rise logs it; you fix manually.
3. **Insert ledger row** in the same transaction as the entitlement update.
4. **Grant entitlement** (see below).

### Domain-specific entitlement (pick what matches Elyosoft's business)

Adapt to your real model. Examples:

- **Unlock a feature/module**
  ```sql
  INSERT INTO user_entitlements (user_id, entitlement_key, source, source_ref)
  VALUES ($1, $2, 'rise', $3)
  ON CONFLICT DO NOTHING;
  ```
  where `entitlement_key` is mapped from `payload.productId` via a static map you control:
  ```js
  const RISE_PRODUCT_MAP = {
    "cmxyz123abc": "hook_library_2026",
    "cmpdq456def": "reels_templates_v3",
  };
  ```

- **Add credits**
  ```sql
  UPDATE users
  SET credits = credits + $2
  WHERE id = $1;
  ```
  where credits = `payload.price / 100` or any conversion rule you choose.

- **Set / extend plan**
  ```sql
  UPDATE users
  SET plan = 'pro',
      paid_until = GREATEST(paid_until, now()) + INTERVAL '30 days'
  WHERE id = $1;
  ```

- **Just log** (if Elyosoft has no entitlement model yet): only insert the `rise_orders` row. No user mutation. You can wire up entitlements later — every past order is in the ledger.

---

## 7. Database migration

Add this table to Elyosoft (Postgres syntax shown; adapt for MySQL/SQLite as needed):

```sql
CREATE TABLE rise_orders (
  order_id      TEXT PRIMARY KEY,
  user_id       TEXT REFERENCES users(id),
  email         TEXT NOT NULL,
  price_cents   INTEGER NOT NULL,
  currency      TEXT NOT NULL,
  product_id    TEXT NOT NULL,
  product_name  TEXT NOT NULL,
  raw_payload   JSONB NOT NULL,
  received_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX rise_orders_email_idx    ON rise_orders (email);
CREATE INDEX rise_orders_user_id_idx  ON rise_orders (user_id);
```

If using an ORM (Prisma / Drizzle / TypeORM / SQLAlchemy / Eloquent), translate one-to-one and run the migration with the project's standard command.

**`order_id` as PRIMARY KEY is the idempotency mechanism.** A duplicate Rise call attempts to insert the same `order_id` and you get a constraint violation — catch it and return `200 {ok:true}`.

---

## 8. Service module (reference shape)

```ts
// services/rise.ts (TypeScript example; translate for your runtime)
import { db } from "@/lib/db";

const RISE_PRODUCT_MAP: Record<string, string> = {
  // Fill these in with real productId → entitlement_key mappings.
};

type RisePayload = {
  email: string;
  price: number;
  currency: string;
  productId: string;
  productTitle: string;
  orderId: string;
  timestamp: number;
};

export async function handleRiseOrder(p: RisePayload): Promise<void> {
  // 1. dedupe
  const existing = await db.riseOrder.findUnique({ where: { orderId: p.orderId } });
  if (existing) return;

  // 2. resolve user
  let user = await db.user.findFirst({
    where: { email: { equals: p.email, mode: "insensitive" } },
  });

  if (!user) {
    // Policy: auto-create stub user. Adjust to your real model.
    user = await db.user.create({
      data: {
        email: p.email.toLowerCase(),
        source: "rise",
      },
    });
  }

  // 3. ledger + entitlement in one transaction
  await db.$transaction(async (tx) => {
    await tx.riseOrder.create({
      data: {
        orderId: p.orderId,
        userId: user!.id,
        email: p.email,
        priceCents: p.price,
        currency: p.currency,
        productId: p.productId,
        productName: p.productTitle,
        rawPayload: p as unknown as object,
      },
    });

    const entitlementKey = RISE_PRODUCT_MAP[p.productId];
    if (entitlementKey) {
      await tx.userEntitlement.upsert({
        where: {
          userId_entitlementKey: {
            userId: user!.id,
            entitlementKey,
          },
        },
        update: {},
        create: {
          userId: user!.id,
          entitlementKey,
          source: "rise",
          sourceRef: p.orderId,
        },
      });
    }
  });
}
```

---

## 9. Test plan

### 9.1 Local unit test — signature failure paths

```js
// __tests__/rise-webhook.test.js
import request from "supertest";
import { app } from "../app.js";

const SECRET = "test-secret";
process.env.RISE_WEBHOOK_SECRET = SECRET;

it("rejects missing signature", async () => {
  const r = await request(app)
    .post("/upadte-user")
    .set("content-type", "application/json")
    .send(JSON.stringify({ email: "x@x.com", price: 100 }));
  expect(r.status).toBe(400);
});

it("rejects stale timestamp", async () => {
  const body = JSON.stringify({});
  const ts = Math.floor(Date.now() / 1000) - 600;
  const sig = require("crypto")
    .createHmac("sha256", SECRET)
    .update(`${ts}.${body}`)
    .digest("hex");
  const r = await request(app)
    .post("/upadte-user")
    .set("content-type", "application/json")
    .set("x-rise-signature", `t=${ts},v1=${sig}`)
    .send(body);
  expect(r.status).toBe(400);
});

it("rejects bad signature", async () => {
  const ts = Math.floor(Date.now() / 1000);
  const r = await request(app)
    .post("/upadte-user")
    .set("content-type", "application/json")
    .set("x-rise-signature", `t=${ts},v1=${"a".repeat(64)}`)
    .send("{}");
  expect(r.status).toBe(401);
});
```

### 9.2 Local unit test — happy path

```js
it("accepts valid signature and creates order", async () => {
  const payload = {
    email: "alice@example.com",
    price: 1900,
    currency: "usd",
    productId: "p1",
    productTitle: "Hook Library 2026",
    orderId: "ord_test_001",
    timestamp: Math.floor(Date.now() / 1000),
  };
  const body = JSON.stringify(payload);
  const sig = require("crypto")
    .createHmac("sha256", SECRET)
    .update(`${payload.timestamp}.${body}`)
    .digest("hex");

  const r = await request(app)
    .post("/upadte-user")
    .set("content-type", "application/json")
    .set("x-rise-signature", `t=${payload.timestamp},v1=${sig}`)
    .send(body);
  expect(r.status).toBe(200);
  expect(r.body.ok).toBe(true);

  // second call must be idempotent
  const r2 = await request(app)
    .post("/upadte-user")
    .set("content-type", "application/json")
    .set("x-rise-signature", `t=${payload.timestamp},v1=${sig}`)
    .send(body);
  expect(r2.status).toBe(200);
});
```

### 9.3 Manual smoke test from curl

```bash
SECRET="<your shared secret>"
TS=$(date +%s)
BODY='{"email":"smoke@example.com","price":100,"currency":"usd","productId":"p1","productTitle":"t","orderId":"ord_smoke_'$RANDOM'","timestamp":'$TS'}'
SIG=$(printf "%s.%s" "$TS" "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -hex | awk '{print $2}')

curl -i -X POST https://www.elyosoft.online/upadte-user \
  -H "content-type: application/json" \
  -H "x-rise-signature: t=$TS,v1=$SIG" \
  -d "$BODY"
```

Expected: `HTTP/1.1 200 OK`, body `{"ok":true}`. Repeat the same command — still `200`.

### 9.4 End-to-end with real Rise

1. Open `https://<rise-domain>/products/<any-slug>?u=<real-elyosoft-user-email>`.
2. Buy with Stripe test card `4242 4242 4242 4242`.
3. Watch Elyosoft logs — one `POST /upadte-user 200` line.
4. Confirm `rise_orders` row exists.
5. Confirm the user's entitlement/credits/plan actually changed.

---

## 10. Security checklist

- [ ] `RISE_WEBHOOK_SECRET` set in production env, never committed.
- [ ] Raw body is captured before any JSON middleware.
- [ ] `hmac.compare_digest` / `crypto.timingSafeEqual` used (constant time).
- [ ] Timestamp window enforced (±300 seconds).
- [ ] `order_id` is PRIMARY KEY (idempotency).
- [ ] Endpoint is HTTPS only.
- [ ] Returns 2xx within 10 seconds.
- [ ] Signature failures logged with client IP for monitoring.
- [ ] No PII or secrets in error responses.
- [ ] Email comparison is case-insensitive when looking up users.

---

## 11. Out of scope

You do **not** need to:

- Build admin UI for `rise_orders` — that lives on Rise.
- Send any email — Rise sends the download link.
- Talk to Stripe directly — Rise owns the Stripe integration.
- Implement retries — Rise's current behavior is fire-and-log. If a delivery is missed, the operator triggers a replay manually.

## 12. Deliverables

When you finish, produce:

1. The endpoint route file.
2. The `handleRiseOrder` service file.
3. The DB migration creating `rise_orders`.
4. A `RISE_PRODUCT_MAP` constant filled with the real productId → entitlement mappings (if Elyosoft has an entitlement model). Leave a `TODO` if not.
5. Tests covering the 4 signature paths + happy path + idempotency.
6. A one-paragraph note in the Elyosoft README explaining how to set `RISE_WEBHOOK_SECRET` and where the endpoint lives.

That's everything. Match the contract in Section 2 byte-for-byte and Rise will Just Work.
