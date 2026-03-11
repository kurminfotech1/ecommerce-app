import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────
// POST  /api/userAuth/verify-otp
// Body: { email: string; otp: string }
//
// Verifies the 6-digit OTP against our OtpVerification DB table.
// On success:
//   - Deletes the OTP record (one-time use)
//   - Marks the User as is_verified = true
// No Supabase dependency — fully self-contained.
// ─────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: "Email and OTP are required" },
        { status: 400 }
      );
    }

    // Look up the stored OTP record
    const record = await prisma.otpVerification.findUnique({
      where: { email },
    });

    // No record found
    if (!record) {
      return NextResponse.json(
        { success: false, message: "No OTP found for this email. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if OTP has expired
    if (new Date() > record.expires_at) {
      // Delete expired record to keep DB clean
      await prisma.otpVerification.delete({ where: { email } });
      return NextResponse.json(
        { success: false, message: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if OTP matches
    if (record.otp !== otp.trim()) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP. Please check and try again." },
        { status: 400 }
      );
    }

    // ✅ OTP is valid — delete it (one-time use) and verify the user
    await prisma.$transaction([
      prisma.otpVerification.delete({ where: { email } }),
      prisma.user.updateMany({
        where: { email },
        data: { is_verified: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Email verified successfully! You can now log in.",
    });
  } catch (error: any) {
    console.error("VERIFY OTP ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
