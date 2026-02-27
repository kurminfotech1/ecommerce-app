import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-indexed
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const firstDayOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
        const lastDayOfLastMonth = new Date(currentYear, currentMonth, 0);

        // ─── 1. Total Customers ────────────────────────────────────────────────
        const totalCustomers = await prisma.user.count();
        const lastMonthCustomers = await prisma.user.count({
            where: { createdAt: { lt: firstDayOfMonth } },
        });
        const newCustomersThisMonth = totalCustomers - lastMonthCustomers;
        const customerGrowth =
            lastMonthCustomers > 0
                ? ((newCustomersThisMonth / lastMonthCustomers) * 100).toFixed(2)
                : "0";

        // ─── 2. Total Orders ───────────────────────────────────────────────────
        const totalOrders = await prisma.order.count();
        const lastMonthOrders = await prisma.order.count({
            where: { created_at: { lt: firstDayOfMonth } },
        });
        const newOrdersThisMonth = totalOrders - lastMonthOrders;
        const orderGrowth =
            lastMonthOrders > 0
                ? ((newOrdersThisMonth / lastMonthOrders) * 100).toFixed(2)
                : "0";

        // ─── 3. Monthly Sales (per month of current year) ─────────────────────
        const monthlySales: number[] = [];
        const monthlyRevenue: number[] = [];
        for (let m = 0; m < 12; m++) {
            const start = new Date(currentYear, m, 1);
            const end = new Date(currentYear, m + 1, 0, 23, 59, 59);
            const orders = await prisma.order.findMany({
                where: {
                    created_at: { gte: start, lte: end },
                    order_status: { not: "CANCELLED" },
                },
                select: { total_amount: true },
            });
            const revenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
            monthlySales.push(orders.length);
            monthlyRevenue.push(Math.round(revenue));
        }

        // ─── 4. Monthly Target ─────────────────────────────────────────────────
        // Target = last month's revenue * 1.1 (10% growth goal)
        const lastMonthOrdersData = await prisma.order.findMany({
            where: {
                created_at: { gte: firstDayOfLastMonth, lte: lastDayOfLastMonth },
                order_status: { not: "CANCELLED" },
            },
            select: { total_amount: true },
        });
        const lastMonthRevenue = lastMonthOrdersData.reduce(
            (sum, o) => sum + o.total_amount,
            0
        );
        const thisMonthTarget = Math.round(lastMonthRevenue * 1.1) || 20000;

        const thisMonthOrdersData = await prisma.order.findMany({
            where: {
                created_at: { gte: firstDayOfMonth },
                order_status: { not: "CANCELLED" },
            },
            select: { total_amount: true },
        });
        const thisMonthRevenue = thisMonthOrdersData.reduce(
            (sum, o) => sum + o.total_amount,
            0
        );
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayOrdersData = await prisma.order.findMany({
            where: {
                created_at: { gte: todayStart },
                order_status: { not: "CANCELLED" },
            },
            select: { total_amount: true },
        });
        const todayRevenue = todayOrdersData.reduce(
            (sum, o) => sum + o.total_amount,
            0
        );

        const targetProgress =
            thisMonthTarget > 0
                ? Math.min(
                    100,
                    Math.round((thisMonthRevenue / thisMonthTarget) * 100)
                )
                : 0;

        // ─── 5. Customer Demographics (by shipping country) ───────────────────
        const userAddresses = await prisma.address.findMany({
            select: { country: true },
        });
        const countryMap: Record<string, number> = {};
        for (const addr of userAddresses) {
            const c = addr.country || "Unknown";
            countryMap[c] = (countryMap[c] || 0) + 1;
        }
        const totalAddresses = userAddresses.length;
        const demographics = Object.entries(countryMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([country, count]) => ({
                country,
                count,
                percentage:
                    totalAddresses > 0
                        ? Math.round((count / totalAddresses) * 100)
                        : 0,
            }));

        // ─── 6. Recent Orders ─────────────────────────────────────────────────
        const recentOrders = await prisma.order.findMany({
            take: 5,
            orderBy: { created_at: "desc" },
            include: {
                user: { select: { full_name: true, email: true } },
                items: {
                    take: 1,
                    include: {
                        variant: {
                            include: {
                                product: {
                                    include: {
                                        images: { take: 1, orderBy: { sort_order: "asc" } },
                                    },
                                },
                                images: { take: 1, orderBy: { sort_order: "asc" } },
                            },
                        },
                    },
                },
            },
        });

        const formattedRecentOrders = recentOrders.map((order) => {
            const firstItem = order.items[0];
            const product = firstItem?.variant?.product;
            const productImage =
                firstItem?.variant?.images?.[0]?.image_url ||
                product?.images?.[0]?.image_url ||
                null;
            return {
                id: order.id,
                order_number: order.order_number,
                customer: order.user?.full_name || order.shipping_name,
                email: order.user?.email || "",
                product_name: product?.product_name || "N/A",
                product_image: productImage,
                category: "Product",
                total_amount: order.total_amount,
                status: order.order_status,
                created_at: order.created_at,
                items_count: order.items.length,
            };
        });

        // ─── 7. Order Status Breakdown ────────────────────────────────────────
        const statusBreakdown = await prisma.order.groupBy({
            by: ["order_status"],
            _count: { id: true },
        });

        return NextResponse.json({
            customers: {
                total: totalCustomers,
                growth: parseFloat(customerGrowth),
                isGrowing: parseFloat(customerGrowth) >= 0,
            },
            orders: {
                total: totalOrders,
                growth: parseFloat(orderGrowth),
                isGrowing: parseFloat(orderGrowth) >= 0,
            },
            monthlySales: {
                sales: monthlySales,
                revenue: monthlyRevenue,
            },
            monthlyTarget: {
                target: thisMonthTarget,
                revenue: Math.round(thisMonthRevenue),
                today: Math.round(todayRevenue),
                lastMonthRevenue: Math.round(lastMonthRevenue),
                progress: targetProgress,
            },
            demographics,
            recentOrders: formattedRecentOrders,
            statusBreakdown: statusBreakdown.map((s) => ({
                status: s.order_status,
                count: s._count.id,
            })),
        });
    } catch (error) {
        console.error("DASHBOARD_API_ERROR", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
