import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateShippingLabel, schedulePickup } from "@/lib/nimbuspost";

/**
 * POST /api/shipping/bulk/label
 * Generate shipping labels for multiple orders at once
 * 
 * Body: { order_ids: string[] }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_ids } = body;

    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      return NextResponse.json(
        { error: "order_ids array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Fetch all orders with AWB numbers
    const orders = await prisma.order.findMany({
      where: {
        id: { in: order_ids },
        awb_number: { not: null },
      },
      select: {
        id: true,
        order_number: true,
        awb_number: true,
        courier_name: true,
        shipping_name: true,
        shipping_city: true,
      },
    });

    if (orders.length !== order_ids.length) {
      const foundIds = orders.map(o => o.id);
      const missingIds = order_ids.filter(id => !foundIds.includes(id));
      
      console.warn("Some orders not found or don't have AWB:", missingIds);
    }

    if (orders.length === 0) {
      return NextResponse.json(
        { error: "No valid orders found with AWB numbers" },
        { status: 404 }
      );
    }

    const awbNumbers = orders.map(o => o.awb_number!);

    // Generate combined label from NimbusPost
    const labelData = await generateShippingLabel(awbNumbers);

    return NextResponse.json({
      success: true,
      data: {
        label_url: labelData,
        total_labels: awbNumbers.length,
        orders: orders.map(o => ({
          order_number: o.order_number,
          awb_number: o.awb_number,
          courier: o.courier_name,
          customer: o.shipping_name,
          city: o.shipping_city,
        })),
      },
    });
  } catch (error: any) {
    console.error("BULK_LABEL_ERROR:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to generate bulk labels" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shipping/bulk/pickup
 * Schedule pickup for multiple orders at once
 * 
 * Body: { order_ids: string[], pickup_date?: string (YYYY-MM-DD) }
 */
export async function DELETE(request: Request) {
  // This handles cancellation of bulk pickup if needed
  try {
    const body = await request.json();
    const { order_ids } = body;

    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      return NextResponse.json(
        { error: "order_ids array is required" },
        { status: 400 }
      );
    }

    // Fetch orders to get AWB numbers
    const orders = await prisma.order.findMany({
      where: {
        id: { in: order_ids },
        awb_number: { not: null },
        shipping_status: {
          notIn: ["PICKUP_SCHEDULED", "CANCELLED"],
        },
      },
      select: {
        id: true,
        awb_number: true,
        order_number: true,
      },
    });

    if (orders.length === 0) {
      return NextResponse.json(
        { error: "No eligible orders found for pickup scheduling" },
        { status: 404 }
      );
    }

    const awbNumbers = orders.map(o => o.awb_number!);

    // Schedule pickup with NimbusPost
    const result = await schedulePickup({
      awb_numbers: awbNumbers,
      pickup_date: body.pickup_date,
    });

    // Update all orders
    await prisma.order.updateMany({
      where: {
        id: { in: order_ids },
        awb_number: { in: awbNumbers },
      },
      data: {
        shipping_status: "PICKUP_SCHEDULED",
      },
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        scheduled_count: orders.length,
        orders: orders.map(o => ({
          order_number: o.order_number,
          awb_number: o.awb_number,
        })),
      },
    });
  } catch (error: any) {
    console.error("BULK_PICKUP_ERROR:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to schedule bulk pickup" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/shipping/bulk/stats
 * Get statistics for bulk operations
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || new Date().toISOString().split('T')[0];

    const startDate = new Date(`${date}T00:00:00Z`);
    const endDate = new Date(`${date}T23:59:59Z`);

    // Count shipments by status
    const [totalWithAWB, manifested, pickupScheduled, pending] = await Promise.all([
      prisma.order.count({
        where: {
          created_at: { gte: startDate, lt: endDate },
          awb_number: { not: null },
        },
      }),
      prisma.order.count({
        where: {
          created_at: { gte: startDate, lt: endDate },
          manifest_generated: true,
        },
      }),
      prisma.order.count({
        where: {
          created_at: { gte: startDate, lt: endDate },
          shipping_status: "PICKUP_SCHEDULED",
        },
      }),
      prisma.order.count({
        where: {
          created_at: { gte: startDate, lt: endDate },
          awb_number: { not: null },
          manifest_generated: false,
          shipping_status: { notIn: ["PICKUP_SCHEDULED", "CANCELLED"] },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        date,
        summary: {
          total_with_awb: totalWithAWB,
          manifested: manifested,
          pickup_scheduled: pickupScheduled,
          pending_pickup: pending,
        },
      },
    });
  } catch (error: any) {
    console.error("BULK_STATS_ERROR:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to fetch bulk statistics" },
      { status: 500 }
    );
  }
}
