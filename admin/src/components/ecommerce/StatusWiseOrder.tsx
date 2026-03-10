"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { DashboardData } from "@/types/dashboard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatusOrder {
  id: string;
  order_number: string;
  customer: string;
  email: string;
  product_name: string;
  product_image: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  items_count: number;
  city: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_KEY = "ALL";

const TABS = [
  { key: ALL_KEY,       label: "All",        dotColor: "bg-gray-400",    bgActive: "bg-gray-800 dark:bg-gray-600", textActive: "text-white" },
  { key: "PLACED",      label: "Placed",     dotColor: "bg-blue-500",    bgActive: "bg-blue-600",                  textActive: "text-white" },
  { key: "CONFIRMED",   label: "Confirmed",  dotColor: "bg-indigo-500",  bgActive: "bg-indigo-600",                textActive: "text-white" },
  { key: "PROCESSING",  label: "Processing", dotColor: "bg-amber-500",   bgActive: "bg-amber-500",                 textActive: "text-white" },
  { key: "SHIPPED",     label: "Shipped",    dotColor: "bg-orange-500",  bgActive: "bg-orange-500",                textActive: "text-white" },
  { key: "DELIVERED",   label: "Delivered",  dotColor: "bg-green-500",   bgActive: "bg-green-600",                 textActive: "text-white" },
  { key: "CANCELLED",   label: "Cancelled",  dotColor: "bg-red-500",     bgActive: "bg-red-600",                   textActive: "text-white" },
];

const STATUS_CONFIG: Record<string, { label: string; icon: string; colorClass: string; bgClass: string; borderClass: string }> = {
  PLACED:     { label: "Placed",     icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",                                                                          colorClass: "text-blue-600 dark:text-blue-400",   bgClass: "bg-blue-50 dark:bg-blue-500/10",   borderClass: "border-blue-200 dark:border-blue-500/20"   },
  CONFIRMED:  { label: "Confirmed",  icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",                                                                          colorClass: "text-indigo-600 dark:text-indigo-400", bgClass: "bg-indigo-50 dark:bg-indigo-500/10", borderClass: "border-indigo-200 dark:border-indigo-500/20" },
  PROCESSING: { label: "Processing", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",          colorClass: "text-amber-600 dark:text-amber-400",  bgClass: "bg-amber-50 dark:bg-amber-500/10",  borderClass: "border-amber-200 dark:border-amber-500/20"  },
  SHIPPED:    { label: "Shipped",    icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4",                                     colorClass: "text-orange-600 dark:text-orange-400", bgClass: "bg-orange-50 dark:bg-orange-500/10", borderClass: "border-orange-200 dark:border-orange-500/20" },
  DELIVERED:  { label: "Delivered",  icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",                                                                          colorClass: "text-green-600 dark:text-green-400",  bgClass: "bg-green-50 dark:bg-green-500/10",  borderClass: "border-green-200 dark:border-green-500/20"  },
  CANCELLED:  { label: "Cancelled",  icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",                                                  colorClass: "text-red-600 dark:text-red-400",      bgClass: "bg-red-50 dark:bg-red-500/10",      borderClass: "border-red-200 dark:border-red-500/20"      },
};

const AVATAR_COLORS = ["bg-violet-500","bg-blue-500","bg-emerald-500","bg-rose-500","bg-amber-500","bg-indigo-500","bg-pink-500","bg-teal-500","bg-orange-500","bg-cyan-500"];

function getAvatarColor(name: string) { return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]; }
function getInitials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const PAGE_SIZE = 8;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(amount);
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
  };
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

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
      <td className="px-4 py-3.5 hidden xl:table-cell">
        <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
      </td>
    </tr>
  );
}

// ─── Order Row ────────────────────────────────────────────────────────────────

function OrderRow({ order }: { order: StatusOrder }) {
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
    <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors">

      {/* ── Order Number ── */}
      <td className="px-4 py-3.5">
        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono tracking-tight">
          {order.order_number}
        </span>
      </td>

      {/* ── Product ── */}
      <td className="px-4 py-3.5 hidden md:table-cell">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Product Image */}
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
          {/* Product Name */}
          <div className="min-w-0 flex flex-col justify-center">
            <div className="relative group/tooltip inline-block max-w-[220px]">
              <p className="text-xs font-medium text-gray-800 dark:text-white/90 truncate cursor-default">
                {order.product_name}
              </p>
              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-full left-0 mb-2 z-50 hidden group-hover/tooltip:block">
                <div className="bg-gray-900 dark:bg-gray-700 text-white text-[11px] font-medium rounded-lg px-3 py-1.5 shadow-lg w-max max-w-max break-words text-left">
                  {order.product_name}
                  {/* Arrow */}
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

      {/* ── Customer ── */}
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

      {/* ── Status ── */}
      <td className="px-4 py-3.5">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${cfg.colorClass} ${cfg.bgClass} ${cfg.borderClass}`}>
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cfg.icon} />
          </svg>
          {cfg.label}
        </span>
      </td>

      {/* ── Date/Time ── */}
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

      {/* ── Amount ── */}
      <td className="px-4 py-3.5">
        <span className="text-sm font-bold text-gray-800 dark:text-white/90">{formatCurrency(order.total_amount)}</span>
      </td>

      {/* ── Location ── */}
      <td className="px-4 py-3.5 hidden xl:table-cell">
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-[10px]">{order.city}</span>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface StatusWiseOrderProps {
  data: DashboardData | null;
  loading: boolean;
}

export default function StatusWiseOrder({ data, loading }: StatusWiseOrderProps) {
  const [activeTab, setActiveTab] = useState<string>(ALL_KEY);
  const [orders, setOrders] = useState<StatusOrder[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  // Build count map from dashboard statusBreakdown (no extra fetch)
  const countMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    let totalAll = 0;
    for (const s of data?.statusBreakdown ?? []) {
      map[s.status] = s.count;
      totalAll += s.count;
    }
    map[ALL_KEY] = totalAll;
    return map;
  }, [data?.statusBreakdown]);

  const fetchOrders = useCallback(async (status: string, pageNum: number) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setFetchLoading(true);
    try {
      const statusParam = status === ALL_KEY ? "" : status;
      const url = `/api/dashboard/orders-by-status?status=${statusParam}&page=${pageNum}&limit=${PAGE_SIZE}`;
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setOrders(json.data ?? []);
      setTotal(json.total ?? 0);
      setTotalPages(json.totalPages ?? 1);
    } catch (err: any) {
      if (err.name !== "AbortError") setOrders([]);
    } finally {
      setFetchLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(activeTab, page);
  }, [activeTab, page, fetchOrders]);

  const handleTabChange = (key: string) => {
    if (key === activeTab) return;
    setActiveTab(key);
    setPage(1);
    setOrders([]);
  };

  const handlePage = (next: number) => {
    if (next < 1 || next > totalPages) return;
    setPage(next);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">

      {/* ── Header ── */}
      <div className="px-4 sm:px-6 pt-4 pb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-gray-800">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Orders by Status</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 h-4">
            {!loading && (total > 0
              ? `${total} order${total !== 1 ? "s" : ""} ${activeTab === ALL_KEY ? "total" : `· ${activeTab.toLowerCase()}`}`
              : "No orders found"
            )}
          </p>
        </div>
        <Link
          href="/orders"
          className="self-start sm:self-auto inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          View All Orders
        </Link>
      </div>

      {/* ── Status Tabs ── */}
      <div className="px-4 sm:px-6 pt-3 pb-0 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 scrollbar-hide">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = loading ? null : (countMap[tab.key] ?? 0);

            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`
                  flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 shrink-0
                  ${isActive
                    ? `${tab.bgActive} ${tab.textActive} shadow-sm`
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  }
                `}
              >
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${isActive ? "bg-white/70" : tab.dotColor}`} />
                {tab.label}
                {loading ? (
                  <span className="inline-block w-5 h-3 rounded bg-white/20 animate-pulse" />
                ) : count !== null && count > 0 ? (
                  <span className={`inline-flex items-center justify-center rounded-full px-1.5 min-w-[18px] h-[18px] text-[10px] font-semibold ${isActive ? "bg-white/25 text-white" : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}>
                    {count > 999 ? "999+" : count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Product</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Date</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell">Location</th>
            </tr>
          </thead>

          <tbody>
            {fetchLoading ? (
              Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonRow key={i} />)
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No orders found</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {activeTab === ALL_KEY ? "No orders have been placed yet." : `No orders with status "${activeTab.toLowerCase()}".`}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => <OrderRow key={order.id} order={order} />)
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-400 dark:text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePage(page - 1)}
              disabled={page === 1 || fetchLoading}
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pn: number;
              if (totalPages <= 5) pn = i + 1;
              else if (page <= 3) pn = i + 1;
              else if (page >= totalPages - 2) pn = totalPages - 4 + i;
              else pn = page - 2 + i;
              return (
                <button
                  key={pn}
                  onClick={() => handlePage(pn)}
                  disabled={fetchLoading}
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-medium transition-colors disabled:cursor-not-allowed
                    ${pn === page
                      ? "bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900"
                      : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                    }`}
                >
                  {pn}
                </button>
              );
            })}

            <button
              onClick={() => handlePage(page + 1)}
              disabled={page === totalPages || fetchLoading}
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}