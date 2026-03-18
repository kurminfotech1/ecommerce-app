import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { createShipment } from "@/lib/nimbuspost";

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

      // 3. AUTO-CREATE SHIPMENT if not already created during order placement
      if (!order.awb_number && order.courier_name) {
        try {
          const courierId = 1; // Default courier - adjust based on your setup
          
          const totalWeight = order.items.reduce((acc, item) => {
            return acc + parseFloat(item.variant?.weight || "0.5");
          }, 0);
          
          const shipmentData = {
            order_number: order.order_number,
            shipping_name: order.shipping_name,
            shipping_phone: order.shipping_phone,
            shipping_address: order.shipping_address,
            shipping_city: order.shipping_city,
            shipping_state: order.shipping_state,
            shipping_pincode: order.shipping_pincode,
            shipping_country: order.shipping_country || "India",
            weight: totalWeight,
            total_amount: order.total_amount,
            payment_method: "PREPAID" as const, // Since payment is already done
            courier_id: courierId,
            items: order.items.map(item => ({
              name: item.variant?.product?.product_name || "Product",
              qty: item.quantity,
              price: item.price
            }))
          };

          const shipment = await createShipment(shipmentData);
          
          // Update order with AWB and shipment details
          await tx.order.update({
            where: { id: internal_order_id },
            data: {
              awb_number: shipment.awb_number,
              shipment_id: shipment.shipment_id,
              shipping_status: "LABEL_CREATED"
            }
          });
          
          console.log(`Shipment created for Razorpay order ${order.order_number}: ${shipment.awb_number}`);
        } catch (shipmentError) {
          console.error("Failed to create shipment after Razorpay payment:", shipmentError);
          // Continue anyway - shipment can be created manually later
        }
      }
    });

    return NextResponse.json({ success: true, message: "Payment verified successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("VERIFY_PAYMENT_ERROR", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
