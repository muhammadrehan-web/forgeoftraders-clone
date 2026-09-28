import nodemailer from "nodemailer";
import { site } from "@/lib/site";

function gmailUser() {
  return String(process.env.GMAIL_USER || "").trim();
}

function gmailPass() {
  return String(process.env.GMAIL_APP_PASSWORD || "").replace(/\s/g, "");
}

export function hasMailer() {
  return Boolean(gmailUser() && gmailPass());
}

function siteOrigin() {
  return String(process.env.NEXT_PUBLIC_SITE_URL || "https://forgeoftraders-clone.vercel.app").replace(/\/$/, "");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function transporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: gmailUser(),
      pass: gmailPass(),
    },
  });
}

export async function sendWelcomeEmail(input: { firstName: string; email: string }) {
  if (!hasMailer()) {
    console.warn("Gmail is not configured; skipped welcome email.");
    return { sent: false as const, skipped: true as const };
  }

  const firstName = input.firstName.trim() || "trader";
  const origin = siteOrigin();
  const login = `${origin}/sign-in`;
  const safeName = escapeHtml(firstName);

  await transporter().sendMail({
    from: `"${site.name}" <${gmailUser()}>`,
    to: input.email,
    subject: `Welcome to ${site.name}`,
    text: [
      `Hi ${firstName},`,
      "",
      `Your ${site.name} account is ready.`,
      `Sign in here: ${login}`,
      "",
      "Use the email and password you just created.",
    ].join("\n"),
    html: `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#0c1011;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0c1011;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#121618;border:1px solid #2a2a2a;border-radius:12px;">
            <tr>
              <td style="padding:32px 28px;">
                <p style="margin:0;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#c29635;">Forge of Traders</p>
                <h1 style="margin:14px 0 0;font-size:26px;line-height:1.3;font-weight:600;color:#ffffff;">Welcome, ${safeName}.</h1>
                <p style="margin:16px 0 0;font-size:15px;line-height:1.6;color:#c8c8c8;">Your account is ready. Sign in with the email and password you just created.</p>
                <p style="margin:24px 0 0;">
                  <a href="${login}" style="display:inline-block;background:#c29635;color:#000000;text-decoration:none;font-size:15px;font-weight:700;padding:12px 22px;border-radius:8px;">Sign in</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  });

  return { sent: true as const, skipped: false as const };
}

export async function sendPasswordResetEmail(input: { firstName: string; email: string; token: string }) {
  if (!hasMailer()) {
    throw new Error("Gmail is not configured");
  }

  const firstName = input.firstName.trim() || "trader";
  const origin = siteOrigin();
  const reset = `${origin}/reset-password?token=${encodeURIComponent(input.token)}`;
  const safeName = escapeHtml(firstName);

  await transporter().sendMail({
    from: `"${site.name}" <${gmailUser()}>`,
    to: input.email,
    subject: `Reset your ${site.name} password`,
    text: [
      `Hi ${firstName},`,
      "",
      "Your old password has been cleared.",
      `Choose a new one here: ${reset}`,
      "",
      "This link expires in one hour.",
    ].join("\n"),
    html: `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#0c1011;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0c1011;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#121618;border:1px solid #2a2a2a;border-radius:12px;">
            <tr>
              <td style="padding:32px 28px;">
                <p style="margin:0;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#c29635;">Forge of Traders</p>
                <h1 style="margin:14px 0 0;font-size:26px;line-height:1.3;font-weight:600;color:#ffffff;">Reset your password, ${safeName}.</h1>
                <p style="margin:16px 0 0;font-size:15px;line-height:1.6;color:#c8c8c8;">Your old password no longer works. Choose a new one with the button below. This link expires in one hour.</p>
                <p style="margin:24px 0 0;">
                  <a href="${reset}" style="display:inline-block;background:#c29635;color:#000000;text-decoration:none;font-size:15px;font-weight:700;padding:12px 22px;border-radius:8px;">Choose a new password</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  });
}
