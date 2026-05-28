import { Resend } from "resend";
import { env } from "@/lib/env";

let cached: Resend | null = null;
function client() {
  if (cached) return cached;
  cached = new Resend(env.resendKey());
  return cached;
}

type Args = {
  to: string;
  customerName: string | null;
  productTitle: string;
  orderId: string;
  downloadUrl: string;
};

export async function sendProductEmail(a: Args) {
  const greeting = a.customerName ? `Hi ${a.customerName},` : "Hi,";
  const subject = "Your digital product is ready";

  const html = `<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#fbfaf7;padding:32px 0;color:#0a0a0a">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e7e5e0;border-radius:16px;overflow:hidden">
    <tr><td style="padding:32px 32px 0 32px">
      <h1 style="margin:0 0 8px 0;font-size:22px">Your purchase is ready</h1>
      <p style="margin:0;color:#6b6b6b">${greeting}</p>
      <p style="margin:16px 0 0 0">Thank you for buying <strong>${escapeHtml(a.productTitle)}</strong>. Use the secure link below to download your file.</p>
    </td></tr>
    <tr><td style="padding:24px 32px">
      <a href="${a.downloadUrl}" style="display:inline-block;background:#0a0a0a;color:#fff;padding:14px 22px;border-radius:9999px;text-decoration:none;font-weight:500">Download your product</a>
      <p style="margin:16px 0 0 0;color:#6b6b6b;font-size:13px">Or copy this link:<br><span style="word-break:break-all">${a.downloadUrl}</span></p>
    </td></tr>
    <tr><td style="padding:0 32px 24px 32px;color:#6b6b6b;font-size:13px">
      <p>Order ID: <span style="font-family:ui-monospace,monospace">${a.orderId}</span></p>
      <p>The link expires in ${env.downloadExpiryDays} days and is limited to ${env.downloadMaxCount} downloads.</p>
      <p>Need help? Email <a href="mailto:${env.supportEmail}" style="color:#0a0a0a">${env.supportEmail}</a>.</p>
    </td></tr>
  </table>
</body></html>`;

  const text =
    `${greeting}\n\nThank you for buying ${a.productTitle}.\n\n` +
    `Download: ${a.downloadUrl}\n\n` +
    `Order ID: ${a.orderId}\nExpires in ${env.downloadExpiryDays} days, ${env.downloadMaxCount} downloads.\n\n` +
    `Support: ${env.supportEmail}\n`;

  await client().emails.send({
    from: env.resendFrom(),
    to: a.to,
    subject,
    html,
    text,
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
