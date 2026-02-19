import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";

type CategoryNode = {
  id: string;
  name: string;
  parentId: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  children: CategoryNode[];
};

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyToken();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // 1️⃣ Get all categories
    const categories = await prisma.category.findMany({
      orderBy: { created_at: "asc" },
    });

    // 2️⃣ Build map
    const map = new Map<string, CategoryNode>();

    categories.forEach(cat => {
      map.set(cat.id, { ...cat, children: [] });
    });

    // 3️⃣ Build tree
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

    // 4️⃣ Find requested category inside tree
    const findNode = (nodes: CategoryNode[]): CategoryNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        const found = findNode(node.children);
        if (found) return found;
      }
      return null;
    };

    const result = findNode(tree);

    if (!result) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET ONE CATEGORY ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}
