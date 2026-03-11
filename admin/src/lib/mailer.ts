import nodemailer from "nodemailer";

// ─────────────────────────────────────────────────────────────────
// Nodemailer Transporter
// Configure via .env.local:
//   SMTP_HOST=smtp.gmail.com
//   SMTP_PORT=587
//   SMTP_USER=your@gmail.com
//   SMTP_PASS=your-app-password        ← Gmail App Password (not account password)
//   SMTP_FROM="Avshdh Organics <your@gmail.com>"
// ─────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ─────────────────────────────────────────────────────────────────
// Generic send function — use this for any email across the app
// ─────────────────────────────────────────────────────────────────
interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: SendMailOptions) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"Avshdh Organics" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

// ─────────────────────────────────────────────────────────────────
// Shared HTML wrapper — wraps any inner content with the branded
// header (logo) and footer. Keeps all email templates consistent.
// ─────────────────────────────────────────────────────────────────
export function emailWrapper(innerHtml: string): string {
  const year = new Date().getFullYear();
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Avshdh Organics</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7f4;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7f4;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:580px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- ── Header / Branded Text ── -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a5c1a 0%,#2d8a2d 100%);padding:28px 32px;text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:28px; font-weight:800; letter-spacing:1px; text-transform:uppercase;">
                Avshdh Organics
              </h1>
            </td>
          </tr>

          <!-- ── Body content injected here ── -->
          <tr>
            <td style="padding:36px 40px;">
              ${innerHtml}
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="background:#f9fdf9;border-top:1px solid #e8f0e8;padding:20px 32px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#6b7c6b;">
                You're receiving this email because you signed up at Avshdh Organics.
              </p>
              <p style="margin:0;font-size:12px;color:#8a9e8a;">
                &copy; ${year} <strong style="color:#2d6b2d;">Avshdh Organics</strong>. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────
// OTP Email
// Usage: sendOtpEmail("user@example.com", "482931")
// ─────────────────────────────────────────────────────────────────
export async function sendOtpEmail(to: string, otp: string) {
  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#1a3d1a;font-weight:700;">
      Verify Your Email Address
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:#4a5c4a;line-height:1.6;">
      Thank you for choosing <strong style="color:#2d6b2d;">Avshdh Organics</strong>!
      Please use the verification code below to complete your registration.
    </p>

    <!-- OTP Code Box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr>
        <td align="center">
          <div style="
            display:inline-block;
            background:linear-gradient(135deg,#f0f9f0 0%,#e8f5e8 100%);
            border:2px dashed #2d8a2d;
            border-radius:12px;
            padding:20px 40px;
            text-align:center;
          ">
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;color:#6b8a6b;text-transform:uppercase;font-weight:600;">
              Your Verification Code
            </p>
            <p style="
              margin:0;
              font-size:42px;
              font-weight:800;
              letter-spacing:12px;
              color:#1a5c1a;
              font-family:'Courier New',monospace;
            ">
              ${otp}
            </p>
          </div>
        </td>
      </tr>
    </table>

    <!-- Timer Warning -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:#fff8e1;border-left:4px solid #f59e0b;border-radius:4px;padding:12px 16px;">
          <p style="margin:0;font-size:13px;color:#92400e;">
            ⏱️ This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:14px;color:#6b7c6b;line-height:1.6;">
      If you didn't create an account with Avshdh Organics, you can safely ignore this email.
    </p>
    <p style="margin:0;font-size:14px;color:#6b7c6b;line-height:1.6;">
      Warm regards,<br/>
      <strong style="color:#2d6b2d;">The Avshdh Organics Team</strong> 🌿
    </p>
  `);

  await sendMail({
    to,
    subject: "Your Verification Code – Avshdh Organics",
    html,
  });
}

// ─────────────────────────────────────────────────────────────────
// Password Reset Email  (ready to use when needed)
// Usage: sendPasswordResetEmail("user@example.com", "https://...")
// ─────────────────────────────────────────────────────────────────
export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#1a3d1a;font-weight:700;">
      Reset Your Password
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:#4a5c4a;line-height:1.6;">
      We received a request to reset your password for your
      <strong style="color:#2d6b2d;">Avshdh Organics</strong> account.
      Click the button below to set a new password.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr>
        <td align="center">
          <a href="${resetLink}" style="
            display:inline-block;
            background:linear-gradient(135deg,#1a5c1a,#2d8a2d);
            color:#ffffff;
            padding:14px 36px;
            border-radius:8px;
            font-size:15px;
            font-weight:600;
            text-decoration:none;
            letter-spacing:0.5px;
          ">
            Reset Password
          </a>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:#fff8e1;border-left:4px solid #f59e0b;border-radius:4px;padding:12px 16px;">
          <p style="margin:0;font-size:13px;color:#92400e;">
            ⏱️ This link expires in <strong>30 minutes</strong>. If you didn't request a password reset, please ignore this email.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:14px;color:#6b7c6b;line-height:1.6;">
      Warm regards,<br/>
      <strong style="color:#2d6b2d;">The Avshdh Organics Team</strong> 🌿
    </p>
  `);

  await sendMail({
    to,
    subject: "Reset Your Password – Avshdh Organics",
    html,
  });
}

// ─────────────────────────────────────────────────────────────────
// Order Confirmation Email  (ready to use when needed)
// Usage: sendOrderConfirmationEmail("user@example.com", { orderNumber, items, total })
// ─────────────────────────────────────────────────────────────────
export async function sendOrderConfirmationEmail(
  to: string,
  order: { orderNumber: string; total: number; name: string }
) {
  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#1a3d1a;font-weight:700;">
      Order Confirmed! 🎉
    </h2>
    <p style="margin:0 0 16px;font-size:15px;color:#4a5c4a;line-height:1.6;">
      Hi <strong>${order.name}</strong>, thank you for your order from
      <strong style="color:#2d6b2d;">Avshdh Organics</strong>!
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9f0;border-radius:8px;padding:16px;margin:0 0 24px;">
      <tr>
        <td style="padding:6px 0;font-size:14px;color:#4a5c4a;">Order Number</td>
        <td style="padding:6px 0;font-size:14px;color:#1a3d1a;font-weight:700;text-align:right;">#${order.orderNumber}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:14px;color:#4a5c4a;">Total Amount</td>
        <td style="padding:6px 0;font-size:14px;color:#1a3d1a;font-weight:700;text-align:right;">₹${order.total.toFixed(2)}</td>
      </tr>
    </table>
    <p style="margin:0;font-size:14px;color:#6b7c6b;line-height:1.6;">
      We'll notify you once your order is shipped. Thank you for choosing us!<br/><br/>
      Warm regards,<br/>
      <strong style="color:#2d6b2d;">The Avshdh Organics Team</strong> 🌿
    </p>
  `);

  await sendMail({
    to,
    subject: `Order Confirmed #${order.orderNumber} – Avshdh Organics`,
    html,
  });
}
