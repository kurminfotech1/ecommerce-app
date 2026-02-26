import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: Filter payments by orderId or status
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get("orderId");
        const status = searchParams.get("status");

        const payments = await prisma.payment.findMany({
            where: {
                ...(orderId ? { order_id: orderId } : {}),
                ...(status ? { status: status as any } : {})
            },
            include: {
                order: {
                    select: {
                        order_number: true,
                        total_amount: true,
                        user: {
                            select: {
                                full_name: true,
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        return NextResponse.json(payments, { status: 200 });
    } catch (error: any) {
        console.error("GET_PAYMENTS_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Register a new payment (or update existing one)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { order_id, payment_method, transaction_id, amount, status = "PAID" } = body;

        if (!order_id || !payment_method || !transaction_id || !amount) {
            return NextResponse.json({ error: "Missing required payment information" }, { status: 400 });
        }

        const payment = await prisma.payment.upsert({
            where: { order_id },
            update: {
                payment_method,
                transaction_id,
                amount,
                status
            },
            create: {
                order_id,
                payment_method,
                transaction_id,
                amount,
                status
            }
        });

        return NextResponse.json(payment, { status: 201 });
    } catch (error: any) {
        console.error("POST_PAYMENT_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
