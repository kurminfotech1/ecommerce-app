import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { DashboardData } from "@/types/dashboard";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface MonthlySalesChartProps {
  salesData: number[];
  loading: boolean;
}

export default function MonthlySalesChart({ salesData, loading }: MonthlySalesChartProps) {
  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: { show: false },
      animations: { enabled: true, speed: 600 },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 4, colors: ["transparent"] },
    xaxis: {
      categories: MONTHS,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: { title: { text: undefined } },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    tooltip: {
      x: { show: false },
      y: { formatter: (val: number) => `${val} orders` },
    },
  };

  const series = [{ name: "Orders", data: salesData }];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Monthly Sales
          </h3>
          {loading && (
            <span className="text-xs text-gray-400 dark:text-gray-500">Loading...</span>
          )}
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          {loading ? (
            <div className="h-[180px] flex items-center justify-center">
              <div className="flex gap-2 items-end">
                {[60, 90, 70, 110, 55, 80, 100, 65, 75, 95, 85, 60].map((h, i) => (
                  <div
                    key={i}
                    className="bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                    style={{ width: 20, height: h }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <ReactApexChart options={options} series={series} type="bar" height={180} />
          )}
        </div>
      </div>
    </div>
  );
}
