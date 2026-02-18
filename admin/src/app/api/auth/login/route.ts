import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // ✅ Required field validation
    if (!email && !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Password is required." },
        { status: 400 }
      );
    }

    // ✅ Check admin exists
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Email is incorrect!" },
        { status: 401 }
      );
    }

    // ✅ Compare password
    const isPasswordValid = await bcrypt.compare(
      password,
      admin.password!
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Password is incorrect!" },
        { status: 401 }
      );
    }

    // ✅ Generate JWT
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    // ✅ Success response
    return NextResponse.json(
      {
        message: "Login successful",
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          full_name: admin.full_name,
          role: admin.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { error: "Login Failed" },
      { status: 500 }
    );
  }
}
