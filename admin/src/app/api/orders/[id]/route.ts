import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { checkApiPermission } from "@/lib/utils/apiPermission";

const MODULE = "Orders";

// GET: Get a specific order details
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        variant: {
                            include: {
                                product: {
                                    include: {
                                        images: {
                                            take: 1,
                                            orderBy: { sort_order: 'asc' }
                                        }
                                    }
                                },
                                images: {
                                    take: 1,
                                    orderBy: { sort_order: 'asc' }
                                }
                            }
                        }
                    }
                },
                payment: true,
                user: {
                    select: {
                        full_name: true,
                        email: true,
                        phone: true
                    }
                }
            }
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        return NextResponse.json(order, { status: 200 });
    } catch (error: any) {
        console.error("GET_ORDER_DETAIL_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PATCH: Update order status (Admin)
export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { error } = await checkApiPermission(MODULE, "canUpdate");
        if (error) return error;

        const { id } = await context.params;
        const body = await request.json();
        const { order_status } = body;

        if (!order_status) {
            return NextResponse.json({ error: "Order status is required" }, { status: 400 });
        }

        // Normalize status for comparisons
        const normalizedTargetStatus = order_status.toUpperCase();

        const updatedOrder = await prisma.$transaction(async (tx) => {
            // Get current order state INSIDE transaction for consistency
            const currentOrder = await tx.order.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!currentOrder) {
                throw new Error("Order not found");
            }

            // Restore Stock if moving to CANCELLED from any non-cancelled status
            if (normalizedTargetStatus === "CANCELLED" && currentOrder.order_status !== "CANCELLED") {
                for (const item of currentOrder.items) {
                    await tx.productVariant.update({
                        where: { id: item.variant_id },
                        data: { stock: { increment: item.quantity } }
                    });

                    await tx.stockLog.create({
                        data: {
                            variant_id: item.variant_id,
                            change: item.quantity,
                            reason: `Stock restored - Order #${currentOrder.order_number} cancelled by status update`
                        }
                    });
                }
            }

            // Perform the status update
            return await tx.order.update({
                where: { id },
                data: { order_status: normalizedTargetStatus as any }
            });
        });

        return NextResponse.json(updatedOrder, { status: 200 });
    } catch (error: any) {
        console.error("PATCH_ORDER_STATUS_ERROR", error);
        if (error.message === "Order not found") {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE: Cancel/Remove order
export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { error } = await checkApiPermission(MODULE, "canDelete");
        if (error) return error;

        const { id } = await context.params;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Get order with items INSIDE transaction
            const order = await tx.order.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!order) {
                throw new Error("Order not found");
            }

            // 2. Safeguard status (Only PLACED orders can be removed by users)
            if (order.order_status !== "PLACED" && order.order_status !== "CANCELLED") {
                throw new Error("Only orders with 'PLACED' or 'CANCELLED' status can be removed.");
            }

            // 3. Restore stock IF the order was PLACED (meaning stock was deducted and not yet restored)
            if (order.order_status === "PLACED") {
                for (const item of order.items) {
                    await tx.productVariant.update({
                        where: { id: item.variant_id },
                        data: { stock: { increment: item.quantity } }
                    });

                    await tx.stockLog.create({
                        data: {
                            variant_id: item.variant_id,
                            change: item.quantity,
                            reason: `Stock restored - Order #${order.order_number} removed from user panel`
                        }
                    });
                }
            }

            // 4. Delete the order
            await tx.order.delete({
                where: { id }
            });

            return { message: "Order removed successfully" };
        });

        return NextResponse.json(result, { status: 200 });
    } catch (error: any) {
        console.error("DELETE_ORDER_ERROR", error);
        if (error.message === "Order not found") {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }
        if (error.message.includes("Only orders with")) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
