import { NextResponse } from "next/server";
import { trackShipment } from "@/lib/nimbuspost";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/shipping/track?order_id=... OR ?awb=...
 * Tracks a shipment from NimbusPost.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id");
    const awbParam = searchParams.get("awb");

    let awbNumber = awbParam;

    if (!awbNumber && orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { awb_number: true },
      });

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      awbNumber = order.awb_number;
    }

    if (!awbNumber) {
      return NextResponse.json(
        { error: "Provide either order_id or awb query parameter" },
        { status: 400 }
      );
    }

    const tracking = await trackShipment(awbNumber);

    // Optionally update shipping_status in DB from live tracking
    if (orderId && tracking.current_status) {
      await prisma.order.update({
        where: { id: orderId },
        data: { shipping_status: tracking.current_status },
      }).catch(() => {}); // non-blocking
    }

    return NextResponse.json({ success: true, data: tracking });
  } catch (error: any) {
    console.error("NIMBUSPOST_TRACK_ERROR", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to track shipment" },
      { status: 500 }
    );
  }
}
