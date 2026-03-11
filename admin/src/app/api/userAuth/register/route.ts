import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// ─────────────────────────────────────────────────────────────────
// POST  /api/userAuth/register
// Body: { full_name, email, password, phone }
//
// Only creates the user record (is_verified = false).
// OTP is sent separately via POST /api/userAuth/send-otp
// ─────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.full_name || !body.email || !body.password || !body.phone) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check for duplicate email before hashing (faster fail)
    const existing = await prisma.user.findUnique({
      where: { email: body.email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
      data: {
        full_name: body.full_name,
        email: body.email,
        password: hashedPassword,
        phone: body.phone,
        // is_verified: false  ← Prisma schema default
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        is_verified: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Registered successfully. Please verify your email.",
        user,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    console.error("REGISTER ERROR:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
