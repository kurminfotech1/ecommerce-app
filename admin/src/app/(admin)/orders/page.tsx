"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Eye,
  FileText,
  Trash2,
  ShoppingBag,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  TruckIcon,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Package,
  MapPin,
  Calendar,
  User,
} from "lucide-react";
import { DeleteModal } from "@/components/common/DeleteModal";

// ── Types ──────────────────────────────────────────────────────────
type OrderStatus = "Pending" | "Processing" | "Shipped" | "Completed" | "Cancelled" | "Refunded";

interface OrderItem {
  id: string;
  name: string;
  image: string;
  sku: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customer: {
    name: string;
    email: string;
    avatar: string;
  };
  status: OrderStatus;
  date: string;
  amount: number;
  address: string;
  items: OrderItem[];
  deliveryFee: number;
  tax: number;
}

// ── Mock Data ──────────────────────────────────────────────────────
const MOCK_ORDERS: Order[] = [
  {
    id: "ORD-001",
    customer: { name: "John Doe", email: "john@example.com", avatar: "JD" },
    status: "Pending",
    date: "2025-06-10T10:31:00Z",
    amount: 235,
    address: "123 Main St, New York, NY",
    deliveryFee: 10,
    tax: 5,
    items: [
      { id: "i1", name: "Wireless Headphones", image: "🎧", sku: "58988", quantity: 1, price: 120 },
      { id: "i2", name: "Bluetooth Speaker", image: "🔊", sku: "52988", quantity: 2, price: 90 },
    ],
  },
  {
    id: "ORD-002",
    customer: { name: "Jane Smith", email: "jane@example.com", avatar: "JS" },
    status: "Completed",
    date: "2025-06-08T14:20:00Z",
    amount: 540,
    address: "456 Oak Ave, Los Angeles, CA",
    deliveryFee: 0,
    tax: 40,
    items: [
      { id: "i3", name: "Mechanical Keyboard", image: "⌨️", sku: "78123", quantity: 1, price: 250 },
      { id: "i4", name: "Gaming Mouse", image: "🖱️", sku: "78124", quantity: 1, price: 85 },
      { id: "i5", name: "Monitor Stand", image: "🖥️", sku: "78125", quantity: 1, price: 165 },
    ],
  },
  {
    id: "ORD-003",
    customer: { name: "Mike Johnson", email: "mike@example.com", avatar: "MJ" },
    status: "Shipped",
    date: "2025-06-09T09:15:00Z",
    amount: 189,
    address: "789 Pine Rd, Chicago, IL",
    deliveryFee: 15,
    tax: 14,
    items: [
      { id: "i6", name: "Running Shoes", image: "👟", sku: "91001", quantity: 1, price: 160 },
    ],
  },
  {
    id: "ORD-004",
    customer: { name: "Emily Davis", email: "emily@example.com", avatar: "ED" },
    status: "Cancelled",
    date: "2025-06-07T16:45:00Z",
    amount: 320,
    address: "321 Elm St, Houston, TX",
    deliveryFee: 20,
    tax: 0,
    items: [
      { id: "i7", name: "Smart Watch", image: "⌚", sku: "44321", quantity: 1, price: 299 },
    ],
  },
  {
    id: "ORD-005",
    customer: { name: "Robert Wilson", email: "robert@example.com", avatar: "RW" },
    status: "Processing",
    date: "2025-06-10T08:00:00Z",
    amount: 875,
    address: "654 Maple Dr, Phoenix, AZ",
    deliveryFee: 25,
    tax: 50,
    items: [
      { id: "i8", name: "Laptop Bag", image: "💼", sku: "30201", quantity: 2, price: 75 },
      { id: "i9", name: "Noise Cancelling Earbuds", image: "🎵", sku: "30202", quantity: 1, price: 199 },
      { id: "i10", name: "Portable Charger", image: "🔋", sku: "30203", quantity: 3, price: 45 },
    ],
  },
  {
    id: "ORD-006",
    customer: { name: "Sarah Connor", email: "sarah@example.com", avatar: "SC" },
    status: "Completed",
    date: "2025-06-05T11:30:00Z",
    amount: 115,
    address: "987 Cedar Blvd, San Antonio, TX",
    deliveryFee: 10,
    tax: 5,
    items: [
      { id: "i11", name: "Yoga Mat", image: "🧘", sku: "80111", quantity: 1, price: 100 },
    ],
  },
  {
    id: "ORD-007",
    customer: { name: "Chris Evans", email: "chris@example.com", avatar: "CE" },
    status: "Refunded",
    date: "2025-06-04T13:00:00Z",
    amount: 450,
    address: "159 Willow Ln, San Diego, CA",
    deliveryFee: 0,
    tax: 30,
    items: [
      { id: "i12", name: "Coffee Machine", image: "☕", sku: "55432", quantity: 1, price: 420 },
    ],
  },
  {
    id: "ORD-008",
    customer: { name: "Lisa Park", email: "lisa@example.com", avatar: "LP" },
    status: "Pending",
    date: "2025-06-10T12:00:00Z",
    amount: 680,
    address: "753 Birch Way, Dallas, TX",
    deliveryFee: 30,
    tax: 50,
    items: [
      { id: "i13", name: "Desk Lamp", image: "💡", sku: "66001", quantity: 2, price: 60 },
      { id: "i14", name: "Monitor 27\"", image: "🖥️", sku: "66002", quantity: 1, price: 480 },
    ],
  },
];

// ── Status config ──────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  OrderStatus,
  { color: string; bg: string; border: string; IconComp: React.FC<{ size?: number }> }
> = {
  Pending:    { color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   IconComp: Clock },
  Processing: { color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",    IconComp: RefreshCw },
  Shipped:    { color: "text-purple-700",  bg: "bg-purple-50",  border: "border-purple-200",  IconComp: TruckIcon },
  Completed:  { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", IconComp: CheckCircle2 },
  Cancelled:  { color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200",     IconComp: XCircle },
  Refunded:   { color: "text-gray-600",    bg: "bg-gray-100",   border: "border-gray-300",    IconComp: RefreshCw },
};

// ── Helpers ────────────────────────────────────────────────────────
const formatDate = (iso: string) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-"),
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
  };
};

const formatCurrency = (v: number) => `$${v.toFixed(2)}`;

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const AVATAR_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500",
  "bg-amber-500", "bg-rose-500", "bg-purple-500", "bg-teal-500",
];
const avatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

// ── Badge Component ────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.IconComp;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color} ${cfg.bg} ${cfg.border}`}
    >
      <Icon size={11} />
      {status}
    </span>
  );
};

// ── Skeleton ───────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 animate-pulse">
        <div className="w-9 h-9 bg-gray-200 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
        </div>
        <div className="w-20 h-5 bg-gray-200 rounded-full" />
        <div className="w-24 h-4 bg-gray-200 rounded" />
        <div className="w-16 h-4 bg-gray-200 rounded" />
        <div className="w-20 h-8 bg-gray-200 rounded-lg" />
      </div>
    ))}
  </div>
);

// ── Stat Card ──────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
}
const StatCard = ({ label, value, sub, icon, gradient, iconBg }: StatCardProps) => (
  <div className={`relative rounded-2xl p-5 overflow-hidden shadow-sm border border-white/60 ${gradient}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-white/80 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
        {sub && <p className="text-xs text-white/70 mt-1">{sub}</p>}
      </div>
      <div className={`${iconBg} rounded-xl p-2.5 text-white/90`}>{icon}</div>
    </div>
    {/* decorative circle */}
    <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
    <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
  </div>
);

// ── Row detail (collapsed content) ────────────────────────────────
const OrderRowDetail = ({ order }: { order: Order }) => {
  const subTotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = subTotal + order.deliveryFee + order.tax;

  return (
    <tr>
      <td colSpan={7} className="px-0 pb-1 pt-0">
        <div className="mx-4 mb-3 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
          {/* Inner header */}
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">
              Customer Orders:
            </p>
          </div>

          {/* Items table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 border-b border-gray-100">
                  <th className="px-5 py-2.5 text-left">Name</th>
                  <th className="px-5 py-2.5 text-left">SKU</th>
                  <th className="px-5 py-2.5 text-left">Quantity</th>
                  <th className="px-5 py-2.5 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-100/60 transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-lg shrink-0 shadow-sm">
                          {item.image}
                        </div>
                        <span className="font-medium text-gray-800">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <code className="text-xs bg-white text-gray-500 px-2 py-0.5 rounded-md border border-gray-200 font-mono">
                        {item.sku}
                      </code>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{item.quantity}</td>
                    <td className="px-5 py-3 text-right font-semibold text-violet-600">
                      {formatCurrency(item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals + Actions */}
          <div className="flex flex-wrap justify-between items-end px-5 py-4 border-t border-gray-100 gap-4">
            {/* Left: action buttons */}
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-gray-700 transition shadow-sm">
                <Eye size={13} />
                View
              </button>
              <button className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition shadow-sm">
                <FileText size={13} />
                Invoice
              </button>
            </div>

            {/* Right: price summary */}
            <div className="text-right space-y-1">
              <div className="flex items-center justify-end gap-8">
                <span className="text-xs text-gray-500">Delivery Fee:</span>
                <span className="text-xs font-semibold text-gray-700 min-w-[64px] text-right">
                  {formatCurrency(order.deliveryFee)}
                </span>
              </div>
              <div className="flex items-center justify-end gap-8">
                <span className="text-xs text-gray-500">Tax:</span>
                <span className="text-xs font-semibold text-gray-700 min-w-[64px] text-right">
                  {formatCurrency(order.tax)}
                </span>
              </div>
              <div className="flex items-center justify-end gap-8 pt-1 border-t border-gray-200 mt-1">
                <span className="text-sm font-bold text-violet-600">Total:</span>
                <span className="text-sm font-bold text-violet-600 min-w-[64px] text-right">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};

// ── Context Menu (3-dot) ───────────────────────────────────────────
interface RowMenuProps {
  order: Order;
  onDelete: (o: Order) => void;
  onView: (o: Order) => void;
}
const RowMenu = ({ order, onDelete, onView }: RowMenuProps) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white rounded-xl border border-gray-100 shadow-xl py-1 min-w-[140px]">
            <button
              onClick={() => { onView(order); setOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition"
            >
              <Eye size={13} /> View Details
            </button>
            <button
              onClick={() => { onDelete(order); setOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 transition"
            >
              <Trash2 size={13} /> Delete Order
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ── Order Detail Modal ─────────────────────────────────────────────
const OrderDetailModal = ({ order, onClose }: { order: Order; onClose: () => void }) => {
  const subTotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = subTotal + order.deliveryFee + order.tax;
  const { date, time } = formatDate(order.date);
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Order {order.id}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Placed on {date} at {time}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500">
              <XCircle size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Customer info */}
          <div className="flex items-start gap-4 bg-gray-50 rounded-xl p-4">
            <div className={`w-11 h-11 rounded-full ${avatarColor(order.customer.name)} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
              {initials(order.customer.name)}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{order.customer.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{order.customer.email}</p>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500">
                <MapPin size={11} />
                {order.address}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">SKU</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-base">
                          {item.image}
                        </div>
                        <span className="font-medium text-gray-800">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">{item.sku}</code>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(item.price)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">
                      {formatCurrency(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            {[
              { label: "Subtotal", value: formatCurrency(subTotal) },
              { label: "Delivery Fee", value: formatCurrency(order.deliveryFee) },
              { label: "Tax", value: formatCurrency(order.tax) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm text-gray-600">
                <span>{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
            <div className="flex justify-between text-base font-bold text-violet-700 pt-2 border-t border-gray-200 mt-2">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-semibold transition">
            <FileText size={15} /> Download Invoice
          </button>
          <button onClick={onClose} className="px-6 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl text-sm font-semibold transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════
const ITEMS_PER_PAGE = 5;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [page, setPage] = useState(1);

  // ── Collapse/expand state ──────────────────────────────────────
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const toggleRow = (id: string) =>
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // ── Delete modal state ─────────────────────────────────────────
  const [deleteOrder, setDeleteOrder] = useState<Order | null>(null);

  // ── View detail modal ──────────────────────────────────────────
  const [viewOrder, setViewOrder] = useState<Order | null>(null);

  // ── Stats ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalIncome = orders
      .filter((o) => o.status === "Completed")
      .reduce((s, o) => s + o.amount, 0);
    return {
      total: orders.length,
      totalIncome,
      pending: orders.filter((o) => o.status === "Pending").length,
      processing: orders.filter((o) => o.status === "Processing").length,
      shipped: orders.filter((o) => o.status === "Shipped").length,
      completed: orders.filter((o) => o.status === "Completed").length,
      cancelled: orders.filter((o) => o.status === "Cancelled").length,
      refunded: orders.filter((o) => o.status === "Refunded").length,
    };
  }, [orders]);

  // ── Filtered + paginated ───────────────────────────────────────
  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.customer.name.toLowerCase().includes(search.toLowerCase()) ||
        o.address.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleDelete = () => {
    if (!deleteOrder) return;
    setOrders((prev) => prev.filter((o) => o.id !== deleteOrder.id));
    setDeleteOrder(null);
  };

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const ALL_STATUSES: string[] = ["All", "Pending", "Processing", "Shipped", "Completed", "Cancelled", "Refunded"];

  return (
    <>
      <div className="min-h-screen bg-gray-50/60">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

          {/* ── Header ── */}
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Orders</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {filtered.length} order{filtered.length !== 1 ? "s" : ""} found
              </p>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              {/* Search */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  placeholder="Search by ID, customer, address..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 w-64 transition"
                />
              </div>
              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="border border-gray-200 bg-white text-sm px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Stats Cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
            <StatCard
              label="Total Income"
              value={`$${stats.totalIncome.toLocaleString()}`}
              sub={`From ${stats.completed} completed orders`}
              icon={<DollarSign size={18} />}
              gradient="bg-gradient-to-br from-violet-600 to-violet-800"
              iconBg="bg-white/20"
            />
            <StatCard
              label="Total Orders"
              value={String(stats.total)}
              sub="All time"
              icon={<ShoppingBag size={18} />}
              gradient="bg-gradient-to-br from-blue-500 to-blue-700"
              iconBg="bg-white/20"
            />
            <StatCard
              label="Pending"
              value={String(stats.pending)}
              sub={`${stats.processing} processing`}
              icon={<Clock size={18} />}
              gradient="bg-gradient-to-br from-amber-500 to-amber-700"
              iconBg="bg-white/20"
            />
            <StatCard
              label="Shipped"
              value={String(stats.shipped)}
              sub="In transit"
              icon={<TruckIcon size={18} />}
              gradient="bg-gradient-to-br from-purple-500 to-purple-700"
              iconBg="bg-white/20"
            />
            <StatCard
              label="Completed"
              value={String(stats.completed)}
              sub="Successfully delivered"
              icon={<CheckCircle2 size={18} />}
              gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
              iconBg="bg-white/20"
            />
            <StatCard
              label="Cancelled"
              value={String(stats.cancelled)}
              sub="Orders cancelled"
              icon={<XCircle size={18} />}
              gradient="bg-gradient-to-br from-red-500 to-red-700"
              iconBg="bg-white/20"
            />
            <StatCard
              label="Refunded"
              value={String(stats.refunded)}
              sub="Returned & refunded"
              icon={<RefreshCw size={18} />}
              gradient="bg-gradient-to-br from-gray-500 to-gray-700"
              iconBg="bg-white/20"
            />
            <StatCard
              label="Total Items Sold"
              value={String(orders.reduce((s, o) => s + o.items.reduce((is, i) => is + i.quantity, 0), 0))}
              sub="Across all orders"
              icon={<Package size={18} />}
              gradient="bg-gradient-to-br from-teal-500 to-teal-700"
              iconBg="bg-white/20"
            />
          </div>

          {/* ── Table ── */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mb-4">
                <ShoppingBag size={28} className="text-violet-400" />
              </div>
              <p className="text-lg font-semibold text-gray-700 mb-1">No orders found</p>
              <p className="text-sm text-gray-400">Try adjusting your search or filter.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      <th className="px-4 py-3 text-left">ID</th>
                      <th className="px-4 py-3 text-left">Customer</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Amount</th>
                      <th className="px-4 py-3 text-left">Address</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginated.map((order) => {
                      const isExpanded = expandedRows.has(order.id);
                      const { date, time } = formatDate(order.date);
                      return (
                        <React.Fragment key={order.id}>
                          <tr
                            className="hover:bg-violet-50/30 transition group"
                          >
                            {/* ID */}
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-lg">
                                {order.id}
                              </span>
                            </td>

                            {/* Customer */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-8 h-8 rounded-full ${avatarColor(order.customer.name)} flex items-center justify-center text-white text-xs font-bold shrink-0`}
                                >
                                  {initials(order.customer.name)}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800 leading-tight text-xs">
                                    {order.customer.name}
                                  </p>
                                  <p className="text-[10px] text-gray-400">{order.customer.email}</p>
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3">
                              <StatusBadge status={order.status} />
                            </td>

                            {/* Date */}
                            <td className="px-4 py-3">
                              <div className="flex items-start gap-1.5">
                                <Calendar size={12} className="text-gray-400 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-xs font-medium text-gray-700">{date}</p>
                                  <p className="text-[10px] text-gray-400">{time}</p>
                                </div>
                              </div>
                            </td>

                            {/* Amount */}
                            <td className="px-4 py-3">
                              <span className="font-semibold text-gray-800">
                                {formatCurrency(order.amount)}
                              </span>
                            </td>

                            {/* Address */}
                            <td className="px-4 py-3">
                              <div className="flex items-start gap-1.5 max-w-[200px]">
                                <MapPin size={12} className="text-gray-400 mt-0.5 shrink-0" />
                                <span className="text-xs text-gray-600 leading-snug line-clamp-2">
                                  {order.address}
                                </span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-0.5">
                                {/* Expand/collapse chevron */}
                                <button
                                  onClick={() => toggleRow(order.id)}
                                  title={isExpanded ? "Collapse" : "Expand"}
                                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"
                                >
                                  {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                </button>
                                {/* 3-dot menu */}
                                <RowMenu
                                  order={order}
                                  onDelete={(o) => setDeleteOrder(o)}
                                  onView={(o) => setViewOrder(o)}
                                />
                              </div>
                            </td>
                          </tr>

                          {/* ── Expanded Row ── */}
                          {isExpanded && <OrderRowDetail key={`${order.id}-detail`} order={order} />}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages} &nbsp;·&nbsp; {filtered.length} orders
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 transition"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`px-3 py-1.5 text-sm border rounded-lg transition ${pg === page
                        ? "bg-violet-600 border-violet-600 text-white font-semibold"
                        : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                      }`}
                  >
                    {pg}
                  </button>
                ))}
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 transition"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Delete Modal ── */}
      <DeleteModal
        open={!!deleteOrder}
        onClose={() => setDeleteOrder(null)}
        onConfirm={handleDelete}
        parentTitle={`Delete Order ${deleteOrder?.id}?`}
        childTitle={`This will permanently delete the order from ${deleteOrder?.customer.name}. This action cannot be undone.`}
      />

      {/* ── Order Detail Modal ── */}
      {viewOrder && (
        <OrderDetailModal order={viewOrder} onClose={() => setViewOrder(null)} />
      )}
    </>
  );
}