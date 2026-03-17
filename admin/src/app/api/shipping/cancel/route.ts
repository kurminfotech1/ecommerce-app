import { NextResponse } from "next/server";
import { cancelShipment } from "@/lib/nimbuspost";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/shipping/cancel
 * Body: { order_id }
 * Cancels a shipment in NimbusPost and updates order shipping_status.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: order_id },
      select: { awb_number: true, shipping_status: true, order_status: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.awb_number) {
      return NextResponse.json(
        { error: "No AWB number found on this order. Cannot cancel a non-existent shipment." },
        { status: 400 }
      );
    }

    const TERMINAL_STATUSES = ["DELIVERED", "CANCELLED"];
    if (TERMINAL_STATUSES.includes(order.order_status as string)) {
      return NextResponse.json(
        { error: `Cannot cancel a shipment for an order with status: ${order.order_status}` },
        { status: 400 }
      );
    }

    const result = await cancelShipment([order.awb_number]);

    // Update order records
    await prisma.order.update({
      where: { id: order_id },
      data: {
        shipping_status: "CANCELLED",
        order_status: "CANCELLED",
      },
    });

    return NextResponse.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error("NIMBUSPOST_CANCEL_ERROR", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to cancel shipment" },
      { status: 500 }
    );
  }
}
