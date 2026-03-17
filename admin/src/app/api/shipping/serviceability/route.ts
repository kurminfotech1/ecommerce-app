import { NextResponse } from "next/server";
import { getCourierServiceability } from "@/lib/nimbuspost";

/**
 * POST /api/shipping/serviceability
 * Body: { delivery_pincode, weight, cod, order_amount? }
 * Returns array of available couriers with rates and ETD.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { delivery_pincode, weight, cod, order_amount } = body;

    if (!delivery_pincode || !weight) {
      return NextResponse.json(
        { error: "delivery_pincode and weight are required" },
        { status: 400 }
      );
    }

    const storePincode = process.env.STORE_PINCODE;
    if (!storePincode) {
      return NextResponse.json({ error: "Store pincode not configured" }, { status: 500 });
    }

    const couriers = await getCourierServiceability({
      pickup_pincode: storePincode,
      delivery_pincode: String(delivery_pincode),
      weight: parseFloat(weight),
      cod: cod ? 1 : 0,
      order_amount: order_amount ? parseFloat(order_amount) : undefined,
    });

    return NextResponse.json({ success: true, data: couriers });
  } catch (error: any) {
    console.error("NIMBUSPOST_SERVICEABILITY_ERROR", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to fetch courier options" },
      { status: 500 }
    );
  }
}
