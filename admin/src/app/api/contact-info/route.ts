import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { checkApiPermission } from "@/lib/utils/apiPermission";

const MODULE = "Contact Info";

export async function GET() {
  try {
    const info = await prisma.contactInfo.findUnique({
      where: { id: "contact-info" }
    });
    return NextResponse.json({ data: info || null });
  } catch (error) {
    console.error("GET CONTACT INFO ERROR:", error);
    return NextResponse.json({ data: null });
  }
}

export async function PUT(req: Request) {
  try {
    const { error } = await checkApiPermission(MODULE, "canUpdate");
    if (error) return error;

    const body = await req.json();
    const info = await prisma.contactInfo.upsert({
      where: { id: "contact-info" },
      update: {
        email: body.email ?? null,
        phone: body.phone ?? null,
        address: body.address ?? null,
      },
      create: {
        id: "contact-info",
        email: body.email ?? null,
        phone: body.phone ?? null,
        address: body.address ?? null,
      }
    });

    return NextResponse.json({ info, message: "Contact info updated successfully" });
  } catch (error) {
    console.error("UPDATE CONTACT INFO ERROR:", error);
    return NextResponse.json({ error: "Failed to update contact info" }, { status: 500 });
  }
}
