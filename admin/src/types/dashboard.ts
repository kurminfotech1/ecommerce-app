
export interface DashboardData {
    customers: {
        total: number;
        growth: number;
        isGrowing: boolean;
    };
    orders: {
        total: number;
        growth: number;
        isGrowing: boolean;
    };
    monthlySales: {
        sales: number[];
        revenue: number[];
    };
    monthlyTarget: {
        target: number;
        thisMonthRevenue: number;
        thisMonthOrders: number;
        thisMonthCustomers: number;
        today: number;
        lastMonthRevenue: number;
        progress: number;
    };
    demographics: {
        country: string;
        count: number;
        percentage: number;
    }[];
    recentOrders: {
        id: string;
        order_number: string;
        customer: string;
        email: string;
        product_name: string;
        product_image: string | null;
        category: string;
        total_amount: number;
        status: string;
        created_at: string;
        items_count: number;
    }[];
    statusBreakdown: {
        status: string;
        count: number;
    }[];
}
