import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: List return requests
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        
        // 1. Pagination Params
        const page = Math.max(1, Number(searchParams.get("page") || 1));
        const limit = Math.max(1, Number(searchParams.get("limit") || 10));
        const skip = (page - 1) * limit;

        // 2. Filter Params
        const search = searchParams.get("search")?.trim() || "";
        const status = searchParams.get("status");

        const whereClause: any = {
            ...(status ? { status } : {}),
            ...(search ? {
                OR: [
                    { reason: { contains: search, mode: "insensitive" } },
                    { order: { order_number: { contains: search, mode: "insensitive" } } },
                    { user: { full_name: { contains: search, mode: "insensitive" } } },
                ]
            } : {})
        };

        const [totalRecords, returns] = await Promise.all([
            prisma.returnRequest.count({ where: whereClause }),
            prisma.returnRequest.findMany({
                where: whereClause,
                include: {
                    order: true,
                    user: {
                        select: {
                            full_name: true,
                            email: true
                        }
                    }
                },
                orderBy: { created_at: 'desc' },
                skip,
                take: limit,
            })
        ]);

        return NextResponse.json({
            data: returns,
            totalRecords,
            totalPages: Math.ceil(totalRecords / limit),
            currentPage: page
        }, { status: 200 });

    } catch (error: any) {
        console.error("GET_RETURNS_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE: Delete a return request
import { checkApiPermission } from "@/lib/utils/apiPermission";
const MODULE = "Returns";

export async function DELETE(
    request: Request
) {
    try {
        const { error } = await checkApiPermission(MODULE, "canDelete");
        if (error) return error;

        // Try getting id from URL path string /api/returns/[id] or from searchParams /api/returns?id=
        const urlObj = new URL(request.url);
        const urlParts = urlObj.pathname.split('/');
        const idFromPath = urlParts[urlParts.length - 1] === 'returns' ? null : urlParts[urlParts.length - 1];
        
        const id = idFromPath || urlObj.searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Return Request ID is required" }, { status: 400 });
        }

        await prisma.returnRequest.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: "Deleted successfully" }, { status: 200 });
    } catch (err: any) {
        console.error("DELETE_RETURN_ERROR", err);
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
