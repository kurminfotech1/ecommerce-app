import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: Get all stock logs (Admin only ideally)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const variantId = searchParams.get("variantId");

        const logs = await prisma.stockLog.findMany({
            where: variantId ? { variant_id: variantId } : {},
            include: {
                variant: {
                    include: {
                        product: {
                            select: {
                                product_name: true
                            }
                        }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        return NextResponse.json(logs, { status: 200 });
    } catch (error: any) {
        console.error("GET_STOCK_LOGS_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
