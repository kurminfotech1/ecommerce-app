import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { createShipment } from "@/lib/nimbuspost";

export async function POST(request: Request) {
  try {
    // Verify Razorpay webhook signature
    const razorpaySignature = request.headers.get("x-razorpay-signature") || "";
    
    if (!razorpaySignature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const payload = await request.text();
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    
    // Generate expected signature
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    // Verify signature
    if (expectedSignature !== razorpaySignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Parse payload
    const event = JSON.parse(payload);
    const { event: eventType, payload: eventData } = event;

    console.log(`Razorpay Webhook Event: ${eventType}`);

    // Handle payment captured event
    if (eventType === "payment.captured") {
      const payment = eventData.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;
      const amount = payment.amount / 100; // Convert from paise to rupees

      if (!orderId) {
        return NextResponse.json({ error: "Order ID not found in payment" }, { status: 400 });
      }

      // Find our internal order by Razorpay order ID
      const order = await prisma.order.findFirst({
        where: { razorpay_order_id: orderId },
      });

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      // Update order and payment in a transaction
      await prisma.$transaction(async (tx) => {
        // 1. Update Order
        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: {
            payment_status: "SUCCESS",
            order_status: "CONFIRMED", // Move to CONFIRMED on successful payment
          },
          include: {
            items: {
              include: {
                variant: {
                  include: {
                    product: true
                  }
                }
              }
            }
          }
        });

        // 2. Create/Update Payment record
        await tx.payment.upsert({
          where: { order_id: order.id },
          update: {
            payment_method: "RAZORPAY",
            transaction_id: paymentId,
            amount: amount,
            status: "SUCCESS",
            currency: order.currency || "INR",
          },
          create: {
            order_id: order.id,
            payment_method: "RAZORPAY",
            transaction_id: paymentId,
            amount: amount,
            status: "SUCCESS",
            currency: order.currency || "INR",
          },
        });

        // 3. AUTO-CREATE SHIPMENT if not already created
        if (!updatedOrder.awb_number && updatedOrder.courier_name) {
          try {
            const courierId = 1; // Default courier
            
            const totalWeight = updatedOrder.items.reduce((acc, item) => {
              return acc + parseFloat(item.variant?.weight || "0.5");
            }, 0);
            
            const shipmentData = {
              order_number: updatedOrder.order_number,
              shipping_name: updatedOrder.shipping_name,
              shipping_phone: updatedOrder.shipping_phone,
              shipping_address: updatedOrder.shipping_address,
              shipping_city: updatedOrder.shipping_city,
              shipping_state: updatedOrder.shipping_state,
              shipping_pincode: updatedOrder.shipping_pincode,
              shipping_country: updatedOrder.shipping_country || "India",
              weight: totalWeight,
              total_amount: updatedOrder.total_amount,
              payment_method: "PREPAID" as const,
              courier_id: courierId,
              items: updatedOrder.items.map(item => ({
                name: item.variant?.product?.product_name || "Product",
                qty: item.quantity,
                price: item.price
              }))
            };

            const shipment = await createShipment(shipmentData);
            
            // Update order with AWB and shipment details
            await tx.order.update({
              where: { id: order.id },
              data: {
                awb_number: shipment.awb_number,
                shipment_id: shipment.shipment_id,
                shipping_status: "LABEL_CREATED"
              }
            });
            
            console.log(`Webhook: Shipment created for order ${updatedOrder.order_number}: ${shipment.awb_number}`);
          } catch (shipmentError) {
            console.error("Webhook: Failed to create shipment:", shipmentError);
          }
        }

        return updatedOrder;
      });

      console.log(`Payment verified and order ${order.order_number} confirmed`);
    }

    // Handle payment failed event
    if (eventType === "payment.failed") {
      const payment = eventData.payment.entity;
      const orderId = payment.order_id;

      if (orderId) {
        const order = await prisma.order.findFirst({
          where: { razorpay_order_id: orderId },
        });

        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              payment_status: "FAILED",
            },
          });

          console.log(`Payment failed for order ${order.order_number}`);
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("WEBHOOK_ORDER_PAID_ERROR", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
