import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Image from "next/image";
import Link from "next/link";
import { DashboardData } from "@/types/dashboard";

type RecentOrder = DashboardData["recentOrders"][number];

const STATUS_MAP: Record<
  string,
  { label: string; color: "success" | "warning" | "error" | "info" | "light" }
> = {
  DELIVERED: { label: "Delivered", color: "success" },
  PLACED: { label: "Placed", color: "info" },
  CONFIRMED: { label: "Confirmed", color: "info" },
  PROCESSING: { label: "Processing", color: "warning" },
  SHIPPED: { label: "Shipped", color: "warning" },
  CANCELLED: { label: "Cancelled", color: "error" },
};

interface RecentOrdersProps {
  orders: RecentOrder[];
  loading: boolean;
}

export default function RecentOrders({ orders, loading }: RecentOrdersProps) {
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

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Order
              </TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Customer
              </TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Amount
              </TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Status
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              // Skeleton rows
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-[50px] w-[50px] rounded-md bg-gray-200 dark:bg-gray-700" />
                      <div>
                        <div className="w-28 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
                        <div className="w-20 h-3 bg-gray-100 dark:bg-gray-800 rounded" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="w-20 h-5 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow>
                <td colSpan={4} className="py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                  No orders yet.
                </td>
              </TableRow>
            ) : (
              orders.map((order) => {
                const statusInfo = STATUS_MAP[order.status] ?? {
                  label: order.status,
                  color: "light" as const,
                };
                return (
                  <TableRow key={order.id}>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-[50px] w-[50px] overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          {order.product_image ? (
                            <Image
                              width={50}
                              height={50}
                              src={order.product_image}
                              className="h-[50px] w-[50px] object-cover"
                              alt={order.product_name}
                            />
                          ) : (
                            <svg
                              className="w-6 h-6 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                              />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="relative group/tooltip inline-block max-w-[140px]">
                            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90 truncate max-w-[140px] cursor-default">
                              {order.product_name}
                            </p>
                            {/* Tooltip */}
                            <div className="pointer-events-none absolute bottom-full left-0 mb-2 z-50 hidden group-hover/tooltip:block">
                              <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium rounded-lg px-3 py-1.5 whitespace-nowrap shadow-lg max-w-[260px] break-words">
                                {order.product_name}
                                {/* Arrow */}
                                <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
                              </div>
                            </div>
                            <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                              {order.order_number}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-gray-600 text-theme-sm dark:text-gray-300">
                      <p className="font-medium text-gray-800 dark:text-white/90 text-theme-sm">{order.customer}</p>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{order.email}</span>
                    </TableCell>
                    <TableCell className="py-3 text-gray-700 text-theme-sm dark:text-gray-300 font-medium">
                      {formatCurrency(order.total_amount)}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge size="sm" color={statusInfo.color}>
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
