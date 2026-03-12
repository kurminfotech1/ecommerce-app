import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { checkApiPermission } from "@/lib/utils/apiPermission";

const MODULE = "Customers";

/**
 * GET: Get all cust
 * 
 * 
 * 
 * 
 
 
 omers with filters and pagination
 * Filters: search (name, email, phone), is_verified, date range
 */
export async function GET(request: Request) {
    try {
        const { error } = await checkApiPermission(MODULE, "canRead");
        if (error) return error;

        const { searchParams } = new URL(request.url);

        const search = searchParams.get("search")?.trim() ?? "";
        const isVerified = searchParams.get("is_verified");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const page = Math.max(1, Number(searchParams.get("page") || 1));
        const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 20)));
        const skip = (page - 1) * limit;

        const where: any = {};

        // Search by name, email, or phone
        if (search) {
            where.OR = [
                { full_name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
            ];
        }

        // Filter by verification status
        if (isVerified !== null && isVerified !== "" && isVerified !== "all") {
            where.is_verified = isVerified === "true";
        }

        // Filter by registration date
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                where.createdAt.gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }

        const [total, customers] = await Promise.all([
            prisma.user.count({ where }),
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    full_name: true,
                    email: true,
                    phone: true,
                    is_verified: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            orders: true,
                            reviews: true,
                        },
                    },
                },
            }),
        ]);

        return NextResponse.json({
            data: customers,
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        }, { status: 200 });

    } catch (error: any) {
        console.error("GET_CUSTOMERS_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
