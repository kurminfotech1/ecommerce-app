import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-indexed

        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const firstDayOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
        const lastDayOfLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
        const firstDayOfYear = new Date(currentYear, 0, 1);
        const lastDayOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // ─── Run ALL independent queries in parallel ───────────────────────────
        const [
            totalCustomers,
            lastMonthCustomers,
            totalOrders,
            lastMonthOrders,
            // Monthly orders for the whole year in ONE query — grouped by raw data
            yearOrders,
            // Last month revenue aggregate
            lastMonthRevenueAgg,
            // This month revenue aggregate
            thisMonthRevenueAgg,
            // Today revenue aggregate
            todayRevenueAgg,
            // Demographics
            userAddresses,
            // Recent orders
            recentOrders,
            // Status breakdown
            statusBreakdown,
        ] = await Promise.all([
            // 1a. Total customers
            prisma.user.count(),

            // 1b. Customers before this month (for growth calc)
            prisma.user.count({
                where: { createdAt: { lt: firstDayOfMonth } },
            }),

            // 2a. Total orders
            prisma.order.count(),

            // 2b. Orders before this month (for growth calc)
            prisma.order.count({
                where: { created_at: { lt: firstDayOfMonth } },
            }),

            // 3. All non-cancelled orders in the current year — single query replaces 12-query loop
            prisma.order.findMany({
                where: {
                    created_at: { gte: firstDayOfYear, lte: lastDayOfYear },
                    order_status: { not: "CANCELLED" },
                },
                select: { created_at: true, total_amount: true },
            }),

            // 4a. Last month revenue aggregate
            prisma.order.aggregate({
                where: {
                    created_at: { gte: firstDayOfLastMonth, lte: lastDayOfLastMonth },
                    order_status: { not: "CANCELLED" },
                },
                _sum: { total_amount: true },
            }),

            // 4b. This month revenue aggregate
            prisma.order.aggregate({
                where: {
                    created_at: { gte: firstDayOfMonth },
                    order_status: { not: "CANCELLED" },
                },
                _sum: { total_amount: true },
            }),

            // 4c. Today revenue aggregate
            prisma.order.aggregate({
                where: {
                    created_at: { gte: todayStart },
                    order_status: { not: "CANCELLED" },
                },
                _sum: { total_amount: true },
            }),

            // 5. Customer demographics
            prisma.address.findMany({
                select: { country: true },
            }),

            // 6. Recent orders
            prisma.order.findMany({
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
            }),

            // 7. Order status breakdown
            prisma.order.groupBy({
                by: ["order_status"],
                _count: { id: true },
            }),
        ]);

        // ─── 1. Customer stats ─────────────────────────────────────────────────
        const newCustomersThisMonth = totalCustomers - lastMonthCustomers;
        const customerGrowth =
            lastMonthCustomers > 0
                ? ((newCustomersThisMonth / lastMonthCustomers) * 100).toFixed(2)
                : "0";

        // ─── 2. Order stats ────────────────────────────────────────────────────
        const newOrdersThisMonth = totalOrders - lastMonthOrders;
        const orderGrowth =
            lastMonthOrders > 0
                ? ((newOrdersThisMonth / lastMonthOrders) * 100).toFixed(2)
                : "0";

        // ─── 3. Monthly sales — aggregate in JS from yearOrders ───────────────
        const monthlySales = new Array(12).fill(0);
        const monthlyRevenue = new Array(12).fill(0);
        for (const order of yearOrders) {
            const m = new Date(order.created_at).getMonth(); // 0-indexed
            monthlySales[m] += 1;
            monthlyRevenue[m] += order.total_amount;
        }
        monthlyRevenue.forEach((v, i) => (monthlyRevenue[i] = Math.round(v)));

        // ─── 4. Monthly target ─────────────────────────────────────────────────
        const lastMonthRevenue = lastMonthRevenueAgg._sum.total_amount ?? 0;
        const thisMonthRevenue = thisMonthRevenueAgg._sum.total_amount ?? 0;
        const todayRevenue = todayRevenueAgg._sum.total_amount ?? 0;
        const thisMonthTarget = Math.round(lastMonthRevenue * 1.1) || 20000;
        const targetProgress =
            thisMonthTarget > 0
                ? Math.min(100, Math.round((thisMonthRevenue / thisMonthTarget) * 100))
                : 0;

        // ─── 5. Demographics ──────────────────────────────────────────────────
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

        // ─── 6. Format recent orders ──────────────────────────────────────────
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

        // ─── Response (unchanged shape) ───────────────────────────────────────
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
