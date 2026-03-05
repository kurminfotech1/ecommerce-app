"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { RootState } from "@/redux/rootReducer";
import { getReviews, updateReviewStatus, deleteReview, Review, ReviewStatus } from "@/redux/reviews/reviewApi";
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
  BarChart2,
  ShoppingBag,
  AlertCircle,
  Eye,
} from "lucide-react";
import { DeleteModal } from "@/components/common/DeleteModal";
import { usePermission } from "@/hooks/usePermission";



// ── Helpers ────────────────────────────────────────────────────────
const formatDate = (iso: string) => {
  if (!iso) return "N/A";
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
const avatarColor = (name: string) => {
  if (!name) return AVATAR_COLORS[0];
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
};

const initials = (name: string) => {
  if (!name) return "U";
  return name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
};

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
  canUpdate,
  canDelete,
}: {
  review: Review;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  onView: () => void;
  canUpdate: boolean;
  canDelete: boolean;
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
          {canUpdate && review.status !== "Approved" && (
            <button
              onClick={() => { onApprove(); setOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition"
            >
              <CheckCircle2 size={13} /> Approve
            </button>
          )}
          {canUpdate && review.status !== "Rejected" && (
            <button
              onClick={() => { onReject(); setOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-medium text-amber-700 hover:bg-amber-50 transition"
            >
              <XCircle size={13} /> Reject
            </button>
          )}
          {canDelete && (
            <>
              <div className="my-1 border-t border-gray-100" />
              <button
                onClick={() => { onDelete(); setOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 transition"
              >
                <Trash2 size={13} /> Delete Review
              </button>
            </>
          )}
          </div>
        </>
      )}
    </div>
  );
};

// ── Detail Modal ───────────────────────────────────────────────────
const ReviewDetailModal = ({ review, onClose, onApprove, onReject, canUpdate }: {
  review: Review;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  canUpdate: boolean;
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
          <p className="text-xs text-gray-400 mt-0.5">Submitted on {formatDate(review.date)}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={review.status} />
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500">
            <XCircle size={18} />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">
          <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-xs overflow-hidden shadow-sm shrink-0">
            {review.product.image ? (
              <img src={review.product.image} alt={review.product.name} className="w-full h-full object-cover" />
            ) : (
              <ShoppingBag size={20} className="text-gray-400" />
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{review.product.name}</p>
            <span className="inline-flex items-center mt-1 gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border bg-purple-50 text-purple-700 border-purple-200">
              <ShoppingBag size={9} />{review.product.category}
            </span>
          </div>
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
          <h3 className="font-bold text-gray-900">&quot;{review.title}&quot;</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{review.body}</p>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
        {canUpdate && review.status !== "Approved" && (
          <button
            onClick={() => { onApprove(); onClose(); }}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-semibold transition"
          >
            <CheckCircle2 size={15} /> Approve Review
          </button>
        )}
        {canUpdate && review.status !== "Rejected" && (
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
            <p className="text-xs font-bold text-gray-700 mb-1">&quot;{review.title}&quot;</p>
            <p className="text-sm text-gray-600 leading-relaxed">{review.body}</p>
          </div>
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
  const dispatch = useDispatch<AppDispatch>();
  const { reviews, totalRecords, currentPage, totalPages, pageSize, loading } = useSelector((state: RootState) => state.reviews);

  // ── Permission flags ──
  const { canUpdate, canDelete } = usePermission("Reviews");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [ratingFilter, setRatingFilter] = useState<string>("All");
  const [page, setPage] = useState(1);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    dispatch(getReviews({ 
      page, 
      limit: 10, 
      search, 
      status: statusFilter, 
      rating: ratingFilter 
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, page, statusFilter, ratingFilter]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      dispatch(getReviews({ page: 1, limit: 10, search: value, status: statusFilter, rating: ratingFilter }));
    }, 400);
  };

  // Expand row
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const toggleRow = (id: string) =>
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Modals
  const [deleteReviewState, setDeleteReviewState] = useState<Review | null>(null);
  const [viewReview, setViewReview] = useState<Review | null>(null);

  // Actions
  const handleApprove = (id: string) => dispatch(updateReviewStatus({ id, status: "Approved" }));
  const handleReject = (id: string) => dispatch(updateReviewStatus({ id, status: "Rejected" }));
  const handleDelete = () => {
    if (!deleteReviewState) return;
    dispatch(deleteReview(deleteReviewState.id));
    setDeleteReviewState(null);
  };

  // Stats
  const stats = useMemo(() => {
    const total = reviews.length; // Actually totalRecords is better, but this gives current page stats. Let's just use it on the current payload or an overview api.
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
    return { total: totalRecords || 0, approved, pending, rejected, avgRating, byRating };
  }, [reviews, totalRecords]);

  const handleFilter = (setter: React.Dispatch<React.SetStateAction<string>>) => (v: string) => {
    setter(v);
    setPage(1);
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
                {totalRecords} review{totalRecords !== 1 ? "s" : ""} found
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
          {reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mb-4">
                <MessageSquare size={28} className="text-violet-400" />
              </div>
              <p className="text-lg font-semibold text-gray-700 mb-1">No reviews found</p>
              <p className="text-sm text-gray-400">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-sm">
              <div className="w-full">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      <th className="px-4 py-3 text-left">#</th>
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
                    {reviews.map((review, index) => {
                      const isExpanded = expandedRows.has(review.id);
                      return (
                        <React.Fragment key={review.id}>
                          <tr className="hover:bg-violet-50/30 transition group">
                            {/* Number */}
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-lg">
                                {(page - 1) * 10 + index + 1}
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
                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
                                  {review.product.image ? (
                                    <img src={review.product.image} alt={review.product.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <ShoppingBag size={14} className="text-gray-400" />
                                  )}
                                </div>
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
                              </div>
                            </td>

                            {/* Title (truncated) */}
                            <td className="px-4 py-3">
                              <p className="text-xs text-gray-700 font-medium max-w-[160px] truncate">
                                {review.title}
                              </p>
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
                                {canUpdate && review.status === "Pending" && (
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
                                  onDelete={() => setDeleteReviewState(review)}
                                  onView={() => setViewReview(review)}
                                  canUpdate={canUpdate}
                                  canDelete={canDelete}
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
                Page {page} of {totalPages}&nbsp;·&nbsp;{totalRecords} reviews
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
        open={!!deleteReviewState}
        onClose={() => setDeleteReviewState(null)}
        onConfirm={handleDelete}
        parentTitle="Delete Review?"
        childTitle={`This will permanently delete the review by ${deleteReviewState?.customer.name} for "${deleteReviewState?.product.name}". This action cannot be undone.`}
      />

      {/* ── Detail Modal ── */}
      {viewReview && (
        <ReviewDetailModal
          review={viewReview}
          onClose={() => setViewReview(null)}
          onApprove={() => { handleApprove(viewReview.id); setViewReview(null); }}
          onReject={() => { handleReject(viewReview.id); setViewReview(null); }}
          canUpdate={canUpdate}
        />
      )}
    </>
  );
}