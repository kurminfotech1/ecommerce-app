"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Trash2,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  BarChart2,
  ShoppingBag,
  AlertCircle,
  Eye,
} from "lucide-react";
import { DeleteModal } from "@/components/common/DeleteModal";

// ── Types ──────────────────────────────────────────────────────────
type ReviewStatus = "Pending" | "Approved" | "Rejected";

interface Review {
  id: string;
  customer: {
    name: string;
    email: string;
  };
  product: {
    name: string;
    image: string;
    category: string;
  };
  rating: number; // 1–5
  title: string;
  body: string;
  status: ReviewStatus;
  date: string;
  helpful: number;
  notHelpful: number;
  verified: boolean;
}

// ── Mock Data ──────────────────────────────────────────────────────
const MOCK_REVIEWS: Review[] = [
  {
    id: "REV-001",
    customer: { name: "John Doe", email: "john@example.com" },
    product: { name: "Wireless Headphones", image: "🎧", category: "Electronics" },
    rating: 5,
    title: "Absolutely amazing sound quality!",
    body: "These headphones completely blew me away. The noise cancellation is top-notch, battery life is incredible, and the sound is crystal clear. Highly recommend to anyone who loves music.",
    status: "Approved",
    date: "2025-06-10T10:31:00Z",
    helpful: 42,
    notHelpful: 3,
    verified: true,
  },
  {
    id: "REV-002",
    customer: { name: "Jane Smith", email: "jane@example.com" },
    product: { name: "Mechanical Keyboard", image: "⌨️", category: "Accessories" },
    rating: 4,
    title: "Great keyboard, minor issues",
    body: "The typing experience is fantastic and the RGB is beautiful. Only minor complaint is that the software can be a bit finicky on initial setup, but after that it works perfectly.",
    status: "Approved",
    date: "2025-06-08T14:20:00Z",
    helpful: 28,
    notHelpful: 2,
    verified: true,
  },
  {
    id: "REV-003",
    customer: { name: "Mike Johnson", email: "mike@example.com" },
    product: { name: "Running Shoes", image: "👟", category: "Footwear" },
    rating: 2,
    title: "Disappointed with the quality",
    body: "The shoes look great in the photos but the actual product feels very cheap. The sole started peeling after just two weeks of moderate use. Not worth the price at all.",
    status: "Pending",
    date: "2025-06-09T09:15:00Z",
    helpful: 15,
    notHelpful: 1,
    verified: true,
  },
  {
    id: "REV-004",
    customer: { name: "Emily Davis", email: "emily@example.com" },
    product: { name: "Smart Watch", image: "⌚", category: "Electronics" },
    rating: 5,
    title: "Best smartwatch I've ever owned",
    body: "Everything about this watch is premium. The display is gorgeous, the fitness tracking is accurate, and battery lasts 3 full days. The integration with my phone is seamless.",
    status: "Approved",
    date: "2025-06-07T16:45:00Z",
    helpful: 67,
    notHelpful: 5,
    verified: false,
  },
  {
    id: "REV-005",
    customer: { name: "Robert Wilson", email: "robert@example.com" },
    product: { name: "Noise Cancelling Earbuds", image: "🎵", category: "Electronics" },
    rating: 3,
    title: "Decent but overpriced",
    body: "Sound quality is good but not exceptional for this price range. The ANC works well in quiet environments but struggles with loud noise. Fit could be better for long listening sessions.",
    status: "Pending",
    date: "2025-06-10T08:00:00Z",
    helpful: 9,
    notHelpful: 4,
    verified: true,
  },
  {
    id: "REV-006",
    customer: { name: "Sarah Connor", email: "sarah@example.com" },
    product: { name: "Yoga Mat", image: "🧘", category: "Fitness" },
    rating: 5,
    title: "Perfect for daily yoga practice",
    body: "This mat is thick, grippy, and easy to clean. I use it every day and it still looks brand new after 3 months. The carrying strap is a nice bonus. Totally worth every penny!",
    status: "Approved",
    date: "2025-06-05T11:30:00Z",
    helpful: 33,
    notHelpful: 0,
    verified: true,
  },
  {
    id: "REV-007",
    customer: { name: "Chris Evans", email: "chris@example.com" },
    product: { name: "Coffee Machine", image: "☕", category: "Kitchen" },
    rating: 1,
    title: "Terrible - broke after 2 weeks",
    body: "This coffee machine stopped working after just two weeks. The water pump made a terrible noise and then completely died. Customer service was unhelpful. Avoid at all costs!",
    status: "Rejected",
    date: "2025-06-04T13:00:00Z",
    helpful: 22,
    notHelpful: 8,
    verified: true,
  },
  {
    id: "REV-008",
    customer: { name: "Lisa Park", email: "lisa@example.com" },
    product: { name: "Monitor 27\"", image: "🖥️", category: "Electronics" },
    rating: 4,
    title: "Sharp display, great for work",
    body: "Colors are vivid and accurate straight out of the box. The 4K resolution makes text incredibly sharp for long work sessions. Only wish it had built-in speakers.",
    status: "Pending",
    date: "2025-06-10T12:00:00Z",
    helpful: 5,
    notHelpful: 1,
    verified: true,
  },
  {
    id: "REV-009",
    customer: { name: "Tom Brady", email: "tom@example.com" },
    product: { name: "Portable Charger", image: "🔋", category: "Accessories" },
    rating: 5,
    title: "Lifesaver on long trips!",
    body: "This power bank has saved me countless times during travel. It charged my phone 4 times on a single charge and is slim enough to fit in my pocket. Highly recommended.",
    status: "Approved",
    date: "2025-06-03T09:45:00Z",
    helpful: 51,
    notHelpful: 2,
    verified: false,
  },
  {
    id: "REV-010",
    customer: { name: "Mia Stone", email: "mia@example.com" },
    product: { name: "Desk Lamp", image: "💡", category: "Home & Office" },
    rating: 4,
    title: "Great lamp, stylish design",
    body: "The adjustable brightness and color temperature are perfect for late-night work. The build quality feels solid and the minimalist design looks great on my desk.",
    status: "Approved",
    date: "2025-06-01T17:20:00Z",
    helpful: 19,
    notHelpful: 1,
    verified: true,
  },
  {
    id: "REV-011",
    customer: { name: "Jake Turner", email: "jake@example.com" },
    product: { name: "Bluetooth Speaker", image: "🔊", category: "Electronics" },
    rating: 3,
    title: "Good for outdoors, lacks bass",
    body: "Waterproof and durable — perfect for outdoor use. However, the bass is quite weak for indoor listening. The 10-hour battery life is a plus though.",
    status: "Rejected",
    date: "2025-05-30T11:00:00Z",
    helpful: 7,
    notHelpful: 3,
    verified: true,
  },
  {
    id: "REV-012",
    customer: { name: "Anna Kim", email: "anna@example.com" },
    product: { name: "Gaming Mouse", image: "🖱️", category: "Accessories" },
    rating: 5,
    title: "Precision gaming perfection",
    body: "The sensor is incredibly accurate even at high DPI settings. Buttons have a satisfying click and the ergonomic shape is comfortable for hours of gaming. Best mouse I've used.",
    status: "Approved",
    date: "2025-05-28T15:30:00Z",
    helpful: 88,
    notHelpful: 4,
    verified: true,
  },
];

// ── Helpers ────────────────────────────────────────────────────────
const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const AVATAR_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500",
  "bg-amber-500", "bg-rose-500", "bg-purple-500", "bg-teal-500",
];
const avatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const initials = (name: string) =>
  name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);

// ── Star Rating ────────────────────────────────────────────────────
const StarRating = ({ rating, size = 14 }: { rating: number; size?: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        size={size}
        className={i <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}
      />
    ))}
  </div>
);

// ── Status Badge ───────────────────────────────────────────────────
const STATUS_CFG: Record<ReviewStatus, { color: string; bg: string; border: string; label: string }> = {
  Pending: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", label: "Pending" },
  Approved: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", label: "Approved" },
  Rejected: { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", label: "Rejected" },
};

const StatusBadge = ({ status }: { status: ReviewStatus }) => {
  const cfg = STATUS_CFG[status];
  const icons: Record<ReviewStatus, React.ReactNode> = {
    Pending: <Clock size={10} />,
    Approved: <CheckCircle2 size={10} />,
    Rejected: <XCircle size={10} />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {icons[status]}
      {cfg.label}
    </span>
  );
};

// ── Stat Card ──────────────────────────────────────────────────────
const StatCard = ({
  label, value, sub, icon, gradient, iconBg,
}: {
  label: string; value: string; sub?: string;
  icon: React.ReactNode; gradient: string; iconBg: string;
}) => (
  <div className={`relative rounded-2xl p-5 overflow-hidden shadow-sm border border-white/60 ${gradient}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-white/80 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
        {sub && <p className="text-xs text-white/70 mt-1">{sub}</p>}
      </div>
      <div className={`${iconBg} rounded-xl p-2.5 text-white/90`}>{icon}</div>
    </div>
    <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
    <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
  </div>
);

// ── Rating Bar ─────────────────────────────────────────────────────
const RatingBar = ({ star, count, total }: { star: number; count: number; total: number }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 w-14 shrink-0">
        <span className="text-xs font-medium text-gray-600">{star}</span>
        <Star size={11} className="text-amber-400 fill-amber-400" />
      </div>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right shrink-0">{count}</span>
    </div>
  );
};

// ── Context Menu ───────────────────────────────────────────────────
const RowMenu = ({
  review,
  onApprove,
  onReject,
  onDelete,
  onView,
}: {
  review: Review;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  onView: () => void;
}) => {
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
          <div className="absolute right-0 top-8 z-20 bg-white rounded-xl border border-gray-100 shadow-xl py-1 min-w-[150px]">
            <button
              onClick={() => { onView(); setOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition"
            >
              <Eye size={13} /> View Full Review
            </button>
            {review.status !== "Approved" && (
              <button
                onClick={() => { onApprove(); setOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition"
              >
                <CheckCircle2 size={13} /> Approve
              </button>
            )}
            {review.status !== "Rejected" && (
              <button
                onClick={() => { onReject(); setOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-medium text-amber-700 hover:bg-amber-50 transition"
              >
                <XCircle size={13} /> Reject
              </button>
            )}
            <div className="my-1 border-t border-gray-100" />
            <button
              onClick={() => { onDelete(); setOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 transition"
            >
              <Trash2 size={13} /> Delete Review
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ── Detail Modal ───────────────────────────────────────────────────
const ReviewDetailModal = ({ review, onClose, onApprove, onReject }: {
  review: Review;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) => (
  <div
    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    onClick={onClose}
  >
    <div
      className="bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Review Details</h2>
          <p className="text-xs text-gray-400 mt-0.5">{review.id} · {formatDate(review.date)}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={review.status} />
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500">
            <XCircle size={18} />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Product */}
        <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">
          <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-2xl shadow-sm shrink-0">
            {review.product.image}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{review.product.name}</p>
            <span className="inline-flex items-center mt-1 gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border bg-purple-50 text-purple-700 border-purple-200">
              <ShoppingBag size={9} />{review.product.category}
            </span>
          </div>
          {review.verified && (
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <CheckCircle2 size={9} /> Verified Purchase
            </span>
          )}
        </div>

        {/* Customer */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${avatarColor(review.customer.name)} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
            {initials(review.customer.name)}
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">{review.customer.name}</p>
            <p className="text-xs text-gray-400">{review.customer.email}</p>
          </div>
          <div className="ml-auto">
            <StarRating rating={review.rating} size={16} />
          </div>
        </div>

        {/* Review content */}
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900">"{review.title}"</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{review.body}</p>
        </div>

        {/* Helpful */}
        <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">Was this review helpful?</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <ThumbsUp size={12} /> {review.helpful}
            </span>
            <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
              <ThumbsDown size={12} /> {review.notHelpful}
            </span>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
        {review.status !== "Approved" && (
          <button
            onClick={() => { onApprove(); onClose(); }}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-semibold transition"
          >
            <CheckCircle2 size={15} /> Approve Review
          </button>
        )}
        {review.status !== "Rejected" && (
          <button
            onClick={() => { onReject(); onClose(); }}
            className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-sm font-semibold transition"
          >
            <XCircle size={15} /> Reject Review
          </button>
        )}
        <button
          onClick={onClose}
          className="px-6 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl text-sm font-semibold transition"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

// ── Expanded Row Detail ────────────────────────────────────────────
const ReviewRowDetail = ({ review }: { review: Review }) => (
  <tr>
    <td colSpan={7} className="px-0 pb-1 pt-0">
      <div className="mx-4 mb-3 bg-gray-50 rounded-xl border border-gray-100 p-5 space-y-3">
        <div className="flex items-start gap-3">
          <MessageSquare size={14} className="text-violet-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-bold text-gray-700 mb-1">"{review.title}"</p>
            <p className="text-sm text-gray-600 leading-relaxed">{review.body}</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <ThumbsUp size={12} className="text-emerald-500" />
              <span className="font-semibold text-emerald-600">{review.helpful}</span> helpful
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <ThumbsDown size={12} className="text-red-400" />
              <span className="font-semibold text-red-500">{review.notHelpful}</span> not helpful
            </span>
          </div>
          {review.verified && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <CheckCircle2 size={9} /> Verified Purchase
            </span>
          )}
        </div>
      </div>
    </td>
  </tr>
);

// ════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════
const ITEMS_PER_PAGE = 8;
const ALL_STATUSES: Array<ReviewStatus | "All"> = ["All", "Pending", "Approved", "Rejected"];
const ALL_RATINGS = ["All", "5", "4", "3", "2", "1"];

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [ratingFilter, setRatingFilter] = useState<string>("All");
  const [page, setPage] = useState(1);

  // Expand row
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const toggleRow = (id: string) =>
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Modals
  const [deleteReview, setDeleteReview] = useState<Review | null>(null);
  const [viewReview, setViewReview] = useState<Review | null>(null);

  // Actions
  const handleApprove = (id: string) =>
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Approved" as ReviewStatus } : r))
    );
  const handleReject = (id: string) =>
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Rejected" as ReviewStatus } : r))
    );
  const handleDelete = () => {
    if (!deleteReview) return;
    setReviews((prev) => prev.filter((r) => r.id !== deleteReview.id));
    setDeleteReview(null);
  };

  // Stats
  const stats = useMemo(() => {
    const total = reviews.length;
    const approved = reviews.filter((r) => r.status === "Approved").length;
    const pending = reviews.filter((r) => r.status === "Pending").length;
    const rejected = reviews.filter((r) => r.status === "Rejected").length;
    const avgRating =
      total > 0
        ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1)
        : "0.0";
    const byRating = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => r.rating === star).length,
    }));
    return { total, approved, pending, rejected, avgRating, byRating };
  }, [reviews]);

  // Filtered + paginated
  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      const matchSearch =
        r.customer.name.toLowerCase().includes(search.toLowerCase()) ||
        r.product.name.toLowerCase().includes(search.toLowerCase()) ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.id.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || r.status === statusFilter;
      const matchRating = ratingFilter === "All" || r.rating === Number(ratingFilter);
      return matchSearch && matchStatus && matchRating;
    });
  }, [reviews, search, statusFilter, ratingFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleFilter = (setter: (v: string) => void) => (v: string) => {
    setter(v); setPage(1);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50/60">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

          {/* ── Header ── */}
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Reviews</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {filtered.length} review{filtered.length !== 1 ? "s" : ""} found
              </p>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              {/* Search */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  placeholder="Search by customer, product, title..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 w-64 transition"
                />
              </div>
              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => handleFilter(setStatusFilter)(e.target.value)}
                className="border border-gray-200 bg-white text-sm px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>
                ))}
              </select>
              {/* Rating filter */}
              <select
                value={ratingFilter}
                onChange={(e) => handleFilter(setRatingFilter)(e.target.value)}
                className="border border-gray-200 bg-white text-sm px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
              >
                {ALL_RATINGS.map((r) => (
                  <option key={r} value={r}>{r === "All" ? "All Ratings" : `${r} Star${r === "1" ? "" : "s"}`}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Stats Row ── */}
          <div className="grid grid-cols-12 gap-4">
            {/* Stat cards (8 cols) */}
            <div className="col-span-12 lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label="Total Reviews"
                value={String(stats.total)}
                sub="All time"
                icon={<MessageSquare size={18} />}
                gradient="bg-gradient-to-br from-violet-600 to-violet-800"
                iconBg="bg-white/20"
              />
              <StatCard
                label="Avg Rating"
                value={stats.avgRating}
                sub="Out of 5.0"
                icon={<Star size={18} />}
                gradient="bg-gradient-to-br from-amber-500 to-amber-700"
                iconBg="bg-white/20"
              />
              <StatCard
                label="Approved"
                value={String(stats.approved)}
                sub="Published"
                icon={<CheckCircle2 size={18} />}
                gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
                iconBg="bg-white/20"
              />
              <StatCard
                label="Pending"
                value={String(stats.pending)}
                sub={`${stats.rejected} rejected`}
                icon={<AlertCircle size={18} />}
                gradient="bg-gradient-to-br from-rose-500 to-rose-700"
                iconBg="bg-white/20"
              />
            </div>

            {/* Rating breakdown (4 cols) */}
            <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-gray-900">Rating Breakdown</p>
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span className="text-sm font-bold text-gray-800">{stats.avgRating}</span>
                  <span className="text-xs text-gray-400">/ 5</span>
                </div>
              </div>
              <div className="space-y-2.5">
                {stats.byRating.map(({ star, count }) => (
                  <RatingBar key={star} star={star} count={count} total={stats.total} />
                ))}
              </div>
            </div>
          </div>

          {/* ── Table ── */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mb-4">
                <MessageSquare size={28} className="text-violet-400" />
              </div>
              <p className="text-lg font-semibold text-gray-700 mb-1">No reviews found</p>
              <p className="text-sm text-gray-400">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      <th className="px-4 py-3 text-left">ID</th>
                      <th className="px-4 py-3 text-left">Customer</th>
                      <th className="px-4 py-3 text-left">Product</th>
                      <th className="px-4 py-3 text-left">Rating</th>
                      <th className="px-4 py-3 text-left">Title</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginated.map((review) => {
                      const isExpanded = expandedRows.has(review.id);
                      return (
                        <React.Fragment key={review.id}>
                          <tr className="hover:bg-violet-50/30 transition group">
                            {/* ID */}
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-lg">
                                {review.id}
                              </span>
                            </td>

                            {/* Customer */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-8 h-8 rounded-full ${avatarColor(review.customer.name)} flex items-center justify-center text-white text-xs font-bold shrink-0`}
                                >
                                  {initials(review.customer.name)}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800 text-xs leading-tight">
                                    {review.customer.name}
                                  </p>
                                  <p className="text-[10px] text-gray-400">{review.customer.email}</p>
                                </div>
                              </div>
                            </td>

                            {/* Product */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{review.product.image}</span>
                                <div>
                                  <p className="text-xs font-medium text-gray-800 leading-tight max-w-[120px] truncate">
                                    {review.product.name}
                                  </p>
                                  <p className="text-[10px] text-gray-400">{review.product.category}</p>
                                </div>
                              </div>
                            </td>

                            {/* Rating */}
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                <StarRating rating={review.rating} />
                                {review.verified && (
                                  <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                                    <CheckCircle2 size={9} /> Verified
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Title (truncated) */}
                            <td className="px-4 py-3">
                              <p className="text-xs text-gray-700 font-medium max-w-[160px] truncate">
                                {review.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="flex items-center gap-0.5 text-[10px] text-emerald-600">
                                  <ThumbsUp size={9} /> {review.helpful}
                                </span>
                                <span className="flex items-center gap-0.5 text-[10px] text-red-400">
                                  <ThumbsDown size={9} /> {review.notHelpful}
                                </span>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3">
                              <StatusBadge status={review.status} />
                            </td>

                            {/* Date */}
                            <td className="px-4 py-3">
                              <span className="text-xs text-gray-600">{formatDate(review.date)}</span>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-0.5">
                                {/* Quick approve/reject inline */}
                                {review.status === "Pending" && (
                                  <>
                                    <button
                                      onClick={() => handleApprove(review.id)}
                                      title="Approve"
                                      className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600 transition"
                                    >
                                      <CheckCircle2 size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleReject(review.id)}
                                      title="Reject"
                                      className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition"
                                    >
                                      <XCircle size={14} />
                                    </button>
                                  </>
                                )}
                                {/* Expand/collapse */}
                                <button
                                  onClick={() => toggleRow(review.id)}
                                  title={isExpanded ? "Collapse" : "Expand"}
                                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"
                                >
                                  {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                </button>
                                {/* 3-dot menu */}
                                <RowMenu
                                  review={review}
                                  onApprove={() => handleApprove(review.id)}
                                  onReject={() => handleReject(review.id)}
                                  onDelete={() => setDeleteReview(review)}
                                  onView={() => setViewReview(review)}
                                />
                              </div>
                            </td>
                          </tr>

                          {/* Expanded row */}
                          {isExpanded && (
                            <ReviewRowDetail key={`${review.id}-detail`} review={review} />
                          )}
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
                Page {page} of {totalPages}&nbsp;·&nbsp;{filtered.length} reviews
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
        open={!!deleteReview}
        onClose={() => setDeleteReview(null)}
        onConfirm={handleDelete}
        parentTitle={`Delete Review ${deleteReview?.id}?`}
        childTitle={`This will permanently delete the review by ${deleteReview?.customer.name} for "${deleteReview?.product.name}". This action cannot be undone.`}
      />

      {/* ── Detail Modal ── */}
      {viewReview && (
        <ReviewDetailModal
          review={viewReview}
          onClose={() => setViewReview(null)}
          onApprove={() => { handleApprove(viewReview.id); setViewReview(null); }}
          onReject={() => { handleReject(viewReview.id); setViewReview(null); }}
        />
      )}
    </>
  );
}