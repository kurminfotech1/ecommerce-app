import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { checkApiPermission } from "@/lib/utils/apiPermission";

const MODULE = "Returns";

// PATCH: Update return request status — requires canUpdate
export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { error } = await checkApiPermission(MODULE, "canUpdate");
        if (error) return error;

        const { id } = await context.params;
        const body = await request.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json({ error: "Return status is required" }, { status: 400 });
        }

        const updatedReturn = await prisma.$transaction(async (tx) => {
            const currentReturn = await tx.returnRequest.findUnique({
                where: { id },
                include: { order: { include: { items: true } } }
            });

            if (!currentReturn) throw new Error("Return request not found");

            // Only restock if moving TO completed and it wasn't already completed
            if (status === "COMPLETED" && currentReturn.status !== "COMPLETED") {
                for (const item of currentReturn.order.items) {
                    await tx.productVariant.update({
                        where: { id: item.variant_id },
                        data: { stock: { increment: item.quantity } }
                    });
                    await tx.stockLog.create({
                        data: {
                            variant_id: item.variant_id,
                            change: item.quantity,
                            reason: `Order Return: ${currentReturn.order.order_number}`
                        }
                    });
                }
            }

            return await tx.returnRequest.update({ where: { id }, data: { status } });
        });

        return NextResponse.json(updatedReturn, { status: 200 });
    } catch (error: any) {
        console.error("PATCH_RETURN_STATUS_ERROR", error);
        if (error.code === 'P2025') {
            return NextResponse.json({ error: "Return request not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// GET: Details for a specific return request — public read
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        const returnRequest = await prisma.returnRequest.findUnique({
            where: { id },
            include: {
                order: {
                    include: {
                        items: {
                            include: { variant: { include: { product: true } } }
                        }
                    }
                },
                user: true
            }
        });

        if (!returnRequest) {
            return NextResponse.json({ error: "Return request not found" }, { status: 404 });
        }

        return NextResponse.json(returnRequest, { status: 200 });
    } catch (error: any) {
        console.error("GET_RETURN_DETAIL_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
