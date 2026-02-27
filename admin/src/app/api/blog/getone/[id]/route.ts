import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/** Standard blog include */
const blogInclude = {
  category: true,
  author: true,
  tags: true,
} as const;

// ─────────────────────────────────────────────────────────────────
// GET /api/blog/getone/[id]
// ─────────────────────────────────────────────────────────────────
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const blog = await prisma.blog.findUnique({
      where: { id },
      include: blogInclude,
    });

    if (!blog) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: blog });
  } catch (error) {
    console.error("GET ONE BLOG ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
