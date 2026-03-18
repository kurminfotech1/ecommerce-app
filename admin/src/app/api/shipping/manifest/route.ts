import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNimbusPostToken } from "@/lib/nimbuspost";

const NIMBUSPOST_BASE_URL = process.env.NIMBUS_BASE_URL;

/**
 * POST /api/shipping/manifest
 * Generate manifest for handover to courier
 * 
 * Body: { date?: string, order_ids?: string[] }
 * - date: YYYY-MM-DD format (defaults to today)
 * - order_ids: Optional array of specific orders to include
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, order_ids } = body;

    // Determine the date range
    let startDate, endDate;
    
    if (date) {
      // Specific date provided
      startDate = new Date(`${date}T00:00:00Z`);
      endDate = new Date(`${date}T23:59:59Z`);
    } else {
      // Default to today
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    }

    // Build query conditions
    const whereClause: any = {
      created_at: {
        gte: startDate,
        lt: endDate,
      },
      awb_number: { not: null },
      shipping_status: {
        in: ["SHIPMENT_CREATED", "MANIFEST_GENERATED"],
      },
    };

    // If specific order IDs provided, filter by them
    if (order_ids && Array.isArray(order_ids) && order_ids.length > 0) {
      whereClause.id = { in: order_ids };
    }

    // Fetch all eligible orders
    const orders = await prisma.order.findMany({
      where: whereClause,
      select: {
        id: true,
        order_number: true,
        awb_number: true,
        shipment_id: true,
        courier_name: true,
        shipping_name: true,
        shipping_phone: true,
        shipping_city: true,
        shipping_state: true,
        shipping_pincode: true,
        total_amount: true,
        payment: {
          select: {
            payment_method: true,
          },
        },
      },
    });

    if (orders.length === 0) {
      return NextResponse.json(
        { 
          error: "No shipments found for manifest generation",
          count: 0,
          message: "All shipments already manifested or no AWBs generated"
        },
        { status: 404 }
      );
    }

    // Prepare manifest data for NimbusPost
    const awbNumbers = orders.map(o => o.awb_number!);
    
    // Generate manifest from NimbusPost
    const manifestData = await generateManifestFromNimbus(awbNumbers);

    // Mark orders as manifested
    await prisma.order.updateMany({
      where: { 
        id: { in: orders.map(o => o.id) },
        awb_number: { in: awbNumbers }
      },
      data: {
        manifest_generated: true,
        shipping_status: "MANIFEST_GENERATED",
      },
    });

    // Create summary
    const summary = {
      total_shipments: orders.length,
      total_cod_amount: orders
        .filter(o => o.payment?.payment_method === "COD")
        .reduce((sum, o) => sum + o.total_amount, 0),
      total_prepaid_amount: orders
        .filter(o => o.payment?.payment_method !== "COD")
        .reduce((sum, o) => sum + o.total_amount, 0),
      courier_wise_count: orders.reduce((acc: any, order) => {
        const courier = order.courier_name || "Unknown";
        acc[courier] = (acc[courier] || 0) + 1;
        return acc;
      }, {}),
    };

    return NextResponse.json({
      success: true,
      data: {
        manifest_url: manifestData.manifest_url,
        manifest_id: manifestData.manifest_id,
        generated_at: new Date().toISOString(),
        date_range: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        shipments: orders.map(o => ({
          order_number: o.order_number,
          awb_number: o.awb_number,
          courier: o.courier_name,
          customer: o.shipping_name,
          city: o.shipping_city,
          pincode: o.shipping_pincode,
          amount: o.total_amount,
          payment_type: o.payment?.payment_method || "PREPAID",
        })),
        summary,
      },
    });
  } catch (error: any) {
    console.error("MANIFEST_GENERATION_ERROR:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to generate manifest" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/shipping/manifest?date=YYYY-MM-DD
 * Get manifest details for a specific date
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || new Date().toISOString().split('T')[0];

    const startDate = new Date(`${date}T00:00:00Z`);
    const endDate = new Date(`${date}T23:59:59Z`);

    // Count manifests for the day
    const manifestedCount = await prisma.order.count({
      where: {
        created_at: {
          gte: startDate,
          lt: endDate,
        },
        manifest_generated: true,
      },
    });

    const pendingCount = await prisma.order.count({
      where: {
        created_at: {
          gte: startDate,
          lt: endDate,
        },
        awb_number: { not: null },
        manifest_generated: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        date,
        manifested_shipments: manifestedCount,
        pending_shipments: pendingCount,
      },
    });
  } catch (error: any) {
    console.error("MANIFEST_FETCH_ERROR:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to fetch manifest details" },
      { status: 500 }
    );
  }
}

/**
 * Generate manifest using NimbusPost API
 */
async function generateManifestFromNimbus(awbNumbers: string[]) {
  const token = await getNimbusPostToken();

  try {
    const res = await fetch(`${NIMBUSPOST_BASE_URL}/shipments/manifest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        awb_numbers: awbNumbers,
      }),
    });

    if (!res.ok) {
      throw new Error(`Manifest API error: ${res.status}`);
    }

    const data = await res.json();

    if (!data.status) {
      throw new Error(data.message ?? "Failed to generate manifest");
    }

    return {
      manifest_url: data.data?.manifest_url ?? data.manifest_url,
      manifest_id: data.data?.manifest_id ?? data.manifest_id,
    };
  } catch (error) {
    console.error("NIMBUS_MANIFEST_ERROR:", error);
    
    // Return mock data if NimbusPost doesn't support manifest API
    return {
      manifest_url: null,
      manifest_id: `MANIFEST-${Date.now()}`,
    };
  }
}
