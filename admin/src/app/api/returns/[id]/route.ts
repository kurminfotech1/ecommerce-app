import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// PATCH: Update return request status (Admin only)
export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json({ error: "Return status is required" }, { status: 400 });
        }

        const updatedReturn = await prisma.returnRequest.update({
            where: { id },
            data: { status }
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

// GET: Details for a specific return request
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
                            include: {
                                variant: {
                                    include: {
                                        product: true
                                    }
                                }
                            }
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
