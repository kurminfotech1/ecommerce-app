"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Search,
    RefreshCw,
    Eye,
    CheckCircle2,
    XCircle,
    Clock,
    ChevronDown,
    ChevronUp,
    Package,
    User,
    AlertCircle,
    MoreVertical,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

// -- Types --
type ReturnStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "COMPLETED";

interface ReturnRequest {
    id: string;
    order_id: string;
    user_id: string;
    reason: string;
    status: ReturnStatus;
    created_at: string;
    updated_at: string;
    order: {
        order_number: string;
        total_amount: number;
    };
    user: {
        full_name: string;
        email: string;
    };
}

const STATUS_CONFIG: Record<
    ReturnStatus,
    { label: string; color: string; bg: string; border: string; icon: any }
> = {
    REQUESTED: {
        label: "Requested",
        color: "text-amber-700",
        bg: "bg-amber-50",
        border: "border-amber-200",
        icon: Clock,
    },
    APPROVED: {
        label: "Approved",
        color: "text-blue-700",
        bg: "bg-blue-50",
        border: "border-blue-200",
        icon: CheckCircle2,
    },
    REJECTED: {
        label: "Rejected",
        color: "text-red-700",
        bg: "bg-red-50",
        border: "border-red-200",
        icon: XCircle,
    },
    COMPLETED: {
        label: "Completed",
        color: "text-emerald-700",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        icon: Package,
    },
};

const formatDate = (iso: string) => {
    if (!iso) return "N/A";
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatCurrency = (v: number) => `₹${v.toFixed(2)}`;

export default function ReturnsPage() {
    const [returns, setReturns] = useState<ReturnRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const fetchReturns = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get("/api/returns");
            setReturns(res.data || []);
        } catch (error) {
            console.error("Fetch returns failed:", error);
            toast.error("Failed to load return requests");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReturns();
    }, [fetchReturns]);

    const handleStatusUpdate = async (id: string, newStatus: ReturnStatus) => {
        try {
            await axios.patch(`/api/returns/${id}`, { status: newStatus });
            setReturns((prev) =>
                prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
            );
            toast.success(`Return request ${newStatus.toLowerCase()}`);
        } catch (error) {
            console.error("Status update failed:", error);
            toast.error("Failed to update status");
        }
    };

    const filteredReturns = returns.filter((r) => {
        const matchesSearch =
            r.order.order_number.toLowerCase().includes(search.toLowerCase()) ||
            r.user.full_name.toLowerCase().includes(search.toLowerCase()) ||
            r.reason.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "All" || r.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-gray-50/60 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <RefreshCw className="text-[#155dfc]" size={24} />
                            Manage Returns
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Process and track customer return requests
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <div className="relative">
                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                placeholder="Search order #, customer..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#155dfc] w-64 shadow-sm transition"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#155dfc] shadow-sm"
                        >
                            <option value="All">All Statuses</option>
                            {Object.keys(STATUS_CONFIG).map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table/List */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center space-y-4">
                            <RefreshCw className="animate-spin text-[#155dfc]" size={32} />
                            <p className="text-gray-500 animate-pulse">Loading return requests...</p>
                        </div>
                    ) : filteredReturns.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                                <RefreshCw size={24} className="text-gray-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">No returns found</h3>
                            <p className="text-gray-500">There are no return requests matching your filters.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                        <th className="px-6 py-4 text-left">Order #</th>
                                        <th className="px-6 py-4 text-left">Customer</th>
                                        <th className="px-6 py-4 text-left">Reason</th>
                                        <th className="px-6 py-4 text-left">Requested On</th>
                                        <th className="px-6 py-4 text-left">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredReturns.map((req) => {
                                        const cfg = STATUS_CONFIG[req.status];
                                        const Icon = cfg.icon;
                                        return (
                                            <tr key={req.id} className="hover:bg-blue-50/20 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <span className="font-mono text-xs font-bold text-gray-900">
                                                        {req.order.order_number}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#155dfc] font-bold text-xs">
                                                            {req.user.full_name[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">
                                                                {req.user.full_name}
                                                            </p>
                                                            <p className="text-[10px] text-gray-500">{req.user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="max-w-[200px] truncate text-gray-600 italic" title={req.reason}>
                                                        "{req.reason}"
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {formatDate(req.created_at)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.color} ${cfg.bg} ${cfg.border}`}
                                                    >
                                                        <Icon size={12} />
                                                        {cfg.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {req.status === "REQUESTED" && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleStatusUpdate(req.id, "APPROVED")}
                                                                    className="px-3 py-1.5 text-[11px] font-bold text-white bg-[#155dfc] hover:bg-blue-700 rounded-lg transition"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => handleStatusUpdate(req.id, "REJECTED")}
                                                                    className="px-3 py-1.5 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </>
                                                        )}
                                                        {req.status === "APPROVED" && (
                                                            <button
                                                                onClick={() => handleStatusUpdate(req.id, "COMPLETED")}
                                                                className="px-3 py-1.5 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
                                                            >
                                                                Mark Completed
                                                            </button>
                                                        )}
                                                        <button className="p-2 text-gray-400 hover:text-gray-600 transition">
                                                            <MoreVertical size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
