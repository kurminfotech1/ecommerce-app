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
  variants: {
    orderBy: { created_at: "asc" as const },
  },
} as const;

// ─────────────────────────────────────────────────────────────────
// GET  /api/products
//   ?id=<uuid>              → single product with variants & images
//   ?page=1&limit=10        → paginated list
//   ?search=keyword         → search by product_name
//   ?category=<uuid>        → filter by category_id
//   ?active=true|false      → filter by is_active
//   ?featured=true          → filter only featured products
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
    const activeParam = searchParams.get("active");    // "true" | "false" | null
    const featuredParam = searchParams.get("featured"); // "true" | null

    const skip = (page - 1) * limit;

    const where: any = {
      // is_active filter (omit entirely when param not provided → show all)
      ...(activeParam !== null ? { is_active: activeParam === "true" } : {}),

      // is_featured filter
      ...(featuredParam === "true" ? { is_featured: true } : {}),

      AND: [
        // Full-text search on product name
        search ? { product_name: { contains: search, mode: "insensitive" } } : {},

        // Category filter
        category ? { category_id: category } : {},
      ],
    };

    // Fetch all matched products (in-memory pagination for flexibility)
    const allProducts = await prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { created_at: "desc" },
    });

    const totalRecords = allProducts.length;
    const totalPages = Math.ceil(totalRecords / limit);
    const paginatedData = allProducts.slice(skip, skip + limit);

    return NextResponse.json({
      totalRecords,
      currentPage: page,
      totalPages,
      pageSize: limit,
      data: paginatedData,
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
//   product_name, category_id,       ← required
//   slug?, description?, short_desc?,
//   is_active?, is_featured?,
//   meta_title?, meta_desc?,
//   images?:   [{ image_url, sort_order? }]   ← from /api/upload
//   variants?: [{
//     size?, color?,
//     price,                          ← required per variant
//     compare_price?, stock?, sku?
//   }]
// }
// ─────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const user = await verifyToken();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.product_name || !body.category_id) {
      return NextResponse.json(
        { error: "product_name and category_id are required" },
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
        category_id: body.category_id,
        is_active: body.is_active ?? true,
        is_featured: body.is_featured ?? false,
        meta_title: body.meta_title ?? null,
        meta_desc: body.meta_desc ?? null,
      },
      include: { category: true },
    });

    // 2️⃣ Save images (if provided)
    const imagePayload: { image_url: string; sort_order?: number }[] =
      body.images ?? [];

    if (imagePayload.length > 0) {
      await prisma.productImage.createMany({
        data: imagePayload.map((img, idx) => ({
          product_id: product.id,
          image_url: img.image_url,
          sort_order: img.sort_order ?? idx,
        })),
      });
    }

    // 3️⃣ Save variants (if provided)
    const variantPayload: {
      size?: string;
      color?: string;
      price: number;
      compare_price?: number;
      stock?: number;
      sku?: string;
    }[] = body.variants ?? [];

    if (variantPayload.length > 0) {
      for (const [idx, v] of variantPayload.entries()) {
        if (v.price == null) continue; // price is required per variant

        // Auto-generate SKU if not supplied
        let sku = v.sku;
        if (!sku) {
          const categoryCode = product.category.name.slice(0, 3).toUpperCase();
          const productCode = product.product_name
            .replace(/\s+/g, "")
            .slice(0, 4)
            .toUpperCase();
          sku = `${categoryCode}-${productCode}-${product.id.slice(-4).toUpperCase()}-${idx + 1}`;
        }

        await prisma.productVariant.create({
          data: {
            product_id: product.id,
            size: v.size ?? null,
            color: v.color ?? null,
            price: Number(v.price),
            compare_price: v.compare_price ? Number(v.compare_price) : null,
            stock: Number(v.stock ?? 0),
            sku,
          },
        });
      }
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
// For images:   pass `images`   array to REPLACE all existing images,
//               or omit `images` key to leave images unchanged.
// For variants: pass `variants` array to REPLACE all existing variants,
//               or omit `variants` key to leave variants unchanged.
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
        ...(body.category_id !== undefined && { category_id: body.category_id }),
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
      const oldImages = await prisma.productImage.findMany({
        where: { product_id: id },
      });

      // Only delete from Supabase the images removed by the user
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
      await prisma.productImage.deleteMany({ where: { product_id: id } });

      if (newImages.length > 0) {
        await prisma.productImage.createMany({
          data: newImages.map((img, idx) => ({
            product_id: id,
            image_url: img.image_url,
            sort_order: img.sort_order ?? idx,
          })),
        });
      }
    }

    // ── Replace variants if `variants` key is present in body ─
    if (body.variants !== undefined) {
      const newVariants: {
        size?: string;
        color?: string;
        price: number;
        compare_price?: number;
        stock?: number;
        sku?: string;
      }[] = body.variants ?? [];

      // Get the product's category for auto-SKU
      const productWithCat = await prisma.product.findUnique({
        where: { id },
        include: { category: true },
      });

      // Delete all existing variants first
      await prisma.productVariant.deleteMany({ where: { product_id: id } });

      for (const [idx, v] of newVariants.entries()) {
        if (v.price == null) continue;

        let sku = v.sku;
        if (!sku && productWithCat) {
          const categoryCode = productWithCat.category.name.slice(0, 3).toUpperCase();
          const productCode = productWithCat.product_name
            .replace(/\s+/g, "")
            .slice(0, 4)
            .toUpperCase();
          sku = `${categoryCode}-${productCode}-${id.slice(-4).toUpperCase()}-${idx + 1}`;
        }

        await prisma.productVariant.create({
          data: {
            product_id: id,
            size: v.size ?? null,
            color: v.color ?? null,
            price: Number(v.price),
            compare_price: v.compare_price ? Number(v.compare_price) : null,
            stock: Number(v.stock ?? 0),
            sku: sku ?? `VAR-${id.slice(-4)}-${idx + 1}`,
          },
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
// Deletes the product and removes ALL related images from Supabase.
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

    // 1️⃣ Fetch all images for this product
    const images = await prisma.productImage.findMany({
      where: { product_id: id },
    });

    // 2️⃣ Delete from Supabase storage
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

    // 3️⃣ Delete product from DB (cascade removes variants + images rows)
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
