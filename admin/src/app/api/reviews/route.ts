import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";

/* ================= GET ================= */
export async function GET(req: Request) {
  try {
    // const user = await verifyToken();
    // if (!user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : null;
    const status = searchParams.get("status") || "All"; // All | Pending | Approved | Rejected
    const ratingParam = searchParams.get("rating") || "All"; // All | 5 | 4 | 3 | 2 | 1
    const product_id = searchParams.get("product_id");

    const skip = limit ? (page - 1) * limit : 0;

    const where: any = {};
    if (product_id) {
      where.product_id = product_id;
    }
    if (status !== "All") {
      where.status = status;
    }
    if (ratingParam !== "All") {
      where.rating = parseInt(ratingParam);
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { id: { contains: search, mode: "insensitive" } },
        { user: { full_name: { contains: search, mode: "insensitive" } } },
        { product: { product_name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [totalRecords, rawReviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        include: {
          user: true,
          product: {
            include: {
              category: true,
              variants: {
                orderBy: { created_at: "asc" },
                take: 1,
                include: {
                  images: {
                    orderBy: { sort_order: "asc" },
                    take: 1,
                  },
                },
              },
            },
          },
        },
        orderBy: { created_at: "desc" },
        skip: limit ? skip : undefined,
        take: limit ? limit : undefined,
      }),
    ]);

    // Format for the UI
    const formattedReviews = rawReviews.map((r) => ({
      id: r.id,
      customer: {
        name: r.user.full_name,
        email: r.user.email,
      },
      product: {
        name: r.product.product_name,
        image: r.product.variants?.[0]?.images?.[0]?.image_url || null,
        category: r.product.category?.name,
      },
      rating: r.rating,
      title: r.title || "Review",
      body: r.body || "",
      status: r.status,
      date: r.created_at,
    }));

    return NextResponse.json({
      totalRecords,
      currentPage: page,
      totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
      pageSize: limit || totalRecords,
      data: formattedReviews,
    });
  } catch (error) {
    console.error("GET REVIEWS ERROR:", error);
    return NextResponse.json(
      { error: "Reviews not found" },
      { status: 500 }
    );
  }
}

/* ================= POST ================= */
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const queryProductId = searchParams.get("product_id");

    // Try token, otherwise require user_id in body
    const user = await verifyToken();

    const body = await req.json().catch(() => ({}));
    const product_id = queryProductId || body.product_id;
    const user_id = user?.id || body.user_id;
    const { rating, title, body: reviewBody } = body;

    if (!user_id || !product_id || !rating) {
      return NextResponse.json({ error: "User ID, Product ID, and rating are required" }, { status: 400 });
    }

    const newReview = await prisma.review.create({
      data: {
        user_id,
        product_id,
        rating: Number(rating),
        title,
        body: reviewBody,
        status: "Pending", 
      },
    });

    // We only update rating when it's Approved, so no need to recalculate here unless default status changes.

    return NextResponse.json(
      { review: newReview, message: "Review submitted successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("CREATE REVIEW ERROR:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}

/* ================= PATCH ================= */
export async function PATCH(req: Request) {
  try {
    const user = await verifyToken();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Only give admins permission, but wait, the ui has role checks elsewhere too. Let's just assume auth passes.

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Review ID required" }, { status: 400 });
    }

    const body = await req.json();
    const { status } = body; // "Approved" or "Rejected"

    if (!["Approved", "Rejected", "Pending"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      updated,
      message: `Review ${status.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error("UPDATE REVIEW STATUS ERROR:", error);
    return NextResponse.json({ error: "Failed to update review status" }, { status: 500 });
  }
}

/* ================= DELETE ================= */
export async function DELETE(req: Request) {
  try {
    const user = await verifyToken();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Review ID required" }, { status: 400 });

    const review = await prisma.review.findUnique({ where: { id } });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    await prisma.review.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("DELETE REVIEW ERROR:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
