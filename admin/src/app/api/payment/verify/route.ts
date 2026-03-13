import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      internal_order_id,
    } = body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !internal_order_id) {
      return NextResponse.json({ error: "Missing verification data" }, { status: 400 });
    }

    // Verify signature
    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(text)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Update order and payment tables in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update Order status
      const order = await tx.order.update({
        where: { id: internal_order_id },
        data: {
          payment_status: "SUCCESS",
          order_status: "PLACED", // Or CONFIRMED
        },
      });

      // 2. Create/Update Payment record
      await tx.payment.upsert({
        where: { order_id: internal_order_id },
        update: {
          razorpay_payment_id,
          razorpay_order_id,
          status: "SUCCESS",
          amount: order.total_amount,
          currency: order.currency,
        },
        create: {
          order_id: internal_order_id,
          payment_method: "RAZORPAY",
          razorpay_payment_id,
          razorpay_order_id,
          amount: order.total_amount,
          currency: order.currency,
          status: "SUCCESS",
        },
      });
    });

    return NextResponse.json({ success: true, message: "Payment verified successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("VERIFY_PAYMENT_ERROR", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
