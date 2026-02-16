import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const id = new URL(req.url).searchParams.get("id");
  
    // GET single
    if (id) {
      const category = await prisma.categories.findUnique({
        where: { id: Number(id) },
      });
  
      return NextResponse.json(category);
    }
  
    // GET all
    const categories = await prisma.categories.findMany();
    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET ERROR:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
  
     const category = await prisma.categories.create({
      data: {
        category_name: body.category_name,
        slug: body.slug,
        is_active: body.is_active ?? true,
        category_level: 1,
        parent_category_id: null,
      },
    });
  
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("POST ERROR:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    const body = await req.json();
  
    const updated = await prisma.categories.update({
      where: { id: Number(id) },
      data: body,
    });
  
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT ERROR:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
 try {
    const id = new URL(req.url).searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }
  
    await prisma.categories.delete({
      where: { id: Number(id) },
    });
  
    return NextResponse.json({ message: "Deleted category successfully" });
 } catch (error) {
    console.error("DELETE ERROR:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
 }
}
