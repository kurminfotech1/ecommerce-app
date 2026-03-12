import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendOrderStatusEmail } from "@/lib/mailer";

// GET: Get all orders with server-side search, status filter & pagination
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const userId = searchParams.get("userId") ?? undefined;
        const search = searchParams.get("search")?.trim() ?? "";
        const status = searchParams.get("status") ?? "";   // e.g. "PLACED"
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const page = Math.max(1, Number(searchParams.get("page") || 1));
        const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 20)));
        const skip = (page - 1) * limit;

        // ── Build time filter ───────────────────────────────────────
        const timeWhere: any = {};
        if (startDate || endDate) {
            timeWhere.created_at = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                timeWhere.created_at.gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                timeWhere.created_at.lte = end;
            }
        }

        // ── Build where clause ──────────────────────────────────────
        const where: any = { ...timeWhere };

        if (userId) where.user_id = userId;

        if (status && status !== "All") {
            where.order_status = status;
        }

        if (search) {
            where.OR = [
                { order_number: { contains: search, mode: "insensitive" } },
                { shipping_address: { contains: search, mode: "insensitive" } },
                { shipping_city: { contains: search, mode: "insensitive" } },
                { user: { full_name: { contains: search, mode: "insensitive" } } },
                { user: { email: { contains: search, mode: "insensitive" } } },
            ];
        }

        // ── Count + paginated fetch (parallel) ──────────────────────
        const [total, orders] = await Promise.all([
            prisma.order.count({ where }),
            prisma.order.findMany({
                where,
                skip,
                take: limit,
                include: {
                    items: {
                        include: {
                            variant: {
                                include: {
                                    product: {
                                        include: {
                                            images: { take: 1, orderBy: { sort_order: "asc" } },
                                        },
                                    },
                                    images: { take: 1, orderBy: { sort_order: "asc" } },
                                },
                            },
                        },
                    },
                    payment: true,
                    user: { select: { id: true, full_name: true, email: true, phone: true } },
                },
                orderBy: { created_at: "desc" },
            }),
        ]);

        return NextResponse.json({
            data: orders,
            total,
            page,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        }, { status: 200 });

    } catch (error: any) {
        console.error("GET_ORDERS_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Create a new order from cart
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            user_id,
            shipping_name,
            shipping_phone,
            shipping_address,
            shipping_city,
            shipping_state,
            shipping_pincode,
            shipping_country
        } = body;

        if (!user_id || !shipping_name || !shipping_address || !shipping_city) {
            return NextResponse.json({ error: "Missing required order information" }, { status: 400 });
        }

        // 1. Get user's cart items
        const cartItems = await prisma.cart.findMany({
            where: { user_id },
            include: { 
                variant: {
                    include: {
                        product: {
                            include: { images: { take: 1, orderBy: { sort_order: "asc" } } }
                        },
                        images: { take: 1, orderBy: { sort_order: "asc" } }
                    }
                } 
            }
        });

        if (cartItems.length === 0) {
            return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
        }

        // 2. Calculate total amount
        const totalAmount = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        // 3. Generate a simple order number
        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // 4. Create Order and OrderItems in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create Order
            const order = await tx.order.create({
                data: {
                    order_number: orderNumber,
                    user_id,
                    total_amount: totalAmount,
                    order_status: "PLACED",
                    shipping_name,
                    shipping_phone,
                    shipping_address,
                    shipping_city,
                    shipping_state,
                    shipping_pincode,
                    shipping_country,
                    items: {
                        create: cartItems.map((item) => {
                            const variantImage = item.variant.images?.[0]?.image_url;
                            const productImage = item.variant.product?.images?.[0]?.image_url;
                            return {
                                variant_id: item.variant_id,
                                quantity: item.quantity,
                                price: item.price,
                                product_name: item.variant.product?.product_name || "Unknown Product",
                                sku: item.variant.sku,
                                weight: item.variant.weight,
                                size: item.variant.size,
                                image_url: variantImage || productImage || null,
                            };
                        })
                    }
                },
                include: {
                    items: true,
                    user: {
                        select: {
                            email: true,
                            full_name: true
                        }
                    }
                }
            });

            // Clear User's Cart
            await tx.cart.deleteMany({
                where: { user_id }
            });

            // Update stock and create logs
            for (const item of cartItems) {
                await tx.productVariant.update({
                    where: { id: item.variant_id },
                    data: {
                        stock: {
                            decrement: item.quantity
                        }
                    }
                });

                await tx.stockLog.create({
                    data: {
                        variant_id: item.variant_id,
                        change: -item.quantity,
                        reason: `Order ${orderNumber}`
                    }
                });
            }

            return order;
        });

        // Send email notification (non-blocking)
        if (result.user?.email) {
            sendOrderStatusEmail(result.user.email, {
                orderNumber: result.order_number,
                status: result.order_status,
                userName: result.user.full_name || "Valued Customer",
                total: result.total_amount,
                items: result.items.map((item: any) => ({
                    productName: item.product_name || "Product",
                    quantity: item.quantity,
                    price: item.price
                }))
            }).catch(err => console.error("EMAIL_ORDER_PLACED_ERROR", err));
        }

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error("POST_ORDER_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
