import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { checkApiPermission } from "@/lib/utils/apiPermission";
import { sendOrderStatusEmail } from "@/lib/mailer";
import { cancelShipment } from "@/lib/nimbuspost";

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

// ── Status transition rules (forward-only, no going back) ──────────
const STATUS_RANK: Record<string, number> = {
    PLACED: 1,
    CONFIRMED: 2,
    PROCESSING: 3,
    SHIPPED: 4,
    DELIVERED: 5,
    CANCELLED: 6,
};

// Explicit allowed next states for each current state
const ALLOWED_NEXT: Record<string, string[]> = {
    PLACED:     ["CONFIRMED", "CANCELLED"],
    CONFIRMED:  ["PROCESSING", "CANCELLED"],
    PROCESSING: ["SHIPPED", "CANCELLED"],
    SHIPPED:    ["DELIVERED", "CANCELLED"],
    DELIVERED:  [],          // terminal — no further changes
    CANCELLED:  [],          // terminal — no further changes
};

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

        if (!STATUS_RANK[normalizedTargetStatus]) {
            return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
        }

        const updatedOrder = await prisma.$transaction(async (tx) => {
            // Get current order state INSIDE transaction for consistency
            const currentOrder = await tx.order.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!currentOrder) {
                throw new Error("Order not found");
            }

            const currentStatus = currentOrder.order_status.toUpperCase();

            // ── Enforce transition rules ────────────────────────────
            if (currentStatus === normalizedTargetStatus) {
                throw new Error(`Order is already ${normalizedTargetStatus}`);
            }

            const allowedNext = ALLOWED_NEXT[currentStatus] ?? [];
            if (!allowedNext.includes(normalizedTargetStatus)) {
                throw new Error(
                    `Cannot move order from ${currentStatus} to ${normalizedTargetStatus}. ` +
                    `Allowed transitions: ${allowedNext.length ? allowedNext.join(", ") : "none (terminal status)"}`
                );
            }

            // Restore Stock if moving to CANCELLED from any non-cancelled status
            if (normalizedTargetStatus === "CANCELLED") {
                for (const item of currentOrder.items) {
                    if (item.variant_id) {
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
            }

            // Perform the status update
            return await tx.order.update({
                where: { id },
                data: { order_status: normalizedTargetStatus as any },
                include: {
                    user: { select: { email: true, full_name: true } },
                    items: {
                        select: {
                            product_name: true,
                            quantity: true,
                            price: true
                        }
                    }
                }
            });
        });

        // Send email notification (non-blocking)
        if (updatedOrder.user?.email) {
            sendOrderStatusEmail(updatedOrder.user.email, {
                orderNumber: updatedOrder.order_number,
                status: updatedOrder.order_status,
                userName: updatedOrder.user.full_name || "Valued Customer",
                total: updatedOrder.total_amount,
                items: updatedOrder.items.map((item: any) => ({
                    productName: item.product_name || "Product",
                    quantity: item.quantity,
                    price: item.price
                }))
            }).catch(err => console.error("EMAIL_STATUS_UPDATE_ERROR", err));
        }

        return NextResponse.json(updatedOrder, { status: 200 });
    } catch (error: any) {
        console.error("PATCH_ORDER_STATUS_ERROR", error);
        if (error.message === "Order not found") {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }
        // Return transition errors as 422 so frontend knows it's a business-rule rejection
        if (
            error.message?.startsWith("Cannot move order") ||
            error.message?.startsWith("Order is already")
        ) {
            return NextResponse.json({ error: error.message }, { status: 422 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE: Cancel order (for users) or Remove order (for admin)
export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { error } = await checkApiPermission(MODULE, "canDelete");
        
        // If no permission error, it's an admin delete - proceed with full deletion
        if (!error) {
            // Admin has permission - do full delete
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

                // 2. Restore stock if needed
                const shouldRestoreStock = ["PLACED", "CONFIRMED", "PROCESSING"].includes(order.order_status);

                if (shouldRestoreStock) {
                    for (const item of order.items) {
                        if (item.variant_id) {
                            await tx.productVariant.update({
                                where: { id: item.variant_id },
                                data: { stock: { increment: item.quantity } }
                            });

                            await tx.stockLog.create({
                                data: {
                                    variant_id: item.variant_id,
                                    change: item.quantity,
                                    reason: `Stock restored - Order #${order.order_number} deleted by admin`
                                }
                            });
                        }
                    }
                }

                // 3. Delete the order
                await tx.order.delete({
                    where: { id }
                });

                return { message: "Order removed successfully" };
            });

            return NextResponse.json(result, { status: 200 });
        }
        
        // If permission error, it's a user cancel - just update status to CANCELLED
        const { id } = await context.params;

        const updatedOrder = await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!order) {
                throw new Error("Order not found");
            }

            // Only allow cancellation if order is in PLACED status
            if (order.order_status !== "PLACED") {
                throw new Error("Only orders in PLACED status can be cancelled by users");
            }

            // RESTORE STOCK for all items
            for (const item of order.items) {
                if (item.variant_id) {
                    await tx.productVariant.update({
                        where: { id: item.variant_id },
                        data: { stock: { increment: item.quantity } }
                    });

                    await tx.stockLog.create({
                        data: {
                            variant_id: item.variant_id,
                            change: item.quantity,
                            reason: `Stock restored - Order #${order.order_number} cancelled`
                        }
                    });
                }
            }

            // CANCEL SHIPMENT in NimbusPost if AWB exists
            if (order.awb_number) {
                try {
                    await cancelShipment([order.awb_number]);
                    console.log(`Shipment ${order.awb_number} cancelled in NimbusPost`);
                } catch (shipmentError) {
                    console.error("Failed to cancel shipment in NimbusPost:", shipmentError);
                    // Continue anyway - we still want to update local DB
                }
            }

            // Update status to CANCELLED instead of deleting
            return await tx.order.update({
                where: { id },
                data: { 
                    order_status: "CANCELLED",
                    shipping_status: order.awb_number ? "CANCELLED" : order.shipping_status
                },
                include: {
                    user: { select: { email: true, full_name: true } },
                    items: {
                        select: {
                            product_name: true,
                            quantity: true,
                            price: true
                        }
                    }
                }
            });
        });

        // Send cancellation email
        if (updatedOrder.user?.email) {
            sendOrderStatusEmail(updatedOrder.user.email, {
                orderNumber: updatedOrder.order_number,
                status: updatedOrder.order_status,
                userName: updatedOrder.user.full_name || "Valued Customer",
                total: updatedOrder.total_amount,
                items: updatedOrder.items.map((item: any) => ({
                    productName: item.product_name || "Product",
                    quantity: item.quantity,
                    price: item.price
                }))
            }).catch(err => console.error("EMAIL_ORDER_CANCELLED_ERROR", err));
        }

        return NextResponse.json(updatedOrder, { status: 200 });
    } catch (error: any) {
        console.error("DELETE_ORDER_ERROR", error);
        if (error.message === "Order not found") {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
