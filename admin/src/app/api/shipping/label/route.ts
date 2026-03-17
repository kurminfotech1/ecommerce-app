import { NextResponse } from "next/server";
import { generateShippingLabel } from "@/lib/nimbuspost";

/**
 * POST /api/shipping/label
 * Body: { awb_numbers: string[] }
 * Returns the label URL or base64 PDF from NimbusPost.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { awb_numbers } = body;

    if (!awb_numbers || !Array.isArray(awb_numbers) || awb_numbers.length === 0) {
      return NextResponse.json(
        { error: "awb_numbers array is required and must not be empty" },
        { status: 400 }
      );
    }

    const labelData = await generateShippingLabel(awb_numbers);

    return NextResponse.json({ success: true, data: labelData });
  } catch (error: any) {
    console.error("NIMBUSPOST_LABEL_ERROR", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to generate shipping label" },
      { status: 500 }
    );
  }
}
