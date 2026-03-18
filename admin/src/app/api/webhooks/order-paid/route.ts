import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";

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
        await tx.order.update({
          where: { id: order.id },
          data: {
            payment_status: "SUCCESS",
            order_status: "CONFIRMED", // Move to CONFIRMED on successful payment
          },
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
