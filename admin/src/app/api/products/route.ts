import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyToken } from "@/lib/auth";

const BUCKET = "products";

/** Extract Supabase storage path from a public URL */
function extractStoragePath(url: string): string | null {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split(`/object/public/${BUCKET}/`);
    return parts[1] ?? null;
  } catch {
    return null;
  }
}

/** Standard product include — used across all APIs */
const productInclude = {
  category: true,
  images: {
    orderBy: { sort_order: "asc" as const },
  },
  children: {
    include: {
      images: {
        orderBy: { sort_order: "asc" as const },
      },
    },
    orderBy: { created_at: "asc" as const },
  },
  parent: {
    select: { id: true, product_name: true, slug: true },
  },
} as const;

// ─────────────────────────────────────────────────────────────────
// GET  /api/products
//   ?id=<uuid>              → single product with children & images
//   ?page=1&limit=10        → paginated list (parents only)
//   ?search=keyword         → search by product_name
//   ?category=<uuid>        → filter by category
//   ?includeVariants=true   → include child/variant products too
//   ?featured=true          → only featured products
// ─────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const user = await verifyToken();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // ── Single product ──────────────────────────────────────────
    if (id) {
      const product = await prisma.product.findUnique({
        where: { id },
        include: productInclude,
      });

      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ data: product });
    }

    // ── List / search ───────────────────────────────────────────
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 10)));
    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category");
    const includeVariants = searchParams.get("includeVariants") === "true";
    const featured = searchParams.get("featured") === "true";

    const skip = (page - 1) * limit;

    const where: any = {
      ...(includeVariants ? {} : { parentId: null }),
      ...(featured ? { is_featured: true } : {}),
      AND: [
        search
          ? { product_name: { contains: search, mode: "insensitive" } }
          : {},
        category ? { category_id: category } : {},
      ],
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// POST  /api/products
// Body JSON:
// {
//   product_name, category_id, price,      ← required
//   parentId?,              ← pass to create a variant/child
//   slug?, description?, short_desc?,
//   size?, color?,          ← variant attributes
//   compare_price?, stock?, sku?,
//   is_active?, is_featured?,
//   meta_title?, meta_desc?,
//   images?: [{ image_url, sort_order? }]  ← image URLs (from /api/upload)
// }
// ─────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const user = await verifyToken();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.product_name || !body.category_id || body.price == null) {
      return NextResponse.json(
        { error: "product_name, category_id, and price are required" },
        { status: 400 }
      );
    }

    // 1️⃣ Create product
    const product = await prisma.product.create({
      data: {
        product_name: body.product_name,
        slug: body.slug ?? null,
        description: body.description ?? null,
        short_desc: body.short_desc ?? null,
        size: body.size ?? null,
        color: body.color ?? null,
        price: Number(body.price),
        compare_price: body.compare_price ? Number(body.compare_price) : null,
        stock: Number(body.stock ?? 0),
        sku: body.sku ?? null,
        category_id: body.category_id,
        parentId: body.parentId ?? null,
        is_active: body.is_active ?? true,
        is_featured: body.is_featured ?? false,
        meta_title: body.meta_title ?? null,
        meta_desc: body.meta_desc ?? null,
      },
      include: { category: true },
    });

    // 2️⃣ Auto-generate SKU for parent products (if not provided manually)
    if (!body.parentId && !body.sku) {
      const categoryCode = product.category.name.slice(0, 3).toUpperCase();
      const productCode = product.product_name
        .replace(/\s+/g, "")
        .slice(0, 4)
        .toUpperCase();
      const sku = `${categoryCode}-${productCode}-${product.id.slice(-6).toUpperCase()}`;

      await prisma.product.update({
        where: { id: product.id },
        data: { sku },
      });
    }

    // 3️⃣ Save images to product_images table (if provided)
    const imagePayload: { image_url: string; sort_order?: number }[] =
      body.images ?? [];

    if (imagePayload.length > 0) {
      await prisma.product_images.createMany({
        data: imagePayload.map((img, idx) => ({
          product_id: product.id,
          image_url: img.image_url,
          sort_order: img.sort_order ?? idx,
        })),
      });
    }

    // 4️⃣ Return full product with all relations
    const created = await prisma.product.findUnique({
      where: { id: product.id },
      include: productInclude,
    });

    return NextResponse.json(
      { message: "Product created successfully", data: created },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST PRODUCT ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// PUT  /api/products?id=<uuid>
// Body JSON: same fields as POST
// For images: pass `images` array to REPLACE all existing images,
//             or omit `images` key to leave images unchanged.
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

    // ── Update product fields ──────────────────────────────────
    await prisma.product.update({
      where: { id },
      data: {
        ...(body.product_name !== undefined && { product_name: body.product_name }),
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.short_desc !== undefined && { short_desc: body.short_desc }),
        ...(body.size !== undefined && { size: body.size }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.price !== undefined && { price: Number(body.price) }),
        ...(body.compare_price !== undefined && {
          compare_price: body.compare_price ? Number(body.compare_price) : null,
        }),
        ...(body.stock !== undefined && { stock: Number(body.stock) }),
        ...(body.sku !== undefined && { sku: body.sku }),
        ...(body.category_id !== undefined && { category_id: body.category_id }),
        ...(body.parentId !== undefined && { parentId: body.parentId ?? null }),
        ...(body.is_active !== undefined && { is_active: body.is_active }),
        ...(body.is_featured !== undefined && { is_featured: body.is_featured }),
        ...(body.meta_title !== undefined && { meta_title: body.meta_title }),
        ...(body.meta_desc !== undefined && { meta_desc: body.meta_desc }),
      },
    });

    // ── Replace images if `images` key is present in body ─────
    if (body.images !== undefined) {
      const newImages: { image_url: string; sort_order?: number }[] =
        body.images ?? [];

      const newUrls = new Set(newImages.map((img) => img.image_url));

      // Fetch old images from DB
      const oldImages = await prisma.product_images.findMany({
        where: { product_id: id },
      });

      // Only delete from Supabase the images that are NOT in the new list
      // (i.e., images the user actually removed — don't delete kept images!)
      const removedPaths = oldImages
        .filter((img) => !newUrls.has(img.image_url))
        .map((img) => extractStoragePath(img.image_url))
        .filter(Boolean) as string[];

      if (removedPaths.length > 0) {
        const { error: storageError } = await supabaseAdmin.storage
          .from(BUCKET)
          .remove(removedPaths);

        if (storageError) {
          console.error("Storage delete error during PUT:", storageError.message);
        }
      }

      // Replace DB records
      await prisma.product_images.deleteMany({ where: { product_id: id } });

      if (newImages.length > 0) {
        await prisma.product_images.createMany({
          data: newImages.map((img, idx) => ({
            product_id: id,
            image_url: img.image_url,
            sort_order: img.sort_order ?? idx,
          })),
        });
      }
    }

    // ── Return updated product ─────────────────────────────────
    const updated = await prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });

    return NextResponse.json({
      message: "Product updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("PUT PRODUCT ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// DELETE  /api/products?id=<uuid>
// Deletes the product (parent + all children via DB cascade)
// and removes ALL related images from Supabase storage.
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

    // 1️⃣ Collect this product + all descendant IDs
    const children = await prisma.product.findMany({
      where: { parentId: id },
      select: { id: true },
    });
    const allIds = [id, ...children.map((c) => c.id)];

    // 2️⃣ Fetch all images across parent + children
    const images = await prisma.product_images.findMany({
      where: { product_id: { in: allIds } },
    });

    // 3️⃣ Delete from Supabase storage (using proper path extraction)
    const storagePaths = images
      .map((img) => extractStoragePath(img.image_url))
      .filter(Boolean) as string[];

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabaseAdmin.storage
        .from(BUCKET)
        .remove(storagePaths);

      if (storageError) {
        // Non-fatal — log and continue so DB record is still cleaned up
        console.error("Storage delete error:", storageError.message);
      }
    }

    // 4️⃣ Delete product from DB (cascade removes children + images rows)
    await prisma.product.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
