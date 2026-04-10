import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardData } from "@/types/dashboard";

type RecentOrder = DashboardData["recentOrders"][number];

const AVATAR_COLORS = ["bg-[#157f3c]","bg-blue-500","bg-emerald-500","bg-rose-500","bg-amber-500","bg-indigo-500","bg-pink-500","bg-teal-500","bg-orange-500","bg-cyan-500"];
function getAvatarColor(name: string) { return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]; }
function getInitials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
  };
}

const STATUS_CONFIG: Record<string, { label: string; icon: string; colorClass: string; bgClass: string; borderClass: string }> = {
  PLACED:     { label: "Placed",     icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",                                                                          colorClass: "text-[#157f3c] dark:text-[#157f3c]",   bgClass: "bg-[#157f3c]/10 dark:bg-[#157f3c]/20",   borderClass: "border-[#157f3c]/20 dark:border-[#157f3c]/30"   },
  CONFIRMED:  { label: "Confirmed",  icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",                                                                          colorClass: "text-indigo-600 dark:text-indigo-400", bgClass: "bg-indigo-50 dark:bg-indigo-500/10", borderClass: "border-indigo-200 dark:border-indigo-500/20" },
  PROCESSING: { label: "Processing", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",          colorClass: "text-amber-600 dark:text-amber-400",  bgClass: "bg-amber-50 dark:bg-amber-500/10",  borderClass: "border-amber-200 dark:border-amber-500/20"  },
  SHIPPED:    { label: "Shipped",    icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4",                                     colorClass: "text-orange-600 dark:text-orange-400", bgClass: "bg-orange-50 dark:bg-orange-500/10", borderClass: "border-orange-200 dark:border-orange-500/20" },
  DELIVERED:  { label: "Delivered",  icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",                                                                          colorClass: "text-green-600 dark:text-green-400",  bgClass: "bg-green-50 dark:bg-green-500/10",  borderClass: "border-green-200 dark:border-green-500/20"  },
  CANCELLED:  { label: "Cancelled",  icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",                                                  colorClass: "text-red-600 dark:text-red-400",      bgClass: "bg-red-50 dark:bg-red-500/10",      borderClass: "border-red-200 dark:border-red-500/20"      },
};

interface RecentOrdersProps {
  orders: RecentOrder[];
  loading: boolean;
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-gray-100 dark:border-gray-800">
      <td className="px-4 py-3.5">
        <div className="h-3.5 w-32 rounded bg-gray-200 dark:bg-gray-700" />
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-gray-200 dark:bg-gray-700 shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3 w-28 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-2.5 w-16 rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-2.5 w-32 rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="h-5 w-22 rounded-full bg-gray-200 dark:bg-gray-700" />
      </td>
      <td className="px-4 py-3.5 hidden lg:table-cell">
        <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700 mb-1" />
        <div className="h-2.5 w-12 rounded bg-gray-100 dark:bg-gray-800" />
      </td>
      <td className="px-4 py-3.5">
        <div className="h-3.5 w-18 rounded bg-gray-200 dark:bg-gray-700" />
      </td>
    </tr>
  );
}

export default function RecentOrders({ orders, loading }: RecentOrdersProps) {
  const router = useRouter();
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Orders
          </h3>
          {!loading && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Last {orders.length} order{orders.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            See all
          </Link>
        </div>
      </div>

      <div className="w-full overflow-x-auto scrollbar-hide">
        <table className="w-full min-w-max whitespace-nowrap lg:whitespace-normal">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Product</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Date</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No recent orders found</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const cfg = STATUS_CONFIG[order.status] ?? {
                  label: order.status,
                  icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                  colorClass: "text-gray-600 dark:text-gray-400",
                  bgClass: "bg-gray-50 dark:bg-gray-800",
                  borderClass: "border-gray-200 dark:border-gray-700",
                };

                const { date, time } = formatDateTime(order.created_at);
                const initials = getInitials(order.customer || "U");
                const avatarColor = getAvatarColor(order.customer || "U");

                return (
                  <tr key={order.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3.5">
                      <span 
                        className="text-xs font-bold text-[#157f3c] dark:text-[#157f3c]/80 font-mono tracking-tight hover:underline"
                      >
                        {order.order_number}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-9 w-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden shrink-0 flex items-center justify-center">
                          {order.product_image ? (
                            <Image
                              src={order.product_image}
                              alt={order.product_name}
                              width={36}
                              height={36}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0 flex flex-col justify-center">
                          <div className="relative group/tooltip inline-block max-w-[220px]">
                            <p className="text-xs font-medium text-gray-800 dark:text-white/90 truncate cursor-default">
                              {order.product_name}
                            </p>
                            <div className="pointer-events-none absolute bottom-full left-0 mb-2 z-50 hidden group-hover/tooltip:block">
                              <div className="bg-gray-900 dark:bg-gray-700 text-white text-[11px] font-medium rounded-lg px-3 py-1.5 shadow-lg w-max max-w-[350px] break-words text-left">
                                {order.product_name}
                                <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
                              </div>
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                            {order.items_count} item{order.items_count !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`${avatarColor} h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold shadow-sm`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-800 dark:text-white/90 truncate">{order.customer}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{order.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${cfg.colorClass} ${cfg.bgClass} ${cfg.borderClass}`}>
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cfg.icon} />
                        </svg>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <div className="flex items-start gap-1.5">
                        <svg className="w-3 h-3 text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300">{date}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{time}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-bold text-gray-800 dark:text-white/90">{formatCurrency(order.total_amount)}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
