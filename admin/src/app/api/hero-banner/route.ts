import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { checkApiPermission } from "@/lib/utils/apiPermission";

const MODULE = "Hero Banner";

export async function GET(req: Request) {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { sort_order: "asc" },
    });
    return NextResponse.json({
      data: banners,
      totalRecords: banners.length,
    });
  } catch (error) {
    console.error("GET BANNERS ERROR:", error);
    return NextResponse.json({
      data: [],
      totalRecords: 0,
    });
  }
}

export async function POST(req: Request) {
  try {
    const { error } = await checkApiPermission(MODULE, "canCreate");
    if (error) return error;

    const body = await req.json();
    if (!body.title) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    const banner = await prisma.banner.create({
      data: {
        badge_text: body.badge_text || null,
        title: body.title,
        description: body.description || null,
        cta_text: body.cta_text || null,
        cta_link: body.cta_link || null,
        background_image: body.background_image || null,
        is_active: body.is_active ?? true,
        sort_order: body.sort_order || 0,
      },
    });
    return NextResponse.json({ banner, message: "Banner created successfully" }, { status: 201 });
  } catch (error) {
    console.error("CREATE BANNER ERROR:", error);
    return NextResponse.json({ error: "Failed to create banner" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { error } = await checkApiPermission(MODULE, "canUpdate");
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const body = await req.json();
    const updated = await prisma.banner.update({
      where: { id },
      data: {
        badge_text: body.badge_text ?? null,
        title: body.title,
        description: body.description ?? null,
        cta_text: body.cta_text ?? null,
        cta_link: body.cta_link ?? null,
        background_image: body.background_image ?? null,
        is_active: body.is_active ?? true,
        sort_order: body.sort_order ?? 0,
      },
    });
    return NextResponse.json({ updated, message: "Banner updated successfully" });
  } catch (error) {
    console.error("UPDATE BANNER ERROR:", error);
    return NextResponse.json({ error: "Failed to update banner" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { error } = await checkApiPermission(MODULE, "canDelete");
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.banner.delete({ where: { id } });
    return NextResponse.json({ message: "Banner deleted successfully" });
  } catch (error) {
    console.error("DELETE BANNER ERROR:", error);
    return NextResponse.json({ error: "Failed to delete banner" }, { status: 500 });
  }
}
