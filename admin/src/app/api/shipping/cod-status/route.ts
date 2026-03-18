import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNimbusPostToken } from "@/lib/nimbuspost";

const NIMBUSPOST_BASE_URL = process.env.NIMBUS_BASE_URL;

/**
 * GET /api/shipping/cod-status?awb=... OR ?order_id=...
 * Fetches COD collection status from NimbusPost
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const awbParam = searchParams.get("awb");
    const orderId = searchParams.get("order_id");

    let awbNumber = awbParam;

    // If AWB not provided, fetch from order_id
    if (!awbNumber && orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { awb_number: true, id: true, order_number: true },
      });

      if (!order?.awb_number) {
        return NextResponse.json(
          { error: "Order not found or no AWB number" },
          { status: 404 }
        );
      }

      awbNumber = order.awb_number;
    }

    if (!awbNumber) {
      return NextResponse.json(
        { error: "Provide either 'awb' or 'order_id' query parameter" },
        { status: 400 }
      );
    }

    // Fetch COD status from NimbusPost
    const codData = await fetchCODStatusFromNimbus(awbNumber);

    // Find order by AWB number first
    const orderToUpdate = await prisma.order.findFirst({
      where: { awb_number: awbNumber },
    });

    if (!orderToUpdate) {
      return NextResponse.json(
        { error: "Order not found for this AWB number" },
        { status: 404 }
      );
    }

    // Update local database with COD status
    const updatedOrder = await prisma.order.update({
      where: { id: orderToUpdate.id },
      data: {
        cod_amount: codData.cod_amount,
        cod_status: codData.cod_status,
        cod_remitted_date: codData.cod_remitted_date ? new Date(codData.cod_remitted_date) : null,
        cod_tracking_id: codData.cod_tracking_id,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        awb_number: awbNumber,
        order_number: updatedOrder.order_number,
        cod_amount: codData.cod_amount,
        cod_status: codData.cod_status,
        cod_collected_date: codData.cod_collected_date,
        cod_remitted_date: codData.cod_remitted_date,
        expected_credit_date: codData.expected_credit_date,
        bank_reference: codData.bank_reference,
      },
    });
  } catch (error: any) {
    console.error("COD_STATUS_ERROR:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to fetch COD status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shipping/cod-status
 * Manually update COD status (for admin corrections)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id, cod_status, cod_amount, bank_reference } = body;

    if (!order_id) {
      return NextResponse.json(
        { error: "order_id is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (cod_status) updateData.cod_status = cod_status;
    if (cod_amount) updateData.cod_amount = cod_amount;
    if (bank_reference) updateData.cod_tracking_id = bank_reference;

    if (cod_status === "REMITTED") {
      updateData.cod_remitted_date = new Date();
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order_id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        order_id: updatedOrder.id,
        order_number: updatedOrder.order_number,
        cod_status: updatedOrder.cod_status,
        cod_amount: updatedOrder.cod_amount,
      },
    });
  } catch (error: any) {
    console.error("COD_UPDATE_ERROR:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to update COD status" },
      { status: 500 }
    );
  }
}

/**
 * Fetch COD status from NimbusPost API
 */
async function fetchCODStatusFromNimbus(awbNumber: string) {
  const token = await getNimbusPostToken();

  try {
    const res = await fetch(`${NIMBUSPOST_BASE_URL}/shipments/cod-status/${awbNumber}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      // If NimbusPost doesn't have this endpoint, return default values
      console.warn("COD status endpoint not available on NimbusPost");
      return {
        cod_amount: 0,
        cod_status: "PENDING",
        cod_collected_date: null,
        cod_remitted_date: null,
        expected_credit_date: null,
        bank_reference: null,
        cod_tracking_id: null,
      };
    }

    const data = await res.json();

    if (!data.status) {
      throw new Error(data.message ?? "Failed to fetch COD status");
    }

    const codInfo = data.data ?? {};

    return {
      cod_amount: parseFloat(codInfo.cod_amount || codInfo.amount || 0),
      cod_status: mapCODStatus(codInfo.status),
      cod_collected_date: codInfo.collected_date || codInfo.pickup_date,
      cod_remitted_date: codInfo.remitted_date || codInfo.credit_date,
      expected_credit_date: codInfo.expected_credit_date,
      bank_reference: codInfo.bank_reference || codInfo.transaction_id,
      cod_tracking_id: codInfo.tracking_id,
    };
  } catch (error) {
    console.error("NIMBUS_COD_FETCH_ERROR:", error);
    
    // Return default values if API fails
    return {
      cod_amount: 0,
      cod_status: "PENDING",
      cod_collected_date: null,
      cod_remitted_date: null,
      expected_credit_date: null,
      bank_reference: null,
      cod_tracking_id: null,
    };
  }
}

/**
 * Map NimbusPost COD status to internal status
 */
function mapCODStatus(status: string): string {
  const statusMap: Record<string, string> = {
    "pending": "PENDING",
    "collected": "COLLECTED",
    "in_transit": "IN_TRANSIT",
    "remitted": "REMITTED",
    "credited": "REMITTED",
    "failed": "FAILED",
  };

  return statusMap[status.toLowerCase()] || "PENDING";
}
