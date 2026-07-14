import "server-only";

import { Resend } from "resend";

import { env } from "@/lib/env";

/**
 * Transactional email via Resend (SPEC §2, optional). Both senders are
 * best-effort and never throw: without RESEND_API_KEY they no-op, and any send
 * error is logged rather than propagated — email must never fail a webhook or
 * an upload. Note: Resend's default `onboarding@resend.dev` sender only delivers
 * to the account owner; set RESEND_FROM to a verified domain for real delivery.
 */
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

function shell(heading: string, bodyHtml: string, cta: { label: string; href: string }): string {
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f8fafc;padding:32px 0">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
      <div style="padding:28px 32px 8px">
        <div style="display:inline-block;background:#4f46e5;color:#fff;font-weight:700;font-size:14px;border-radius:8px;padding:6px 12px">InvoiceIQ</div>
      </div>
      <div style="padding:8px 32px 28px">
        <h1 style="margin:16px 0 12px;font-size:20px;font-weight:800;color:#0f172a;letter-spacing:-0.02em">${heading}</h1>
        <div style="font-size:14px;line-height:1.65;color:#475569">${bodyHtml}</div>
        <a href="${cta.href}" style="display:inline-block;margin-top:22px;background:#4f46e5;color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:10px;padding:11px 20px">${cta.label}</a>
      </div>
    </div>
    <p style="max-width:480px;margin:16px auto 0;font-size:12px;color:#94a3b8;text-align:center">You're receiving this because you have an InvoiceIQ account.</p>
  </div>`;
}

/** Sent when a user upgrades to Pro (checkout.session.completed). */
export async function sendWelcomeEmail(opts: { to: string; name: string | null }): Promise<void> {
  if (!resend || !opts.to) return;
  const greeting = opts.name ? `Hi ${opts.name},` : "Hi there,";
  try {
    await resend.emails.send({
      from: env.RESEND_FROM,
      to: opts.to,
      subject: "Welcome to InvoiceIQ Pro 🎉",
      html: shell(
        "You're on Pro now 🎉",
        `<p style="margin:0 0 12px">${greeting}</p>
         <p style="margin:0 0 12px">Thanks for upgrading. Your account now has <strong>unlimited invoice processing</strong>, spend analytics, CSV export and priority extraction.</p>
         <p style="margin:0">Drop in your next batch of invoices whenever you're ready.</p>`,
        { label: "Go to your dashboard", href: `${appUrl}/app` },
      ),
    });
  } catch (err) {
    console.error("sendWelcomeEmail failed:", err);
  }
}

/** Sent when a free user has one document left this month. */
export async function sendQuotaWarningEmail(opts: {
  to: string;
  name: string | null;
  used: number;
  limit: number;
}): Promise<void> {
  if (!resend || !opts.to) return;
  const greeting = opts.name ? `Hi ${opts.name},` : "Hi there,";
  const remaining = opts.limit - opts.used;
  try {
    await resend.emails.send({
      from: env.RESEND_FROM,
      to: opts.to,
      subject: `You've used ${opts.used} of ${opts.limit} free documents`,
      html: shell(
        `${remaining} free document${remaining === 1 ? "" : "s"} left this month`,
        `<p style="margin:0 0 12px">${greeting}</p>
         <p style="margin:0 0 12px">You've processed <strong>${opts.used} of your ${opts.limit}</strong> free documents this month. When you hit the limit, uploads pause until the 1st — or you can upgrade to <strong>Pro</strong> for unlimited processing.</p>
         <p style="margin:0">Pro is €9/month and you can cancel anytime.</p>`,
        { label: "Upgrade to Pro", href: `${appUrl}/pricing` },
      ),
    });
  } catch (err) {
    console.error("sendQuotaWarningEmail failed:", err);
  }
}
