import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: List return requests (optionally by userId or orderId)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const orderId = searchParams.get("orderId");

        const returns = await prisma.returnRequest.findMany({
            where: {
                ...(userId ? { user_id: userId } : {}),
                ...(orderId ? { order_id: orderId } : {})
            },
            include: {
                order: true,
                user: {
                    select: {
                        full_name: true,
                        email: true
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        return NextResponse.json(returns, { status: 200 });
    } catch (error: any) {
        console.error("GET_RETURNS_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Create a new return request
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { order_id, user_id, reason } = body;

        if (!order_id || !user_id || !reason) {
            return NextResponse.json({ error: "Missing required return information" }, { status: 400 });
        }

        // Optional: Check if order exists and belongs to user
        const order = await prisma.order.findUnique({ where: { id: order_id } });
        if (!order || order.user_id !== user_id) {
            return NextResponse.json({ error: "Invalid order for this user" }, { status: 403 });
        }

        const returnRequest = await prisma.returnRequest.create({
            data: {
                order_id,
                user_id,
                reason,
                status: "REQUESTED"
            }
        });

        return NextResponse.json(returnRequest, { status: 201 });
    } catch (error: any) {
        console.error("POST_RETURN_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
