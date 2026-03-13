import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, currency, internal_order_id, customer_name, customer_email } = body;

    if (!amount || !currency || !internal_order_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Razorpay expects amount in paise (multiply by 100)
    const options = {
      amount: Math.round(amount * 100),
      currency: currency,
      receipt: internal_order_id,
      notes: {
        customer_name,
        customer_email,
      },
    };

    const order = await razorpay.orders.create(options);

    // Update the order in our database with the Razorpay Order ID
    await prisma.order.update({
      where: { id: internal_order_id },
      data: {
        razorpay_order_id: order.id,
        currency: currency,
      },
    });

    return NextResponse.json({
      razorpay_order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      razorpay_key: process.env.RAZORPAY_KEY_ID,
    }, { status: 200 });
  } catch (error: any) {
    console.error("CREATE_RAZORPAY_ORDER_ERROR", error);
    return NextResponse.json({ error: "Failed to create Razorpay order" }, { status: 500 });
  }
}
