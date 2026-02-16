import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const images = await prisma.product_images.createMany({
      data: body.images, // [{ product_id, image_url }]
    });

    return NextResponse.json(images);

  } catch (error) {
    console.error("IMAGE UPLOAD ERROR:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");

  await prisma.product_images.delete({
    where: { id: Number(id) },
  });

  return NextResponse.json({ message: "Deleted" });
}
