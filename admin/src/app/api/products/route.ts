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

/** Delete an array of public URLs from Supabase storage (best-effort, non-fatal) */
async function deleteFromStorage(urls: string[]) {
  const paths = urls.map(extractStoragePath).filter(Boolean) as string[];
  if (paths.length === 0) return;
  const { error } = await supabaseAdmin.storage.from(BUCKET).remove(paths);
  if (error) console.error("Supabase storage delete error:", error.message);
}

/** Standard product include — used across all APIs */
const productInclude = {
  category: true,
  variants: {
    orderBy: { created_at: "asc" as const },
    include: {
      images: {
        orderBy: { sort_order: "asc" as const },
      },
    },
  },
} as const;

// ─────────────────────────────────────────────────────────────────
// GET  /api/products
//   ?id=<uuid>              → single product with variants, variant images & product images
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
    const featuredParam = searchParams.get("featured");  // "true" | null
    const size = searchParams.get("size")?.trim();
    const minPrice = searchParams.get("min_price");
    const maxPrice = searchParams.get("max_price");

    const skip = (page - 1) * limit;

    const variantFilters: any = {};
    if (size) {
      variantFilters.size = { equals: size, mode: "insensitive" };
    }
    if (minPrice || maxPrice) {
      variantFilters.price = {};
      if (minPrice) variantFilters.price.gte = Number(minPrice);
      if (maxPrice) variantFilters.price.lte = Number(maxPrice);
    }

    const where: any = {
      ...(activeParam !== null ? { is_active: activeParam === "true" } : {}),
      ...(featuredParam === "true" ? { is_featured: true } : {}),
      AND: [
        search ? { product_name: { contains: search, mode: "insensitive" } } : {},
        category ? { category_id: category } : {},
      ],
      ...(Object.keys(variantFilters).length > 0 ? { variants: { some: variantFilters } } : {}),
    };

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
//   product_name, category_id,          ← required
//   slug?, description?, short_desc?,
//   is_active?, is_featured?,
//   meta_title?, meta_desc?,
//   images?:   [{ image_url, sort_order? }]  ← product-level images
//   variants?: [{
//     size?, color?,
//     price,                             ← required per variant
//     compare_price?, stock?, sku?,
//     images?: [{ image_url, sort_order? }]  ← variant-level images
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

    // 2️⃣ Save variants (if provided)
    const variantPayload: {
      size?: string;
      color?: string;
      price: number;
      compare_price?: number;
      stock?: number;
      sku?: string;
      images?: { image_url: string; sort_order?: number }[];
    }[] = body.variants ?? [];

    if (variantPayload.length > 0) {
      for (const [idx, v] of variantPayload.entries()) {
        if (v.price == null) continue;

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

        // Create variant
        const variant = await prisma.productVariant.create({
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

        // 3a. Save variant-level images (if provided)
        const variantImages = v.images ?? [];
        if (variantImages.length > 0) {
          await prisma.variantImage.createMany({
            data: variantImages.map((img, imgIdx) => ({
              variant_id: variant.id,
              image_url: img.image_url,
              sort_order: img.sort_order ?? imgIdx,
            })),
          });
        }
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
// For images:   pass `images`   array to REPLACE all product-level images,
//               or omit `images` key to leave them unchanged.
// For variants: pass `variants` array to REPLACE all existing variants
//               (including their variant-level images),
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


    // ── Replace variants if `variants` key present ─────────────
    if (body.variants !== undefined) {
      const newVariants: {
        size?: string;
        color?: string;
        price: number;
        compare_price?: number;
        stock?: number;
        sku?: string;
        images?: { image_url: string; sort_order?: number }[];
      }[] = body.variants ?? [];

      // Fetch product + category for auto-SKU
      const productWithCat = await prisma.product.findUnique({
        where: { id },
        include: { category: true },
      });

      // Fetch old variant images to clean up from Supabase
      const oldVariants = await prisma.productVariant.findMany({
        where: { product_id: id },
        include: { images: true },
      });

      const allOldVariantImageUrls = oldVariants.flatMap((v) =>
        v.images.map((img) => img.image_url)
      );
      await deleteFromStorage(allOldVariantImageUrls);

      // Delete all existing variants (cascade removes variantImages rows in DB)
      await prisma.productVariant.deleteMany({ where: { product_id: id } });

      // Re-create variants
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

        const variant = await prisma.productVariant.create({
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

        // Save variant-level images
        const variantImages = v.images ?? [];
        if (variantImages.length > 0) {
          await prisma.variantImage.createMany({
            data: variantImages.map((img, imgIdx) => ({
              variant_id: variant.id,
              image_url: img.image_url,
              sort_order: img.sort_order ?? imgIdx,
            })),
          });
        }
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
// Deletes the product and removes ALL related images (product-level
// + variant-level) from Supabase storage.
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

    // 1️⃣ Collect variant-level image URLs to clean from Supabase
    const variants = await prisma.productVariant.findMany({
      where: { product_id: id },
      include: { images: true },
    });
    const variantImageUrls = variants.flatMap((v) =>
      v.images.map((img) => img.image_url)
    );
    await deleteFromStorage(variantImageUrls);

    // 2️⃣ Delete product from DB (cascade removes variants + variantImages)
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
