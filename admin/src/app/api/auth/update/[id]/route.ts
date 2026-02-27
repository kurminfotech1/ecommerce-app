import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
context : { params: Promise<{ id: string }> }
) {
    
  try {
    const user =await verifyToken();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    const body = await req.json();
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Admin id required" },
        { status: 400 }
      );
    }

    const admin = await prisma.admin.update({
      where: { id },
      data: {
        email: body.email,
        full_name: body.full_name,
        phone: body.phone ?? null,
        country: body.country ?? null,
        state: body.state ?? null,
        city: body.city ?? null,
        postal_code: body.postal_code ?? null,
      },
    });

    return NextResponse.json(
      { admin, success: "Admin updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to update admin" },
      { status: 500 }
    );
  }
}
