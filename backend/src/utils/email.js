import sgMail from "@sendgrid/mail";
import { env } from "../config/env.js";

function formatRupeesFromPaise(paise) {
  const rupees = Number(paise ?? 0) / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(rupees);
}

function formatDateTime(value) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return String(value ?? "");
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function baseTemplate({ title, subtitle, accent = "#a78bfa", contentHtml }) {
  return `
  <div style="margin:0;padding:0;background:#080808;color:#e5e7eb;font-family:'Helvetica Neue',Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

      <!-- Header eyebrow -->
      <div style="margin-bottom:24px;padding:0 4px;">
        <div style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.28);">Visual Verse Store</div>
      </div>

      <!-- Card -->
      <div style="border:1px solid rgba(255,255,255,0.08);border-radius:18px;overflow:hidden;background:rgba(255,255,255,0.025);">

        <!-- Card header -->
        <div style="padding:28px 28px 24px;border-bottom:1px solid rgba(255,255,255,0.07);">
          <div style="display:inline-block;height:3px;width:36px;background:${accent};border-radius:999px;margin-bottom:16px;"></div>
          <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;line-height:1.2;">${escapeHtml(title)}</div>
          ${subtitle ? `<div style="margin-top:6px;font-size:13px;color:rgba(255,255,255,0.45);letter-spacing:0.01em;">${escapeHtml(subtitle)}</div>` : ""}
        </div>

        <!-- Card body -->
        <div style="padding:28px;">
          ${contentHtml}
        </div>

        <!-- Card footer -->
        <div style="padding:16px 28px;border-top:1px solid rgba(255,255,255,0.07);font-size:12px;color:rgba(255,255,255,0.30);">
          Need help? <a href="mailto:${escapeHtml(env.SUPPORT_EMAIL || "support@example.com")}" style="color:rgba(255,255,255,0.55);text-decoration:underline;">${escapeHtml(env.SUPPORT_EMAIL || "support@example.com")}</a>
        </div>
      </div>

      <!-- Bottom note -->
      <div style="padding:16px 4px 0;font-size:11px;color:rgba(255,255,255,0.22);line-height:1.6;">
        This is an automated message. If you did not initiate this purchase, please contact support immediately.
      </div>

    </div>
  </div>`;
}

function statBlock(items) {
  // items: [{ label, value }]
  const cells = items
    .map(
      ({ label, value }) => `
      <td style="padding:0 24px 0 0;vertical-align:top;white-space:nowrap;">
        <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.35);">${escapeHtml(label)}</div>
        <div style="margin-top:6px;font-size:14px;font-weight:600;color:#ffffff;">${escapeHtml(value)}</div>
      </td>`
    )
    .join("");

  return `
    <div style="border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px 20px;background:rgba(255,255,255,0.02);">
      <table style="border-collapse:collapse;"><tr>${cells}</tr></table>
    </div>`;
}

function ctaButton(label, href, accent = "#ffffff") {
  const isWhite = accent === "#ffffff";
  return `
    <a href="${escapeHtml(href)}"
       style="display:inline-block;padding:11px 20px;border-radius:10px;background:${accent};color:${isWhite ? "#0a0a0a" : "#fff"};text-decoration:none;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;">
      ${escapeHtml(label)}
    </a>`;
}

export async function sendEmail({ to, subject, text, html }) {
  if (!env.SENDGRID_API_KEY) throw new Error("Missing SENDGRID_API_KEY");
  if (!env.EMAIL_FROM) throw new Error("Missing EMAIL_FROM");

  sgMail.setApiKey(env.SENDGRID_API_KEY);

  const listUnsubscribe = env.SUPPORT_EMAIL
    ? `<mailto:${env.SUPPORT_EMAIL}>; rel="unsubscribe", <${env.APP_URL || ""}/unsubscribe>`
    : undefined;

  await sgMail.send({
    to,
    from: env.EMAIL_FROM,
    replyTo: env.SUPPORT_EMAIL || env.EMAIL_FROM,
    subject,
    text,
    html,
    headers: listUnsubscribe ? { "List-Unsubscribe": listUnsubscribe } : undefined,
    trackingSettings: {
      clickTracking: { enable: false, enable_text: false },
      openTracking: { enable: true },
    },
  });
}

export const emailTemplates = {
  orderPaidCustomer({ order, user, products }) {
    const subject = `✅ Payment Confirmed — Order ${String(order._id).slice(-8)}`;

    const itemsHtml = (products ?? [])
      .map((p) => {
        const qty = String(p.__qty ?? 1);
        const downloadPath = `${env.APP_URL || ""}/downloads`;
        return `
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);vertical-align:top;">
              <div style="font-size:14px;font-weight:600;color:#ffffff;">${escapeHtml(p.title)}</div>
              <div style="margin-top:3px;font-size:12px;color:rgba(255,255,255,0.35);">Qty: ${escapeHtml(qty)}</div>
            </td>
            <td style="padding:12px 0 12px 16px;border-bottom:1px solid rgba(255,255,255,0.06);vertical-align:middle;text-align:right;">
              <a href="${escapeHtml(downloadPath)}" style="font-size:12px;color:#a5b4fc;text-decoration:underline;white-space:nowrap;">Download →</a>
            </td>
          </tr>`;
      })
      .join("");

    const contentHtml = `
      <p style="margin:0 0 22px;font-size:14px;line-height:1.75;color:rgba(255,255,255,0.65);">
        Hi ${escapeHtml(user?.fullName || user?.username || "there")} — your payment went through and your files are ready.
      </p>

      ${statBlock([
        { label: "Order ID", value: `#${String(order._id).slice(-8)}` },
        { label: "Total", value: formatRupeesFromPaise(order.totalAmount) },
        { label: "Paid At", value: formatDateTime(order.updatedAt || order.paidAt || new Date()) },
      ])}

      <div style="margin-top:24px;">
        <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:4px;">Items</div>
        <table style="width:100%;border-collapse:collapse;">
          ${itemsHtml || `<tr><td style="padding:12px 0;font-size:14px;color:rgba(255,255,255,0.65);">Your items are ready.</td></tr>`}
        </table>
      </div>

      <div style="margin-top:24px;padding:14px 16px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);font-size:13px;color:rgba(255,255,255,0.45);line-height:1.6;">
        You must be signed in to access your downloads. Click the button below and sign in when prompted.
      </div>

      <div style="margin-top:20px;">
        ${ctaButton("View Downloads", `${env.APP_URL || ""}/downloads`)}
      </div>
    `;

    const html = baseTemplate({
      title: "Payment Confirmed",
      subtitle: "Your digital assets are ready to download",
      accent: "#4ade80",
      contentHtml,
    });

    const text = `Payment confirmed.\nOrder: ${order._id}\nTotal: ${formatRupeesFromPaise(order.totalAmount)}\nDownloads: ${env.APP_URL || ""}/downloads`;

    return { subject, text, html };
  },

  orderPaidAdmin({ order, user }) {
    const subject = `🔔 New Paid Order — ${String(order._id).slice(-8)}`;

    const contentHtml = `
      <p style="margin:0 0 22px;font-size:14px;line-height:1.75;color:rgba(255,255,255,0.65);">
        A new order has been paid. Here's a summary.
      </p>

      ${statBlock([
        { label: "Order ID", value: `#${String(order._id).slice(-8)}` },
        { label: "Total", value: formatRupeesFromPaise(order.totalAmount) },
      ])}

      <div style="margin-top:20px;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px 20px;background:rgba(255,255,255,0.02);">
        <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:10px;">Customer</div>
        <div style="font-size:14px;font-weight:600;color:#ffffff;">${escapeHtml(user?.fullName || user?.username || "—")}</div>
        <div style="margin-top:4px;font-size:13px;color:rgba(255,255,255,0.40);">${escapeHtml(user?.email || "—")}</div>
      </div>

      <div style="margin-top:24px;">
        ${ctaButton("Open Admin", `${env.APP_URL || ""}/admin/analytics`)}
      </div>
    `;

    const html = baseTemplate({
      title: "New Paid Order",
      subtitle: "Admin notification",
      accent: "#60a5fa",
      contentHtml,
    });

    return { subject, text, html };
  },

  passwordReset({ resetUrl, user }) {
    const subject = `🔒 Reset Your Password`;

    const contentHtml = `
      <p style="margin:0 0 22px;font-size:14px;line-height:1.75;color:rgba(255,255,255,0.65);">
        Hi ${escapeHtml(user?.fullName || user?.username || "there")},<br><br>
        You recently requested to reset your password for your Visual Verse Store account. Click the button below to set a new password. This link will expire in 1 hour.
      </p>

      <div style="margin-top:24px;">
        ${ctaButton("Reset Password", resetUrl, "#facc15")}
      </div>
      
      <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.45);">
        If you did not request a password reset, you can safely ignore this email.
      </p>
    `;

    const html = baseTemplate({
      title: "Password Reset Request",
      subtitle: "Secure your account",
      accent: "#facc15",
      contentHtml,
    });

    const text = `You requested a password reset.\nReset your password here: ${resetUrl}\nIf you didn't request this, ignore this email.`;

    return { subject, text, html };
  },
};