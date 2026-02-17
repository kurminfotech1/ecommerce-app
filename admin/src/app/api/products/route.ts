import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category");

    const skip = (page - 1) * limit;

    const where: any = {
      AND: [
        search
          ? {
              product_name: {
                contains: search,
                mode: "insensitive",
              },
            }
          : {},
        category
          ? { category_id: Number(category) }
          : {},
      ],
    };

    const [products, total] = await Promise.all([
      prisma.products.findMany({
        where,
        include: {
          category: true,
          images: true,
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.products.count({ where }),
    ]);

    return NextResponse.json({
      data: products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// export async function GET(req: Request) {
//   try {
//     const id = new URL(req.url).searchParams.get("id");

//     // GET single
//     if (id) {
//       const product = await prisma.products.findUnique({
//         where: { id: Number(id) },
//         include: {
//           category: true,
//           images: true, // 🔥 include images
//         },
//       });

//       return NextResponse.json(product);
//     }

//     // GET all
//     const products = await prisma.products.findMany({
//       include: {
//         category: true,
//         images: true,
//       },
//       orderBy: { created_at: "desc" },
//     });

//     return NextResponse.json(products);

//   } catch (error) {
//     console.error("GET PRODUCTS ERROR:", error);
//     return NextResponse.json({ error: "Failed" }, { status: 500 });
//   }
// }

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1️⃣ create product first
    const product = await prisma.products.create({
      data: {
        product_name: body.product_name,
        slug: body.slug ?? null,
        description: body.description ?? null,
        short_desc: body.short_desc ?? null,
        size: body.size ?? null,
        color: body.color ?? null,
        price: Number(body.price),
        compare_price: body.compare_price
          ? Number(body.compare_price)
          : null,
        stock: Number(body.stock ?? 0),
        category_id: Number(body.category_id),
        is_active: body.is_active ?? true,
        is_featured: body.is_featured ?? false,
        meta_title: body.meta_title ?? null,
        meta_desc: body.meta_desc ?? null,
      },
      include: { category: true },
    });

    // 2️⃣ generate SKU using DB id
    const categoryCode =
      product.category.category_name
        .slice(0, 3)
        .toUpperCase();

    const productCode =
      product.product_name
        .replace(/\s+/g, "")
        .slice(0, 4)
        .toUpperCase();

    const sku =
      `${categoryCode}-${productCode}-${String(product.id).padStart(6, "0")}`;

    // 3️⃣ update product with SKU
    const updated = await prisma.products.update({
      where: { id: product.id },
      data: { sku },
      include: {
        category: true,
        images: true,
      },
    });

    return NextResponse.json({
  message: "Product created successfully",
  data: updated,
}, { status: 201 });


  } catch (error) {
    console.error("POST PRODUCT ERROR:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}


export async function PUT(req: Request) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    const body = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const updated = await prisma.products.update({
      where: { id: Number(id) },
      data: {
        product_name: body.product_name,
        slug: body.slug,
        description: body.description,
        short_desc: body.short_desc,
        size: body.size,
        color: body.color,

        price: Number(body.price),
        compare_price: body.compare_price
          ? Number(body.compare_price)
          : null,

        stock: Number(body.stock),
        sku: body.sku,

        category_id: Number(body.category_id),

        is_active: body.is_active,
        is_featured: body.is_featured,

        meta_title: body.meta_title,
        meta_desc: body.meta_desc,
      },
      include: {
        category: true,
        images: true,
      },
    });

    return NextResponse.json({
  message: "Product updated successfully",
  data: updated,
});

  } catch (error) {
    console.error("PUT PRODUCT ERROR:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const id = new URL(req.url).searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID required" },
        { status: 400 }
      );
    }

    const productId = Number(id);

    // 1️⃣ fetch images from DB
    const images = await prisma.product_images.findMany({
      where: { product_id: productId },
    });

    // 2️⃣ extract filenames from Supabase URLs
    const files = images
      .map((img) => img.image_url.split("/").pop())
      .filter(Boolean) as string[];

    // 3️⃣ delete files from Supabase storage
    if (files.length > 0) {
      const { error: storageError } =
        await supabaseAdmin.storage
          .from("products")
          .remove(files);

      if (storageError) {
        console.error("Storage delete error:", storageError);
      }
    }

    // 4️⃣ delete product
    // cascade auto deletes product_images rows
    await prisma.products.delete({
      where: { id: productId },
    });

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });

  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);

    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}
// export async function DELETE(req: Request) {
//   try {
//     const id = new URL(req.url).searchParams.get("id");

//     if (!id) {
//       return NextResponse.json({ error: "ID required" }, { status: 400 });
//     }

//     await prisma.products.delete({
//       where: { id: Number(id) },
//     });

//     return NextResponse.json({ message: "Deleted product successfully" });

//   } catch (error) {
//     console.error("DELETE PRODUCT ERROR:", error);
//     return NextResponse.json({ error: "Delete failed" }, { status: 500 });
//   }
// }
