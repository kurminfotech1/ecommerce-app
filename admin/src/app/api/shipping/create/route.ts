import { NextResponse } from "next/server";
import { createShipment } from "@/lib/nimbuspost";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/shipping/create
 * Body: { order_id, courier_id, weight? }
 * Creates a shipment in NimbusPost and updates the order with AWB details.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id, courier_id, weight } = body;

    if (!order_id || !courier_id) {
      return NextResponse.json(
        { error: "order_id and courier_id are required" },
        { status: 400 }
      );
    }

    // Fetch the full order with items
    const order = await prisma.order.findUnique({
      where: { id: order_id },
      include: {
        items: {
          include: {
            variant: { include: { product: true } },
          },
        },
        payment: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.awb_number) {
      return NextResponse.json(
        { error: "Shipment already created for this order", awb_number: order.awb_number },
        { status: 409 }
      );
    }

    // Determine payment type
    const paymentMethod =
      order.payment?.payment_method === "COD" ? "COD" : "PREPAID";

    // Calculate weight: use provided weight or sum from items (in kg)
    const totalWeight =
      weight ??
      (order.items.reduce((acc, item) => {
        const w = parseFloat(item.variant?.weight ?? item.weight ?? "0.5");
        return acc + w * item.quantity;
      }, 0) || 0.5);

    // Build shipment
    const result = await createShipment({
      order_number: order.order_number,
      shipping_name: order.shipping_name,
      shipping_phone: order.shipping_phone,
      shipping_address: order.shipping_address,
      shipping_city: order.shipping_city,
      shipping_state: order.shipping_state,
      shipping_pincode: order.shipping_pincode,
      shipping_country: order.shipping_country,
      weight: totalWeight,
      total_amount: order.total_amount,
      payment_method: paymentMethod,
      courier_id: Number(courier_id),
      items: order.items.map((item) => ({
        name:
          item.variant?.product?.product_name ??
          item.product_name ??
          "Product",
        qty: item.quantity,
        price: item.price,
      })),
    });

    // Update order record with shipping details
    const updatedOrder = await prisma.order.update({
      where: { id: order_id },
      data: {
        awb_number: result.awb_number,
        shipment_id: result.shipment_id,
        courier_name: result.courier_name,
        tracking_url: result.tracking_url,
        shipping_status: "SHIPMENT_CREATED",
        order_status: "PROCESSING",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        awb_number: result.awb_number,
        shipment_id: result.shipment_id,
        courier_name: result.courier_name,
        tracking_url: result.tracking_url,
        order: updatedOrder,
      },
    });
  } catch (error: any) {
    console.error("NIMBUSPOST_CREATE_SHIPMENT_ERROR", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to create shipment" },
      { status: 500 }
    );
  }
}
