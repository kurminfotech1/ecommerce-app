"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Users,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { usePermission } from "@/hooks/usePermission";

// --- Types ---
interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  is_verified: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    orders: number;
    reviews: number;
  };
}

// --- Helpers ---
const formatDate = (iso: string) => {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const AVATAR_COLORS = [
  "bg-blue-500", "bg-indigo-500", "bg-emerald-500",
  "bg-amber-500", "bg-rose-500", "bg-purple-500", "bg-teal-500",
];
const getAvatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

// --- Sub-components ---
const StatCard = ({ label, value, icon: Icon, colorClass, bgClass }: { label: string; value: string | number; icon: any; colorClass: string; bgClass: string }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 dark:bg-gray-800 dark:border-gray-700">
    <div className={`w-12 h-12 rounded-xl ${bgClass} ${colorClass} flex items-center justify-center shrink-0`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium mb-0.5 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  </div>
);

const TableSkeleton = () => (
  <>
    {Array.from({ length: 5 }).map((_, i) => (
      <tr key={i} className="animate-pulse border-b border-gray-100 last:border-none dark:border-gray-700">
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-xl shrink-0 dark:bg-gray-700" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-28 dark:bg-gray-700" />
              <div className="h-3 bg-gray-100 rounded w-20 dark:bg-gray-700" />
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="space-y-2">
            <div className="h-3 bg-gray-100 rounded w-40 dark:bg-gray-700" />
            <div className="h-3 bg-gray-100 rounded w-28 dark:bg-gray-700" />
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex justify-center">
            <div className="h-6 bg-gray-100 rounded-full w-20 dark:bg-gray-700" />
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="h-4 bg-gray-100 rounded w-16 dark:bg-gray-700" />
            <div className="h-3 bg-gray-50 rounded w-12 dark:bg-gray-700" />
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex justify-center">
            <div className="h-4 bg-gray-100 rounded w-24 dark:bg-gray-700" />
          </div>
        </td>
      </tr>
    ))}
  </>
);

// --- Main Component ---
export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  // Filters
  const [search, setSearch] = useState("");
  const [isVerified, setIsVerified] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { canRead, canDelete } = usePermission("Customers");

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (isVerified !== "all") params.set("is_verified", isVerified);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await axios.get(`/api/customers?${params.toString()}`);
      setCustomers(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err: any) {
      console.error("Fetch customers error:", err);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [search, isVerified, startDate, endDate, page, limit]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Handle Search with debounce
  const [tempSearch, setTempSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(tempSearch);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [tempSearch]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Customers</h1>
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Total {total} customers registered</p>
        </div>
     
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Customers" value={total} icon={Users} colorClass="text-blue-600" bgClass="bg-blue-50 dark:bg-blue-900/20" />
        <StatCard label="Verified" value={customers.filter(c => c.is_verified).length || "..."} icon={UserCheck} colorClass="text-emerald-600" bgClass="bg-emerald-50 dark:bg-emerald-900/20" />
        <StatCard label="Unverified" value={customers.filter(c => !c.is_verified).length || "..."} icon={UserX} colorClass="text-rose-600" bgClass="bg-rose-50 dark:bg-rose-900/20" />
        <StatCard label="New Customers" value={"Active"} icon={Calendar} colorClass="text-amber-600" bgClass="bg-amber-50 dark:bg-amber-900/20" />
      </div>

      {/* Table & Filters Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
        {/* Filters Header */}
        <div className="p-5 border-b border-gray-100 flex flex-col xl:flex-row gap-4 dark:border-gray-700">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={tempSearch}
              onChange={(e) => setTempSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={isVerified}
              onChange={(e) => { setIsVerified(e.target.value); setPage(1); }}
              className="px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Verification</option>
              <option value="true">Verified Only</option>
              <option value="false">Unverified Only</option>
            </select>

            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1 dark:bg-gray-700 text-gray-500 dark:text-gray-300">
              <span className="text-xs font-medium">Registred From:</span>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="bg-transparent border-none text-sm outline-none p-1.5 dark:text-white"
              />
              <span className="text-xs font-medium">To:</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="bg-transparent border-none text-sm outline-none p-1.5 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider dark:bg-gray-900/50 dark:text-gray-400">
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4 text-center">Verification</th>
                <th className="px-6 py-4 text-center">Activity</th>
                <th className="px-6 py-4 text-center">Joined On</th>
                
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
              {loading ? (
                <TableSkeleton />
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users size={48} className="text-gray-200 dark:text-gray-700" />
                      <p className="text-gray-500 font-medium">No customers found matching your filters</p>
                      <button onClick={() => { setTempSearch(""); setIsVerified("all"); setStartDate(""); setEndDate(""); }} className="text-blue-500 text-sm hover:underline">Clear all filters</button>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors group dark:hover:bg-gray-700/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${getAvatarColor(customer.full_name)} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm`}>
                          {initials(customer.full_name)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors lowercase first-letter:uppercase">{customer.full_name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">ID: {customer.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail size={14} className="text-gray-400" />
                          {customer.email}
                        </div>
                        {customer.phone && (
                            <div className="flex items-center gap-2 text-sm">
                                <Phone size={14} className="text-gray-400" />
                                {customer.phone}
                            </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {customer.is_verified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold dark:bg-emerald-900/30 dark:text-emerald-400 uppercase">
                          <UserCheck size={10} />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold dark:bg-rose-900/30 dark:text-rose-400 uppercase">
                          <UserX size={10} />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{customer._count.orders} Orders</span>
                        <span className="text-[10px] text-gray-400">{customer._count.reviews} Reviews</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-sm">{formatDate(customer.createdAt)}</p>
                    </td>
                    
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-5 border-t border-gray-100 flex items-center justify-between dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/20">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing <span className="font-semibold text-gray-900 dark:text-white">{((page - 1) * limit) + 1}</span> to <span className="font-semibold text-gray-900 dark:text-white">{Math.min(page * limit, total)}</span> of <span className="font-semibold text-gray-900 dark:text-white">{total}</span> customers
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-xl border border-gray-200 disabled:opacity-50 hover:bg-gray-50 transition dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition ${page === i + 1 ? "bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none" : "hover:bg-gray-100 text-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-xl border border-gray-200 disabled:opacity-50 hover:bg-gray-50 transition dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}