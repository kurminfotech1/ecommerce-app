"use client";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import React, { useEffect, useState } from "react";

import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import { DashboardData } from "@/types/dashboard";
import StatusWiseOrder from "@/components/ecommerce/StatusWiseOrder";

export default function Ecommerce() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">

      {/* ── 1. Orders by Status — full width, top ── */}
      <div className="col-span-12">
        <StatusWiseOrder data={data} loading={loading} />
      </div>

      {/* ── 2. Metrics + Chart (left) and Monthly Target (right) ── */}
      <div className="col-span-12 xl:col-span-7 space-y-6">
        <EcommerceMetrics data={data} loading={loading} />
        <MonthlySalesChart
          salesData={data?.monthlySales.sales ?? new Array(12).fill(0)}
          loading={loading}
        />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <MonthlyTarget targetData={data?.monthlyTarget ?? null} loading={loading} />
      </div>

      {/* ── 3. Statistics Chart ── */}
      <div className="col-span-12">
        <StatisticsChart rawData={data} loading={loading} />
      </div>

      {/* ── 4. Recent Orders ── */}
      <div className="col-span-12">
        <RecentOrders orders={data?.recentOrders ?? []} loading={loading} />
      </div>
    </div>
  );
}
