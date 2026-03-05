import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { CalenderIcon } from "../../icons";
import flatpickr from "flatpickr";
import { useRef } from "react";
import { DashboardData } from "@/types/dashboard";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const QUARTERS = ["Q1 (Jan–Mar)", "Q2 (Apr–Jun)", "Q3 (Jul–Sep)", "Q4 (Oct–Dec)"];

type TabType = "Monthly" | "Quarterly" | "Annually";

function aggregateQuarterly(monthly: number[]): number[] {
  return [0, 1, 2, 3].map((q) =>
    monthly.slice(q * 3, q * 3 + 3).reduce((a, b) => a + b, 0)
  );
}

interface StatisticsChartProps {
  rawData: DashboardData | null;
  loading: boolean;
}

export default function StatisticsChart({ rawData, loading }: StatisticsChartProps) {
  const datePickerRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<TabType>("Monthly");

  useEffect(() => {
    if (!datePickerRef.current) return;
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    const fp = flatpickr(datePickerRef.current, {
      mode: "range",
      static: true,
      monthSelectorType: "static",
      dateFormat: "M d",
      defaultDate: [sevenDaysAgo, today],
      clickOpens: true,
      prevArrow:
        '<svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.5 15L7.5 10L12.5 5" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      nextArrow:
        '<svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 15L12.5 10L7.5 5" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    });
    return () => { if (!Array.isArray(fp)) fp.destroy(); };
  }, []);

  // ── Derive series + categories based on active tab ──────────────────────
  const monthlySales = rawData?.monthlySales.sales ?? new Array(12).fill(0);
  const monthlyRevenue = rawData?.monthlySales.revenue ?? new Array(12).fill(0);

  let categories: string[];
  let salesSeries: number[];
  let revenueSeries: number[];

  const currentYear = new Date().getFullYear();

  if (activeTab === "Monthly") {
    categories = MONTHS;
    salesSeries = monthlySales;
    revenueSeries = monthlyRevenue;
  } else if (activeTab === "Quarterly") {
    categories = QUARTERS;
    salesSeries = aggregateQuarterly(monthlySales);
    revenueSeries = aggregateQuarterly(monthlyRevenue);
  } else {
    // Annually — show current year + 4 placeholder prior years (prior years are 0 since we only have current year's data)
    categories = [String(currentYear - 4), String(currentYear - 3), String(currentYear - 2), String(currentYear - 1), String(currentYear)];
    const yearTotal = monthlySales.reduce((a, b) => a + b, 0);
    const revenueTotal = monthlyRevenue.reduce((a, b) => a + b, 0);
    salesSeries = [0, 0, 0, 0, yearTotal];
    revenueSeries = [0, 0, 0, 0, revenueTotal];
  }

  // Use bar for Quarterly & Annually (works with any point count), area for Monthly
  const chartType: "area" | "bar" = activeTab === "Monthly" ? "area" : "bar";

  const options: ApexOptions = {
    legend: { show: false, position: "top", horizontalAlign: "left" },
    colors: ["#465FFF", "#9CB9FF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: chartType,
      toolbar: { show: false },
      animations: { enabled: true, speed: 600 },
    },
    plotOptions: chartType === "bar" ? {
      bar: {
        horizontal: false,
        columnWidth: activeTab === "Annually" ? "30%" : "50%",
        borderRadius: 4,
        borderRadiusApplication: "end",
        dataLabels: { position: "top" },
      },
    } : {},
    stroke: chartType === "area"
      ? { curve: "straight", width: [2, 2] }
      : { show: true, width: 2, colors: ["transparent"] },
    fill: chartType === "area"
      ? { type: "gradient", gradient: { opacityFrom: 0.55, opacityTo: 0 } }
      : { opacity: 1 },
    markers: chartType === "area" ? {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: { size: 6 },
    } : { size: 0 },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    dataLabels: { enabled: false },
    tooltip: {
      enabled: true,
      x: { show: true },
      y: [
        { formatter: (val: number) => `${val} orders` },
        { formatter: (val: number) => `Rs. ${val.toLocaleString("en-IN")}` },
      ],
    },
    xaxis: {
      type: "category",
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: { style: { fontSize: "12px", colors: ["#6B7280"] } },
      title: { text: "", style: { fontSize: "0px" } },
    },
  };

  const series = [
    { name: "Orders", data: salesSeries },
    { name: "Revenue (Rs.)", data: revenueSeries },
  ];

  const tabs: TabType[] = ["Monthly", "Quarterly", "Annually"];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Statistics
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Orders &amp; Revenue — {activeTab} view ({new Date().getFullYear()})
          </p>
        </div>

        <div className="flex items-center gap-3 sm:justify-end">
          {/* ── Tab switcher ── */}
          <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white transition-colors ${activeTab === tab
                  ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                  : "text-gray-500 dark:text-gray-400"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ── Date picker ── */}
          <div className="relative inline-flex items-center">
            <CalenderIcon className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:left-3 lg:top-1/2 lg:translate-x-0 lg:-translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none z-10" />
            <input
              ref={datePickerRef}
              className="h-10 w-10 lg:w-40 lg:h-auto lg:pl-10 lg:pr-3 lg:py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-transparent lg:text-gray-700 outline-none dark:border-gray-700 dark:bg-gray-800 dark:lg:text-gray-300 cursor-pointer"
              placeholder="Select date range"
            />
          </div>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          {loading ? (
            <div className="h-[310px] flex items-end gap-1 px-4">
              {([
                [160, 80], [140, 60], [190, 75], [110, 55], [170, 90],
                [130, 65], [200, 100], [120, 70], [150, 85], [180, 95],
                [145, 60], [165, 78],
              ] as [number, number][]).map(([h1, h2], i) => (
                <div key={i} className="flex-1 flex flex-col gap-1 items-center">
                  <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded animate-pulse" style={{ height: h1 }} />
                  <div className="w-full bg-indigo-100 dark:bg-indigo-900/30 rounded animate-pulse" style={{ height: h2 }} />
                </div>
              ))}
            </div>
          ) : (
            <Chart options={options} series={series} type={chartType} height={310} />
          )}
        </div>
      </div>
    </div>
  );
}
