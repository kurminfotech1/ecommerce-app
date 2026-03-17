import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendOtpEmail } from "@/lib/mailer";

const OTP_EXPIRY_MINUTES = 10;

// ─────────────────────────────────────────────────────────────────
// POST  /api/userAuth/send-otp
// Body: { email: string }
//
// 1. Generates a cryptographically random 6-digit OTP
// 2. Upserts it into OtpVerification (one active OTP per email)
// 3. Sends it via Nodemailer with a branded HTML template
// ─────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "A valid email is required" },
        { status: 400 }
      );
    }

    // Generate a secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Upsert: one active OTP per email at a time (replaces previous)
    await prisma.otpVerification.upsert({
      where: { email },
      update: { otp, expires_at: expiresAt },
      create: { email, otp, expires_at: expiresAt },
    });

    // Send the branded OTP email via Nodemailer
    await sendOtpEmail(email, otp);

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${email}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    });
  } catch (error: any) {
    console.error("SEND OTP ERROR 상세:", error);
    if (error.code) console.error("ERROR CODE:", error.code);
    if (error.message) console.error("ERROR MESSAGE:", error.message);
    
    return NextResponse.json(
      { success: false, message: "Failed to send OTP. Please try again." },
      { status: 500 }
    );
  }
}
