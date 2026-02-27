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
  ShieldCheck,
  AlertCircle,
  Loader2,
  Printer,
} from "lucide-react";
import { DeleteModal } from "@/components/common/DeleteModal";
import axios from "axios";
import { toast } from "react-toastify";

// ── Types ──────────────────────────────────────────────────────────
type OrderStatus = "PLACED" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

interface OrderItem {
  id: string;
  variant: {
    product: {
      product_name: string;
      images: { image_url: string }[];
    };
    weight?: string;
    size?: string;
    sku: string;
  };
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  order_number: string;
  user: {
    full_name: string;
    email: string;
  };
  order_status: OrderStatus;
  created_at: string;
  total_amount: number;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  shipping_country: string;
  items: OrderItem[];
  payment?: {
    payment_method: string;
    status: string;
  };
}


// ── Status config ──────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; border: string; IconComp: React.FC<{ size?: number }> }
> = {
  PLACED: { label: "Placed", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", IconComp: Clock },
  CONFIRMED: { label: "Confirmed", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", IconComp: ShieldCheck },
  PROCESSING: { label: "Processing", color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200", IconComp: RefreshCw },
  SHIPPED: { label: "Shipped", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200", IconComp: TruckIcon },
  DELIVERED: { label: "Delivered", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", IconComp: CheckCircle2 },
  CANCELLED: { label: "Cancelled", color: "text-red-600", bg: "bg-red-50", border: "border-red-200", IconComp: XCircle },
};

// ── Helpers ────────────────────────────────────────────────────────
const formatDate = (iso: string) => {
  if (!iso) return { date: "N/A", time: "" };
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;

  return {
    date: `${day}-${month}-${year}`,
    time: `${hours}:${minutes} ${ampm}`,
  };
};

const formatCurrency = (v: number) => `₹${v.toFixed(2)}`;

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const AVATAR_COLORS = [
  "bg-blue-500", "bg-[#155dfc]", "bg-emerald-500",
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
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${cfg.color} ${cfg.bg} ${cfg.border}`}
    >
      <Icon size={10} />
      {cfg.label}
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
const OrderRowDetail = ({ order, onStatusUpdate }: { order: Order, onStatusUpdate: (id: string, st: OrderStatus) => void }) => {
  return (
    <tr>
      <td colSpan={7} className="px-0 pb-1 pt-0">
        <div className="mx-4 mb-3 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
          {/* Inner header */}
          <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">
              Items Summary:
            </p>
            <div className="flex gap-2">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => onStatusUpdate(order.id, key as OrderStatus)}
                  className={`text-[10px] px-2 py-1 rounded-md border transition ${order.order_status === key ? 'bg-[#155dfc] text-white border-[#155dfc]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                >
                  Mark {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Items table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 border-b border-gray-100">
                  <th className="px-5 py-2.5 text-left">Product</th>
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
                        <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                          {item.variant.product.images[0]?.image_url ? (
                            <img src={item.variant.product.images[0].image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package size={16} className="text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{item.variant.product.product_name}</p>
                          <p className="text-[10px] text-gray-400">{item.variant.weight || item.variant.size || "Standard"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <code className="text-xs bg-white text-gray-500 px-2 py-0.5 rounded-md border border-gray-200 font-mono">
                        {item.variant.sku}
                      </code>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{item.quantity}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals + Actions */}
          <div className="flex flex-wrap justify-between items-end px-5 py-4 border-t border-gray-100 gap-4">
            <div className="text-xs text-gray-500 italic">
              Payment via {order.payment?.payment_method || "N/A"} ({order.payment?.status || "PENDING"})
            </div>

            {/* Right: price summary */}
            <div className="text-right space-y-1">
              <div className="flex items-center justify-end gap-8 pt-1">
                <span className="text-sm font-bold text-gray-900">Total Amount:</span>
                <span className="text-sm font-bold text-gray-900 min-w-[64px] text-right">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};

// ── Generate Invoice ───────────────────────────────────────────────
const generateInvoice = (order: Order) => {
  const { date } = formatDate(order.created_at);
  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = Math.round(subtotal * 0.18 * 100) / 100; // 18% GST
  const shipping = 0; // free shipping
  const total = order.total_amount;

  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0">
          <div style="font-weight:600;color:#1a1a2e">${item.variant.product.product_name}</div>
          <div style="font-size:11px;color:#888;margin-top:2px">${item.variant.weight || item.variant.size || "Standard"} &nbsp;|&nbsp; SKU: ${item.variant.sku}</div>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:center;color:#555">${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;color:#555">&#8377;${item.price.toFixed(2)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;color:#4f46e5">&#8377;${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice – ${order.order_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #333; font-size: 13px; }
    .page { max-width: 780px; margin: 0 auto; padding: 48px 40px; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print { display: none !important; } }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px">
    <div>
      <div style="font-size:26px;font-weight:800;color:#4f46e5;letter-spacing:-0.5px">&#9670; KurmInfo</div>
      <div style="font-size:12px;color:#888;margin-top:4px">Your trusted e-commerce store</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:22px;font-weight:700;color:#1a1a2e">INVOICE</div>
      <div style="margin-top:6px;font-size:12px;color:#666">
        <div><strong>Invoice #:</strong> ${order.order_number}</div>
        <div><strong>Date:</strong> ${date}</div>
        <div><strong>Status:</strong>
          <span style="background:#e0e7ff;color:#4f46e5;padding:1px 8px;border-radius:20px;font-size:11px;font-weight:600">${order.order_status}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Divider -->
  <div style="height:3px;background:linear-gradient(90deg,#4f46e5,#818cf8,transparent);border-radius:4px;margin-bottom:32px"></div>

  <!-- Bill To + Ship To -->
  <div style="display:flex;gap:40px;margin-bottom:32px">
    <div style="flex:1">
      <div style="font-size:11px;font-weight:700;color:#4f46e5;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Bill To</div>
      <div style="font-weight:600;font-size:14px;color:#1a1a2e">${order.user?.full_name || 'Guest'}</div>
      <div style="color:#666;margin-top:2px">${order.user?.email || ''}</div>
    </div>
    <div style="flex:1">
      <div style="font-size:11px;font-weight:700;color:#4f46e5;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Ship To</div>
      <div style="color:#555;line-height:1.6">
        ${order.shipping_address}<br/>
        ${order.shipping_city}, ${order.shipping_state} – ${order.shipping_pincode}<br/>
        ${order.shipping_country}
      </div>
    </div>
    <div style="flex:1">
      <div style="font-size:11px;font-weight:700;color:#4f46e5;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Payment</div>
      <div style="color:#555;line-height:1.6">
        <div>Method: <strong>${order.payment?.payment_method || 'N/A'}</strong></div>
        <div>Status: <strong>${order.payment?.status || 'PENDING'}</strong></div>
      </div>
    </div>
  </div>

  <!-- Items Table -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <thead>
      <tr style="background:#4f46e5;color:#fff">
        <th style="padding:12px;text-align:left;border-radius:8px 0 0 0;font-size:12px">Item</th>
        <th style="padding:12px;text-align:center;font-size:12px">Qty</th>
        <th style="padding:12px;text-align:right;font-size:12px">Unit Price</th>
        <th style="padding:12px;text-align:right;border-radius:0 8px 0 0;font-size:12px">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <!-- Totals -->
  <div style="display:flex;justify-content:flex-end">
    <div style="width:280px">
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f0f0;color:#555">
        <span>Subtotal</span><span>&#8377;${subtotal.toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f0f0;color:#555">
        <span>GST (18%)</span><span>&#8377;${tax.toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f0f0;color:#555">
        <span>Shipping</span><span>${shipping === 0 ? 'Free' : '&#8377;' + shipping}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:16px;font-weight:700;color:#4f46e5">
        <span>Total</span><span>&#8377;${total.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div style="margin-top:48px;padding-top:20px;border-top:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center">
    <div style="font-size:11px;color:#aaa">Thank you for shopping with us!</div>
    <div style="font-size:11px;color:#aaa">Generated on ${new Date().toLocaleDateString('en-IN')}</div>
  </div>

  <!-- Print Button -->
  <div class="no-print" style="text-align:center;margin-top:32px">
    <button onclick="window.print()" style="background:#4f46e5;color:#fff;border:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">&#128438; Print / Save as PDF</button>
  </div>

</div>
</body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Invoice-${order.order_number}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ── Context Menu (3-dot) ───────────────────────────────────────────
interface RowMenuProps {
  order: Order;
  onDelete: (o: Order) => void;
  onView: (o: Order) => void;
}
const RowMenu = ({ order, onDelete, onView }: RowMenuProps) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = React.useRef<HTMLButtonElement>(null);

  const handleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((p) => !p);
  };

  return (
    <div>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div
            style={{ top: pos.top, right: pos.right }}
            className="fixed z-[9999] bg-white rounded-xl border border-gray-100 shadow-2xl py-1 min-w-[170px]"
          >
            <button
              onClick={() => { onView(order); setOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition"
            >
              <Eye size={13} /> View Details
            </button>
            <button
              onClick={() => { generateInvoice(order); setOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition"
            >
              <Printer size={13} /> Generate Invoice
            </button>
            <div className="my-1 border-t border-gray-100" />
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
  const { date, time } = formatDate(order.created_at);
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
            <h2 className="text-lg font-bold text-gray-900">Order #{order.order_number}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Placed on {date} at {time}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.order_status} />
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500">
              <XCircle size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Customer info */}
          <div className="flex items-start gap-4 bg-gray-50 rounded-xl p-4">
            <div className={`w-11 h-11 rounded-full ${avatarColor(order.user?.full_name || "Guest")} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
              {initials(order.user?.full_name || "Guest")}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{order.user?.full_name || "Guest User"}</p>
              <p className="text-xs text-gray-500 mt-0.5">{order.user?.email || "No email provided"}</p>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500">
                <MapPin size={11} />
                {order.shipping_address}, {order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}
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
                        <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden text-base shrink-0">
                          {item.variant.product.images[0]?.image_url ? (
                            <img src={item.variant.product.images[0].image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package size={14} className="text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-xs">{item.variant.product.product_name}</p>
                          <p className="text-[10px] text-gray-400">{item.variant.weight || item.variant.size || "Standard"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">{item.variant.sku}</code>
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
            <div className="flex justify-between text-base font-bold text-gray-900">
              <span>Grand Total</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
            <div className="text-[10px] text-gray-400 pt-2 border-t border-gray-200">
              Payment Method: {order.payment?.payment_method || "N/A"} | Status: {order.payment?.status || "PENDING"}
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button className="flex-1 flex items-center justify-center gap-2 bg-[#155dfc] hover:bg-[#1246cc] text-white py-2.5 rounded-xl text-sm font-semibold transition">
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
const ITEMS_PER_PAGE = 7;

export default function OrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // ── Separate all-orders fetch for stat cards (unfiltered) ─────────
  const [allOrders, setAllOrders] = React.useState<Order[]>([]);
  React.useEffect(() => {
    axios.get("/api/orders?limit=1000").then((res) => {
      setAllOrders(res.data?.data ?? []);
    }).catch(() => { });
  }, []);

  // ── Fetch Data (server-side filtered + paginated) ─────────────────
  const fetchOrders = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter && statusFilter !== "All") params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", String(ITEMS_PER_PAGE));

      const res = await axios.get(`/api/orders?${params.toString()}`);
      setOrders(res.data?.data ?? []);
      setTotalPages(res.data?.totalPages ?? 1);
      setTotalCount(res.data?.total ?? 0);
      setError(null);
    } catch (err: any) {
      console.error("Fetch orders failed:", err);
      setError("Failed to load orders. Please try again.");
      toast.error("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  React.useEffect(() => { fetchOrders(); }, [fetchOrders]);

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

  // ── Stats (always from full unfiltered list) ───────────────────
  const stats = React.useMemo(() => {
    const totalIncome = allOrders
      .filter((o) => o.order_status === "DELIVERED")
      .reduce((s, o) => s + o.total_amount, 0);
    return {
      total: allOrders.length,
      totalIncome,
      placed: allOrders.filter((o) => o.order_status === "PLACED").length,
      confirmed: allOrders.filter((o) => o.order_status === "CONFIRMED").length,
      processing: allOrders.filter((o) => o.order_status === "PROCESSING").length,
      shipped: allOrders.filter((o) => o.order_status === "SHIPPED").length,
      delivered: allOrders.filter((o) => o.order_status === "DELIVERED").length,
      cancelled: allOrders.filter((o) => o.order_status === "CANCELLED").length,
    };
  }, [allOrders]);

  // ── paginated is just `orders` now (API already paginated) ────
  const paginated = orders;

  const handleDelete = async () => {
    if (!deleteOrder) return;
    try {
      await axios.delete(`/api/orders/${deleteOrder.id}`);
      setOrders((prev) => prev.filter((o) => o.id !== deleteOrder.id));
      setAllOrders((prev) => prev.filter((o) => o.id !== deleteOrder.id));
      toast.success("Order deleted successfully");
      setDeleteOrder(null);
    } catch (err: any) {
      console.error("Delete failed:", err);
      toast.error(err.response?.data?.error || "Failed to delete order");
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: OrderStatus) => {
    try {
      const res = await axios.patch(`/api/orders/${id}`, { order_status: newStatus });
      const updatedStatus = res.data.order_status;
      setOrders((prev) => prev.map(o => o.id === id ? { ...o, order_status: updatedStatus } : o));
      setAllOrders((prev) => prev.map(o => o.id === id ? { ...o, order_status: updatedStatus } : o));
      toast.success(`Order marked as ${newStatus}`);
    } catch (err: any) {
      console.error("Status update failed:", err);
      toast.error("Failed to update status");
    }
  };

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const ALL_STATUSES: string[] = ["All", ...Object.keys(STATUS_CONFIG)];

  return (
    <>
      <div className="min-h-screen bg-gray-50/60">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

          {/* ── Header ── */}
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Orders</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {totalCount} order{totalCount !== 1 ? "s" : ""} found
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
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 w-64 transition"
                />
              </div>
              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="border border-gray-200 bg-white text-sm px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
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
              label="Total Revenue"
              value={formatCurrency(stats.totalIncome)}
              sub={`From ${stats.delivered} delivered orders`}
              icon={<DollarSign size={18} />}
              gradient="bg-gradient-to-br from-[#155dfc] to-[#1246cc]"
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
              label="New Paced"
              value={String(stats.placed)}
              sub={`${stats.confirmed} confirmed`}
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
              label="Delivered"
              value={String(stats.delivered)}
              sub="Successfully sent"
              icon={<CheckCircle2 size={18} />}
              gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
              iconBg="bg-white/20"
            />
            <StatCard
              label="Cancelled"
              value={String(stats.cancelled)}
              sub="Orders lost"
              icon={<XCircle size={18} />}
              gradient="bg-gradient-to-br from-red-500 to-red-700"
              iconBg="bg-white/20"
            />
            <StatCard
              label="Processing"
              value={String(stats.processing)}
              sub="In preparation"
              icon={<RefreshCw size={18} />}
              gradient="bg-gradient-to-br from-indigo-500 to-indigo-700"
              iconBg="bg-white/20"
            />
            <StatCard
              label="Items Sold"
              value={String(orders.reduce((s, o) => s + o.items.reduce((is, i) => is + i.quantity, 0), 0))}
              sub="Across all orders"
              icon={<Package size={18} />}
              gradient="bg-gradient-to-br from-teal-500 to-teal-700"
              iconBg="bg-white/20"
            />
          </div>

          {/* ── Table ── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
              <Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-4" />
              <p className="text-gray-500 font-medium">Loading orders details...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-dashed border-red-200">
              <AlertCircle size={40} className="text-red-400 mb-4" />
              <p className="text-lg font-semibold text-gray-700 mb-1">{error}</p>
              <button onClick={fetchOrders} className="mt-4 px-6 py-2 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition">
                Try Again
              </button>
            </div>
          ) : orders.length === 0 ? (
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
                      <th className="px-4 py-3 text-left">Order #</th>
                      <th className="px-4 py-3 text-left">Customer</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Amount</th>
                      <th className="px-4 py-3 text-left">Location</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginated.map((order) => {
                      const isExpanded = expandedRows.has(order.id);
                      const { date, time } = formatDate(order.created_at);
                      return (
                        <React.Fragment key={order.id}>
                          <tr
                            className="hover:bg-blue-50/30 transition group"
                          >
                            {/* Order Number */}
                            <td className="px-4 py-3">
                              <span className="font-mono text-[10px] font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-lg">
                                {order.order_number}
                              </span>
                            </td>

                            {/* Customer */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-8 h-8 rounded-full ${avatarColor(order.user?.full_name || "Guest")} flex items-center justify-center text-white text-xs font-bold shrink-0`}
                                >
                                  {initials(order.user?.full_name || "Guest")}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800 leading-tight text-[11px]">
                                    {order.user?.full_name || "Guest User"}
                                  </p>
                                  <p className="text-[9px] text-gray-400">{order.user?.email || "N/A"}</p>
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3">
                              <StatusBadge status={order.order_status} />
                            </td>

                            {/* Date */}
                            <td className="px-4 py-3">
                              <div className="flex items-start gap-1.5">
                                <Calendar size={12} className="text-gray-400 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-[11px] font-medium text-gray-700">{date}</p>
                                  <p className="text-[9px] text-gray-400">{time}</p>
                                </div>
                              </div>
                            </td>

                            {/* Amount */}
                            <td className="px-4 py-3">
                              <span className="font-semibold text-gray-900 text-xs">
                                {formatCurrency(order.total_amount)}
                              </span>
                            </td>

                            {/* Address */}
                            <td className="px-4 py-3">
                              <div className="flex items-start gap-1.5 max-w-[180px]">
                                <MapPin size={12} className="text-gray-400 mt-0.5 shrink-0" />
                                <span className="text-[10px] text-gray-600 leading-snug line-clamp-2">
                                  {order.shipping_city}, {order.shipping_state}
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
                                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
                                >
                                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
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
                          {isExpanded && <OrderRowDetail key={`${order.id}-detail`} order={order} onStatusUpdate={handleStatusUpdate} />}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Pagination ── */}
          {totalCount > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-700">
                  {Math.min((page - 1) * ITEMS_PER_PAGE + 1, totalCount)}–
                  {Math.min(page * ITEMS_PER_PAGE, totalCount)}
                </span>{" "}
                of <span className="font-semibold text-gray-700">{totalCount}</span> orders
              </p>

              <div className="flex items-center gap-1">
                {/* Prev */}
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={14} /> Prev
                </button>

                {/* Smart page buttons with ellipsis */}
                {(() => {
                  const pages: (number | "...")[] = [];
                  const delta = 2; // neighbours around current page

                  const rangeStart = Math.max(2, page - delta);
                  const rangeEnd = Math.min(totalPages - 1, page + delta);

                  pages.push(1);
                  if (rangeStart > 2) pages.push("...");
                  for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
                  if (rangeEnd < totalPages - 1) pages.push("...");
                  if (totalPages > 1) pages.push(totalPages);

                  return pages.map((pg, idx) =>
                    pg === "..." ? (
                      <span key={`ellipsis-${idx}`} className="px-2 py-1.5 text-sm text-gray-400 select-none">
                        …
                      </span>
                    ) : (
                      <button
                        key={pg}
                        onClick={() => setPage(pg as number)}
                        className={`min-w-[34px] px-2.5 py-1.5 text-sm border rounded-lg transition font-medium ${pg === page
                          ? "bg-violet-600 border-violet-600 text-white shadow-sm"
                          : "border-gray-200 bg-white hover:bg-violet-50 hover:border-violet-300 text-gray-700"
                          }`}
                      >
                        {pg}
                      </button>
                    )
                  );
                })()}

                {/* Next */}
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
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
        parentTitle={`Delete Order #${deleteOrder?.order_number}?`}
        childTitle={`Are you sure you want to delete this order? This will also revert stock for any items if the order was not already cancelled.`}
      />

      {/* ── Order Detail Modal ── */}
      {viewOrder && (
        <OrderDetailModal order={viewOrder} onClose={() => setViewOrder(null)} />
      )}
    </>
  );
}