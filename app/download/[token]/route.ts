import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { signedDownloadUrl } from "@/lib/storage";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;

  const order = await prisma.order.findUnique({
    where: { downloadToken: token },
    include: { product: true },
  });

  if (!order) {
    return errorPage("This download link is invalid.", 404);
  }
  if (order.paymentStatus !== "paid") {
    return errorPage("This order is not marked as paid yet.", 403);
  }
  if (order.downloadExpiresAt.getTime() < Date.now()) {
    return errorPage(
      `This link expired. Please contact ${env.supportEmail}.`,
      410,
    );
  }
  if (order.downloadCount >= env.downloadMaxCount) {
    return errorPage(
      `Download limit reached. Please contact ${env.supportEmail}.`,
      429,
    );
  }
  if (!order.product.digitalFilePath) {
    return errorPage("This product has no file attached.", 500);
  }

  let signedUrl: string;
  try {
    signedUrl = await signedDownloadUrl(order.product.digitalFilePath, 60);
  } catch {
    return errorPage("Could not prepare your file. Try again shortly.", 500);
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { downloadCount: { increment: 1 } },
  });

  return NextResponse.redirect(signedUrl, 302);
}

function errorPage(message: string, status: number) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Download error</title>
<style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#fbfaf7;color:#0a0a0a;display:grid;place-items:center;min-height:100vh;margin:0}
.card{max-width:420px;background:#fff;border:1px solid #e7e5e0;border-radius:16px;padding:32px;text-align:center}
h1{margin:0 0 8px;font-size:22px}p{color:#6b6b6b;margin:0 0 16px}a{color:#0a0a0a}</style>
</head><body><div class="card"><h1>Download error</h1><p>${escapeHtml(message)}</p><a href="/">Back to store</a></div></body></html>`;
  return new NextResponse(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
