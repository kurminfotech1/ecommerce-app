import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    // Supabase webhook payload structure usually has 'record' and 'old_record'
    // Depending on how you configure it, but let's assume it sends the order data
    const orderData = payload.record || payload;
    const { id: order_id, user_id, total_amount, currency, payment_status } = orderData;

    // Validate request (Add a secret header check for security if needed)
    // For example: if (request.headers.get('x-webhook-secret') !== process.env.WEBHOOK_SECRET) ...

    if (payment_status !== 'SUCCESS') {
      return NextResponse.json({ message: "Not a success event" }, { status: 200 });
    }

    console.log(`Processing automation for Order ID: ${order_id}`);

    // Trigger Business Logic:
    // 1. Update Inventory (Already done in order creation API in this project?)
    //    Wait, checking orders/route.ts, it updates stock when order is created (PLACED).
    //    If we only want to update stock after payment, we should move that logic here.
    //    However, usually stock is reserved/decremented at placement to avoid overselling.
    
    // 2. Send order confirmation email
    //    (Already partially done in orders/route.ts, but maybe we want a "Payment Success" email)
    
    // 3. Notify Admin Panel
    //    (Can use real-time or just logs)
    
    // 4. Generate Invoice (Mocked here)
    console.log(`Generating invoice for order ${order_id}...`);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("WEBHOOK_ORDER_PAID_ERROR", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
