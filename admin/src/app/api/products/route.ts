import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyToken } from "@/lib/auth";
import { checkApiPermission } from "@/lib/utils/apiPermission";

const MODULE = "Products";

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
    // const user = await verifyToken();
    // if (!user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

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
    const bestsellerParam = searchParams.get("bestseller"); // "true" | null
    const isNewParam = searchParams.get("is_new");       // "true" | null
    const isUpcomingParam = searchParams.get("is_upcoming"); // "true" | null
    const weight = searchParams.get("weight")?.trim();
    const minPrice = searchParams.get("min_price");
    const maxPrice = searchParams.get("max_price");

    const skip = (page - 1) * limit;

    const variantFilters: any = {};
    if (weight) {
      variantFilters.weight = { startsWith: weight, mode: "insensitive" };
    }
    if (minPrice || maxPrice) {
      variantFilters.price = {};
      if (minPrice) variantFilters.price.gte = Number(minPrice);
      if (maxPrice) variantFilters.price.lte = Number(maxPrice);
    }

    const where: any = {
      ...(activeParam !== null ? { is_active: activeParam === "true" } : {}),
      ...(featuredParam === "true" ? { is_featured: true } : {}),
      ...(bestsellerParam === "true" ? { is_bestseller: true } : {}),
      ...(isNewParam === "true" ? { is_new: true } : {}),
      ...(isUpcomingParam === "true" ? { is_upcoming: true } : {}),
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
    const { error } = await checkApiPermission(MODULE, "canCreate");
    if (error) return error;

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

        ingredient: body.ingredient ?? null,
        benefits: body.benefits ?? [],
        certifications: body.certifications ?? [],
        country_of_origin: body.country_of_origin ?? null,
        expiry_months: body.expiry_months ? Number(body.expiry_months) : null,
        storage_info: body.storage_info ?? null,
        allergen_info: body.allergen_info ?? null,

        is_active: body.is_active ?? true,
        is_featured: body.is_featured ?? false,
        is_bestseller: body.is_bestseller ?? false,
        is_new: body.is_new ?? false,
        is_upcoming: body.is_upcoming ?? false,

        meta_title: body.meta_title ?? null,
        meta_desc: body.meta_desc ?? null,
      },
      include: { category: true },
    });

    // 2️⃣ Save variants (if provided)
    const variantPayload: {
      size?: string;
      color?: string;
      weight?: string;
      price: number;
      compare_price?: number;
      stock?: number;
      low_stock_threshold?: number;
      sku?: string;
      images?: { image_url: string; alt_text?: string; sort_order?: number }[];
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
            weight: v.weight ?? null,
            price: Number(v.price),
            compare_price: v.compare_price ? Number(v.compare_price) : null,
            stock: Number(v.stock ?? 0),
            low_stock_threshold: v.low_stock_threshold ? Number(v.low_stock_threshold) : 5,
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
              alt_text: img.alt_text ?? null,
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
    const { error } = await checkApiPermission(MODULE, "canUpdate");
    if (error) return error;

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
        ...(body.category_id !== undefined && { category: { connect: { id: body.category_id } } }),

        ...(body.ingredient !== undefined && { ingredient: body.ingredient }),
        ...(body.benefits !== undefined && { benefits: body.benefits }),
        ...(body.certifications !== undefined && { certifications: body.certifications }),
        ...(body.country_of_origin !== undefined && { country_of_origin: body.country_of_origin }),
        ...(body.expiry_months !== undefined && { expiry_months: body.expiry_months ? Number(body.expiry_months) : null }),
        ...(body.storage_info !== undefined && { storage_info: body.storage_info }),
        ...(body.allergen_info !== undefined && { allergen_info: body.allergen_info }),

        ...(body.is_active !== undefined && { is_active: body.is_active }),
        ...(body.is_featured !== undefined && { is_featured: body.is_featured }),
        ...(body.is_bestseller !== undefined && { is_bestseller: body.is_bestseller }),
        ...(body.is_new !== undefined && { is_new: body.is_new }),
        ...(body.is_upcoming !== undefined && { is_upcoming: body.is_upcoming }),

        ...(body.meta_title !== undefined && { meta_title: body.meta_title }),
        ...(body.meta_desc !== undefined && { meta_desc: body.meta_desc }),
      },
    });


    // ── Replace variants if `variants` key present ─────────────
    if (body.variants !== undefined) {
      const newVariants: {
        size?: string;
        color?: string;
        weight?: string;
        price: number;
        compare_price?: number;
        stock?: number;
        low_stock_threshold?: number;
        sku?: string;
        images?: { image_url: string; alt_text?: string; sort_order?: number }[];
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

      const allNewVariantImageUrls = newVariants.flatMap((v) =>
        (v.images ?? []).map((img) => img.image_url)
      );

      const urlsToDelete = allOldVariantImageUrls.filter(
        (url) => !allNewVariantImageUrls.includes(url)
      );

      if (urlsToDelete.length > 0) {
        await deleteFromStorage(urlsToDelete);
      }

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
            weight: v.weight ?? null,
            price: Number(v.price),
            compare_price: v.compare_price ? Number(v.compare_price) : null,
            stock: Number(v.stock ?? 0),
            low_stock_threshold: v.low_stock_threshold ? Number(v.low_stock_threshold) : 5,
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
              alt_text: img.alt_text ?? null,
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
    const { error } = await checkApiPermission(MODULE, "canDelete");
    if (error) return error;

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
