import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
  try {
    // 1. Verify the JWT from cookie
    const user = await verifyToken();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse body
    const body = await req.json();
    const { email, password: oldPassword, newPassword } = body;

    if (!email || !oldPassword || !newPassword) {
      return NextResponse.json(
        { message: "Email, current password, and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // 3. Find admin by email
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin || !admin.password) {
      return NextResponse.json(
        { message: "Admin not found" },
        { status: 404 }
      );
    }

    // 4. Confirm the JWT user matches the target email (security check)
    if (admin.id !== user.id) {
      return NextResponse.json(
        { message: "You can only change your own password" },
        { status: 403 }
      );
    }

    // 5. Verify current password
    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // 6. Make sure new password isn't the same as the old one
    const isSame = await bcrypt.compare(newPassword, admin.password);
    if (isSame) {
      return NextResponse.json(
        { message: "New password must be different from current password" },
        { status: 400 }
      );
    }

    // 7. Hash and save
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.admin.update({
      where: { id: admin.id },
      data: { password: hashed },
    });

    return NextResponse.json(
      { message: "Password changed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("CHANGE_PASSWORD_ERROR", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
