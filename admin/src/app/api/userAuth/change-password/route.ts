import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const valid = await bcrypt.compare(body.password, user.password);

    if (!valid) {
      return NextResponse.json(
        { error: "Old password incorrect" },
        { status: 401 }
      );
    }

    const newHash = await bcrypt.hash(body.newPassword, 10);

    await prisma.user.update({
      where: { email: body.email },
      data: { password: newHash },
    });

    return NextResponse.json({
      message: "Password updated successfully",
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}
