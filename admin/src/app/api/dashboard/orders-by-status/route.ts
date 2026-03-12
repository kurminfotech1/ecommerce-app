import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// ⚡ No caching - this is interactive (user clicks tabs)
export const dynamic = "force-dynamic";

const VALID_STATUSES = ["PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const status = searchParams.get("status") ?? "";
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const page = Math.max(1, Number(searchParams.get("page") || 1));
        const limit = Math.min(20, Math.max(1, Number(searchParams.get("limit") || 8)));
        const skip = (page - 1) * limit;

        // Build time filter
        const baseWhere: any = {};
        if (startDate || endDate) {
            baseWhere.created_at = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                baseWhere.created_at.gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                baseWhere.created_at.lte = end;
            }
        }

        // Build where clause — only filter by status if valid
        const where: any = { ...baseWhere };
        if (status && status !== "All" && VALID_STATUSES.includes(status)) {
            where.order_status = status;
        }

        // ── Run count + paginated fetch in PARALLEL ──────────────────
        const [total, orders, statusGroups] = await Promise.all([
            prisma.order.count({ where }),

            prisma.order.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    order_number: true,
                    total_amount: true,
                    order_status: true,
                    created_at: true,
                    shipping_city: true,
                    shipping_name: true,
                    user: {
                        select: { id: true, full_name: true, email: true, phone: true },
                    },
                    _count: { select: { items: true } },
                    items: {
                        take: 1,
                        select: {
                            variant: {
                                select: {
                                    product: {
                                        select: {
                                            product_name: true,
                                            images: {
                                                take: 1,
                                                orderBy: { sort_order: "asc" },
                                                select: { image_url: true },
                                            },
                                        },
                                    },
                                    images: {
                                        take: 1,
                                        orderBy: { sort_order: "asc" },
                                        select: { image_url: true },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: { created_at: "desc" },
            }),

            prisma.order.groupBy({
                by: ["order_status"],
                _count: { id: true },
                where: baseWhere,
            }),
        ]);

       
        const data = orders.map((order) => {
            console.log(order)
            const firstItem = order.items[0];
            const product = firstItem?.variant?.product;
            const productImage =
                firstItem?.variant?.images?.[0]?.image_url ||
                product?.images?.[0]?.image_url ||
                null;

            return {
                id: order.id,
                order_number: order.order_number,
                customer: order.user?.full_name || order.shipping_name,
                email: order.user?.email || "",
                phone: order.user?.phone || "",
                product_name: product?.product_name || "N/A",
                product_image: productImage,
                total_amount: order.total_amount,
                status: order.order_status,
                created_at: order.created_at,
                items_count: order._count.items,
                city: order.shipping_city,
            };
        });

        const statusBreakdown = statusGroups.map((s) => ({
            status: s.order_status,
            count: s._count.id,
        }));

        return NextResponse.json({
            data,
            total,
            page,
            totalPages: Math.max(1, Math.ceil(total / limit)),
            statusBreakdown,
        });
    } catch (error) {
        console.error("DASHBOARD_ORDERS_BY_STATUS_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

