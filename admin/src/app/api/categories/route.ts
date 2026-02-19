import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";

/* ================= GET ================= */


type CategoryNode = {
  id: string;
  name: string;
  parentId: string | null;
  children: CategoryNode[];
};

function filterTree(nodes: CategoryNode[], search: string): CategoryNode[] {
  if (!search) return nodes;

  const lowerSearch = search.toLowerCase();

  return nodes
    .map(node => {
      const matched =
        node.name.toLowerCase().includes(lowerSearch);

      const filteredChildren = filterTree(node.children, search);

      if (matched || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        };
      }

      return null;
    })
    .filter(Boolean) as CategoryNode[];
}

export async function GET(req: Request) {
  try {
    const user = await verifyToken();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const skip = (page - 1) * limit;

    // get all categories
    const categories = await prisma.category.findMany({
      orderBy: { created_at: "asc" },
    });

    // tree
    const map = new Map<string, CategoryNode>();

    categories.forEach(cat => {
      map.set(cat.id, { ...cat, children: [] });
    });

    const tree: CategoryNode[] = [];

    categories.forEach(cat => {
      if (cat.parentId) {
        const parent = map.get(cat.parentId);
        if (parent) {
          parent.children.push(map.get(cat.id)!);
        }
      } else {
        tree.push(map.get(cat.id)!);
      }
    });

    // search
    const filteredTree = filterTree(tree, search);

    // pagination
    const paginatedData = filteredTree.slice(skip, skip + limit);
    const totalRecords = paginatedData.length;

    return NextResponse.json({
      totalRecords: totalRecords,
      currentPage: page,
      totalPages: Math.ceil(paginatedData?.length / limit),
      pageSize: limit,
      data: paginatedData,
    });

  } catch (error) {
    console.error("GET CATEGORY ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}


/* ================= POST ================= */
export async function POST(req: Request) {
  try {
    const user = await verifyToken();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    if (!body.name || !body.slug) {
      return NextResponse.json({ error: "Name and slug required" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name: body.name,
        slug: body.slug,
        parentId: body.parentId || null,
        is_active: body.is_active ?? true,
      },
    });

    return NextResponse.json(
      { category, message: "Category created successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("CREATE CATEGORY ERROR:", error);

    if (error.code === "P2002") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

/* ================= PUT ================= */
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

    // ❌ Prevent self as parent
    if (body.parentId && body.parentId === id) {
      return NextResponse.json(
        { error: "Category cannot be its own parent" },
        { status: 400 }
      );
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: body.name,
        slug: body.slug,
        parentId: body.parentId ?? null,
        is_active: body.is_active ?? true,
      },
    });

    return NextResponse.json(
      { updated, message: "Category updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("UPDATE CATEGORY ERROR:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}


/* ================= DELETE ================= */
export async function DELETE(req: Request) {
  try {
    const user = await verifyToken();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // 🔥 Delete children first, then parent (permanent)
    await prisma.$transaction([
      prisma.category.deleteMany({
        where: { parentId: id },
      }),
      prisma.category.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("SOFT DELETE CATEGORY ERROR:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

