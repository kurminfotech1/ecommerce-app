import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { checkApiPermission } from "@/lib/utils/apiPermission";

const MODULE = "Announcement Bar";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";

    const where: any = {};
    if (status === "active") where.is_active = true;
    else if (status === "inactive") where.is_active = false;

    // Default values if DB is not ready
    let data: any[] = [];
    let settings: any = { is_enabled: true };

    try {
      data = await prisma.announcementBar.findMany({
        where,
        orderBy: { created_at: "desc" },
      });

      settings = await prisma.announcementSettings.findUnique({
        where: { id: "announcement-settings" },
      });

      if (!settings) {
        settings = await prisma.announcementSettings.create({
          data: { id: "announcement-settings", is_enabled: true },
        });
      }
    } catch (prismaError: any) {
      // If tables don't exist yet or connection fails, we log it but return "No data"
      console.warn("Announcement Bar API: Database error (likely tables missing)", prismaError.message);
      return NextResponse.json({ 
        data: [], 
        settings: { is_enabled: false }, 
        message: "No data" 
      });
    }

    if (data.length === 0) {
      return NextResponse.json({ data: [], settings, message: "No data" });
    }

    return NextResponse.json({ data, settings });
  } catch (error) {
    console.error("GET ANNOUNCEMENT BAR FATAL ERROR:", error);
    return NextResponse.json({ 
      data: [], 
      settings: { is_enabled: false }, 
      message: "No data" 
    });
  }
}

export async function POST(req: Request) {
  try {
    const { error } = await checkApiPermission(MODULE, "canCreate");
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const body = await req.json();

    if (type === "settings") {
      const settings = await prisma.announcementSettings.upsert({
        where: { id: "announcement-settings" },
        update: { is_enabled: body.is_enabled },
        create: { id: "announcement-settings", is_enabled: body.is_enabled },
      });
      return NextResponse.json({ settings, message: "Settings updated successfully" });
    }

    if (!body.text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const data = await prisma.announcementBar.create({
      data: {
        text: body.text,
        is_active: body.is_active ?? true,
      },
    });

    return NextResponse.json({ data, message: "Announcement bar created successfully" }, { status: 201 });
  } catch (error) {
    console.error("CREATE ANNOUNCEMENT BAR ERROR:", error);
    return NextResponse.json({ error: "Failed to create announcement bar" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { error } = await checkApiPermission(MODULE, "canUpdate");
    if (error) return error;

    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const body = await req.json();

    const data = await prisma.announcementBar.update({
      where: { id },
      data: {
        text: body.text,
        is_active: body.is_active,
      },
    });

    return NextResponse.json({ data, message: "Announcement bar updated successfully" });
  } catch (error) {
    console.error("UPDATE ANNOUNCEMENT BAR ERROR:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { error } = await checkApiPermission(MODULE, "canDelete");
    if (error) return error;

    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.announcementBar.delete({ where: { id } });

    return NextResponse.json({ message: "Announcement bar deleted successfully" });
  } catch (error) {
    console.error("DELETE ANNOUNCEMENT BAR ERROR:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
