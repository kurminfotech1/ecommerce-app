import { NextResponse } from "next/server";
import { schedulePickup } from "@/lib/nimbuspost";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/shipping/pickup
 * Body: { order_id, pickup_date? (YYYY-MM-DD) }
 * Schedules a courier pickup with NimbusPost.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id, pickup_date } = body;

    if (!order_id) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: order_id },
      select: { awb_number: true, shipping_status: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.awb_number) {
      return NextResponse.json(
        { error: "No AWB number found. Please create a shipment first." },
        { status: 400 }
      );
    }

    const result = await schedulePickup({
      awb_numbers: [order.awb_number],
      pickup_date: pickup_date ?? undefined,
    });

    // Update shipping status in DB
    await prisma.order.update({
      where: { id: order_id },
      data: { shipping_status: "PICKUP_SCHEDULED", order_status: "PROCESSING" },
    });

    return NextResponse.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error("NIMBUSPOST_PICKUP_ERROR", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to schedule pickup" },
      { status: 500 }
    );
  }
}
