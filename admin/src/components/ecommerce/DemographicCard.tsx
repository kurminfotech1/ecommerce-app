import CountryMap from "./CountryMap";
import { DashboardData } from "@/types/dashboard";

type DemographicItem = DashboardData["demographics"][number];

// Country code mapping for flag emojis (extend as needed)
const COUNTRY_EMOJI: Record<string, string> = {
  "United States": "🇺🇸",
  USA: "🇺🇸",
  "United Kingdom": "🇬🇧",
  UK: "🇬🇧",
  India: "🇮🇳",
  France: "🇫🇷",
  Germany: "🇩🇪",
  Canada: "🇨🇦",
  Australia: "🇦🇺",
  Japan: "🇯🇵",
  China: "🇨🇳",
  Brazil: "🇧🇷",
  Mexico: "🇲🇽",
  "South Korea": "🇰🇷",
  Italy: "🇮🇹",
  Spain: "🇪🇸",
  Netherlands: "🇳🇱",
  Singapore: "🇸🇬",
  Unknown: "🌍",
};

const BRAND_COLORS = [
  "bg-brand-500",
  "bg-blue-400",
  "bg-indigo-400",
  "bg-violet-400",
  "bg-purple-400",
];

interface DemographicCardProps {
  demographics: DemographicItem[];
  loading: boolean;
}

export default function DemographicCard({ demographics, loading }: DemographicCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Customers Demographic
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Number of customers based on country
          </p>
        </div>
      </div>

      <div className="px-4 py-6 my-6 overflow-hidden border border-gray-200 rounded-2xl bg-gray-50 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
        <div
          id="mapOne"
          className="mapOne map-btn -mx-4 -my-6 h-[212px] w-[252px] 2xsm:w-[307px] xsm:w-[358px] sm:-mx-6 md:w-[668px] lg:w-[634px] xl:w-[393px] 2xl:w-[554px]"
        >
          <CountryMap />
        </div>
      </div>

      <div className="space-y-5">
        {loading ? (
          // Skeleton loaders
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div>
                  <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
                  <div className="w-24 h-3 bg-gray-100 dark:bg-gray-800 rounded" />
                </div>
              </div>
              <div className="flex w-full max-w-[140px] items-center gap-3">
                <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-700" />
                <div className="w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))
        ) : demographics.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-gray-500 py-4 text-sm">
            No customer address data yet.
          </p>
        ) : (
          demographics.map((item, idx) => (
            <div key={item.country} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-lg">
                  {COUNTRY_EMOJI[item.country] || "🌍"}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                    {item.country}
                  </p>
                  <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                    {item.count.toLocaleString()} Customer{item.count !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div className="flex w-full max-w-[140px] items-center gap-3">
                <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
                  <div
                    className={`absolute left-0 top-0 flex h-full items-center justify-center rounded-sm ${BRAND_COLORS[idx % BRAND_COLORS.length]} text-xs font-medium text-white transition-all duration-700`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                  {item.percentage}%
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
