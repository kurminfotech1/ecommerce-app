import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

/** Standard blog include — pulls in tags */
const blogInclude = {
  tags: true,
} as const;

/** Upsert tags by name → returns array of { id } for Prisma connect */
async function upsertTags(names: string[]): Promise<{ id: string }[]> {
  const results: { id: string }[] = [];
  for (const rawName of names) {
    const name = rawName.trim();
    if (!name) continue;
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const tag = await prisma.blogTag.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
    results.push({ id: tag.id });
  }
  return results;
}

// ─────────────────────────────────────────────────────────────────
// GET  /api/blog
//   ?id=<uuid>              → single blog
//   ?page=1&limit=10        → paginated list
//   ?search=keyword         → search by title
//   ?category=<string>      → filter by category
//   ?author=<string>        → filter by author
//   ?tag=<uuid>             → filter by tag id
//   ?published=true|false   → filter by is_published
//   ?featured=true          → filter only featured blogs
// ─────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // ── Single Blog ─────────────────────────────────────────────
    if (id) {
      const blog = await prisma.blog.findUnique({
        where: { id },
        include: blogInclude,
      });

      if (!blog) {
        return NextResponse.json({ error: "Blog not found" }, { status: 404 });
      }

      return NextResponse.json({ data: blog });
    }

    // ── Paginated List ──────────────────────────────────────────
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 10)));
    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";
    const author = searchParams.get("author")?.trim() || "";
    const tag = searchParams.get("tag");
    const publishedParam = searchParams.get("published");
    const featuredParam = searchParams.get("featured");
    const draftParam = searchParams.get("draft");

    const skip = (page - 1) * limit;

    const where: any = {
      ...(publishedParam !== null ? { is_published: publishedParam === "true" } : {}),
      ...(featuredParam === "true" ? { is_featured: true } : {}),
      ...(draftParam === "true" ? { is_draft: true } : {}),
      AND: [
        search ? { title: { contains: search, mode: "insensitive" } } : {},
        category ? { category: { contains: category, mode: "insensitive" } } : {},
        author ? { author: { contains: author, mode: "insensitive" } } : {},
        tag ? { tags: { some: { id: tag } } } : {},
      ],
    };

    const [blogs, totalRecords] = await Promise.all([
      prisma.blog.findMany({
        where,
        include: blogInclude,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.blog.count({ where }),
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    return NextResponse.json({
      totalRecords,
      currentPage: page,
      totalPages,
      pageSize: limit,
      data: blogs,
    });
  } catch (error) {
    console.error("GET BLOGS ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// POST  /api/blog
// ─────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const user = await verifyToken();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.title || !body.slug || !body.content || !body.category || !body.author) {
      return NextResponse.json(
        { error: "Missing required fields (title, slug, content, category, author)" },
        { status: 400 }
      );
    }

    // Resolve tags: accept either tag_ids (UUIDs) or blog_tags (name strings)
    let tagConnects: { id: string }[] = [];
    if (Array.isArray(body.tag_ids) && body.tag_ids.length > 0) {
      tagConnects = body.tag_ids.map((id: string) => ({ id }));
    } else if (Array.isArray(body.blog_tags) && body.blog_tags.length > 0) {
      tagConnects = await upsertTags(body.blog_tags);
    }

    const blog = await prisma.blog.create({
      data: {
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt ?? null,
        content: body.content,
        featured_image: body.featured_image ?? null,
        category: body.category,
        author: body.author,
        meta_title: body.meta_title ?? null,
        meta_desc: body.meta_desc ?? null,
        canonical_url: body.canonical_url ?? null,
        is_draft: body.is_draft ?? false,
        is_published: body.is_published ?? false,
        is_featured: body.is_featured ?? false,
        published_at: body.is_published ? new Date() : null,
        tags: tagConnects.length > 0 ? { connect: tagConnects } : undefined,
      },
      include: blogInclude,
    });

    return NextResponse.json(
      { message: "Blog created successfully", data: blog },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST BLOG ERROR:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// PUT  /api/blog?id=<uuid>
// ─────────────────────────────────────────────────────────────────
export async function PUT(req: Request) {
  try {
    const user = await verifyToken();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const body = await req.json();

    const existingBlog = await prisma.blog.findUnique({
      where: { id },
    });

    if (!existingBlog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    // Resolve tags: accept either tag_ids (UUIDs) or blog_tags (name strings)
    let tagConnects: { id: string }[] | undefined;
    if (body.tag_ids !== undefined) {
      if (Array.isArray(body.tag_ids) && body.tag_ids.length > 0) {
        tagConnects = body.tag_ids.map((id: string) => ({ id }));
      } else {
        tagConnects = []; // explicit empty → clear all tags
      }
    } else if (Array.isArray(body.blog_tags)) {
      tagConnects = await upsertTags(body.blog_tags);
    }

    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: {
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt,
        content: body.content,
        featured_image: body.featured_image,
        category: body.category,
        author: body.author,
        meta_title: body.meta_title,
        meta_desc: body.meta_desc,
        canonical_url: body.canonical_url,
        is_draft: body.is_draft,
        is_published: body.is_published,
        is_featured: body.is_featured,

        ...(body.is_published !== undefined && body.is_published !== existingBlog.is_published && {
          published_at: body.is_published ? new Date() : null
        }),

        ...(tagConnects !== undefined && {
          tags: { set: tagConnects },
        }),
      },
      include: blogInclude,
    });

    return NextResponse.json({
      message: "Blog updated successfully",
      data: updatedBlog,
    });
  } catch (error: any) {
    console.error("PUT BLOG ERROR:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// DELETE  /api/blog?id=<uuid>
// ─────────────────────────────────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const user = await verifyToken();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await prisma.blog.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    console.error("DELETE BLOG ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
