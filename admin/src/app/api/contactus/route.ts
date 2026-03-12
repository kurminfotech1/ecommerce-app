import { NextResponse } from "next/server";
import { sendContactConfirmationEmail, sendContactAdminNotificationEmail } from "@/lib/mailer";

// ─────────────────────────────────────────────────────────────────
// POST  /api/contactus
// Body: { fullName, email, phone, message }
//
// 1. Validates all required fields
// 2. Sends a branded confirmation email to the user
// 3. Sends a full inquiry notification email to the admin
// ─────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, email, phone, message } = body;

    // ── Validation ──────────────────────────────────────────────
    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: "Full name must be at least 2 characters." },
        { status: 400 }
      );
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "A valid email address is required." },
        { status: 400 }
      );
    }

    if (!phone || !/^[\d\s\+\-\(\)]{7,15}$/.test(phone.trim())) {
      return NextResponse.json(
        { success: false, message: "A valid phone number is required." },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || message.trim().length < 10) {
      return NextResponse.json(
        { success: false, message: "Message must be at least 10 characters." },
        { status: 400 }
      );
    }

    const contactData = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      message: message.trim(),
      submittedAt: new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "long",
        timeStyle: "short",
      }),
    };

    // ── Send both emails concurrently ────────────────────────────
    const adminEmail = process.env.SMTP_USER!;

    await Promise.all([
      sendContactConfirmationEmail(contactData),
      sendContactAdminNotificationEmail(adminEmail, contactData),
    ]);

    return NextResponse.json({
      success: true,
      message: "Your message has been sent! We'll get back to you shortly.",
    });
  } catch (error: any) {
    console.error("CONTACT US ERROR:", error?.message ?? error);
    return NextResponse.json(
      { success: false, message: "Failed to send your message. Please try again." },
      { status: 500 }
    );
  }
}
