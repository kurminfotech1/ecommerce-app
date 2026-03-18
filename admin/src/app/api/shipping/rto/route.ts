import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cancelShipment, trackShipment } from "@/lib/nimbuspost";

/**
 * POST /api/shipping/rto
 * Initiate or manage RTO (Return to Origin)
 * 
 * Body: { order_id, rto_reason?: string, action?: string }
 * Actions: INITIATE, TRACK, CANCEL
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id, rto_reason, action = "INITIATE" } = body;

    if (!order_id) {
      return NextResponse.json(
        { error: "order_id is required" },
        { status: 400 }
      );
    }

    // Fetch the order
    const order = await prisma.order.findUnique({
      where: { id: order_id },
      include: {
        items: {
          include: {
            variant: { include: { product: true } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.awb_number) {
      return NextResponse.json(
        { error: "No AWB number found. Cannot initiate RTO without shipment." },
        { status: 400 }
      );
    }

    // Check if already delivered
    if (order.order_status === "DELIVERED") {
      return NextResponse.json(
        { error: "Cannot initiate RTO for delivered orders" },
        { status: 400 }
      );
    }

    // Check if RTO already initiated (using shipping_status)
    if (order.shipping_status?.includes("RTO")) {
      return NextResponse.json(
        { error: "RTO already initiated for this order" },
        { status: 409 }
      );
    }

    switch (action) {
      case "INITIATE":
        return handleRTOInitiation(order, rto_reason);
      
      case "TRACK":
        return handleRTOTracking(order);
      
      case "CANCEL":
        return handleRTOCancellation(order);
      
      default:
        return NextResponse.json(
          { error: "Invalid action. Use: INITIATE, TRACK, or CANCEL" },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("RTO_MANAGEMENT_ERROR:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to process RTO request" },
      { status: 500 }
    );
  }
}

/**
 * Handle RTO initiation
 */
async function handleRTOInitiation(order: any, reason?: string) {
  // Valid RTO reasons
  const validReasons = [
    "CUSTOMER_NOT_AVAILABLE",
    "WRONG_ADDRESS",
    "CUSTOMER_REFUSED",
    "PHONE_UNREACHABLE",
    "DOOR_LOCKED",
    "SECURITY_ISSUE",
    "AREA_RESTRICTED",
    "OTHER",
  ];

  const rtoReason = reason || "OTHER";
  
  if (!validReasons.includes(rtoReason)) {
    return NextResponse.json(
      { 
        error: "Invalid RTO reason",
        valid_reasons: validReasons 
      },
      { status: 400 }
    );
  }

  // Cancel shipment in NimbusPost
  try {
    await cancelShipment([order.awb_number!]);
  } catch (error) {
    console.error("Failed to cancel shipment in NimbusPost:", error);
    // Continue anyway - we still want to update local DB
  }

  // Update order with RTO status
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      shipping_status: "RTO_INITIATED",
      order_status: "PROCESSING",
      rto_reason: rtoReason,
      rto_initiated_at: new Date(),
    },
  });

  console.log(`🔄 RTO initiated for order ${order.order_number}`);

  return NextResponse.json({
    success: true,
    message: "RTO initiated successfully",
    data: {
      order_id: updatedOrder.id,
      order_number: updatedOrder.order_number,
      awb_number: updatedOrder.awb_number,
      rto_reason: rtoReason,
      rto_initiated_at: new Date(),
      expected_return_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });
}

/**
 * Handle RTO tracking
 */
async function handleRTOTracking(order: any) {
  try {
    const trackingData = await trackShipment(order.awb_number!);

    // Check if RTO is in progress
    const isRTO = trackingData.current_status.includes("RTO") ||
                  trackingData.current_status.includes("RETURN");

    if (!isRTO) {
      return NextResponse.json(
        { 
          error: "Shipment is not in RTO status",
          current_status: trackingData.current_status 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        awb_number: order.awb_number,
        current_status: trackingData.current_status,
        tracking_events: trackingData.tracking_events,
        rto_reason: order.rto_reason,
        rto_initiated_at: order.rto_initiated_at,
      },
    });
  } catch (error: any) {
    throw new Error(`Failed to track RTO: ${error.message}`);
  }
}

/**
 * Handle RTO cancellation (convert back to normal shipment)
 */
async function handleRTOCancellation(order: any) {
  if (order.shipping_status !== "RTO_INITIATED") {
    return NextResponse.json(
      { error: "Order is not in RTO status" },
      { status: 400 }
    );
  }

  // Update order back to processing
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      shipping_status: "SHIPMENT_CREATED",
      order_status: "PROCESSING",
      rto_reason: null,
      rto_initiated_at: null,
    },
  });

  console.log(`✅ RTO cancelled for order ${order.order_number}`);

  return NextResponse.json({
    success: true,
    message: "RTO cancelled - shipment will proceed normally",
    data: {
      order_id: updatedOrder.id,
      order_number: updatedOrder.order_number,
      current_status: updatedOrder.shipping_status,
    },
  });
}

/**
 * GET /api/shipping/rto/stats
 * Get RTO statistics and analytics
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get all orders and filter manually for RTO
    const allOrders = await prisma.order.findMany({
      where: {
        created_at: { gte: startDate },
      },
      select: {
        id: true,
        order_number: true,
        total_amount: true,
        shipping_status: true,
        courier_name: true,
        shipping_city: true,
      },
    });

    // Filter RTO orders manually
    const rtoOrders = allOrders.filter(o => o.shipping_status?.includes("RTO"));

    // Calculate statistics
    const totalRTO = rtoOrders.length;
    const totalRTOAmount = rtoOrders.reduce((sum, o) => sum + o.total_amount, 0);

    // Reason-wise breakdown (we'll store this in a comment for now)
    const reasonBreakdown: Record<string, number> = {};

    // Courier-wise breakdown
    const courierBreakdown = rtoOrders.reduce((acc: any, order) => {
      const courier = order.courier_name || "Unknown";
      acc[courier] = (acc[courier] || 0) + 1;
      return acc;
    }, {});

    // Total orders in period (for RTO rate calculation)
    const totalOrders = allOrders.length;

    const rtoRate = totalOrders > 0 ? ((totalRTO / totalOrders) * 100).toFixed(2) : "0";

    return NextResponse.json({
      success: true,
      data: {
        period_days: days,
        total_orders: totalOrders,
        rto_count: totalRTO,
        rto_amount: totalRTOAmount,
        rto_rate_percentage: `${rtoRate}%`,
        courier_breakdown: courierBreakdown,
        recent_rto_orders: rtoOrders.slice(0, 10),
      },
    });
  } catch (error: any) {
    console.error("RTO_STATS_ERROR:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to fetch RTO statistics" },
      { status: 500 }
    );
  }
}
