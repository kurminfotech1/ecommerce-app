"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { RootState } from "@/redux/rootReducer";
import {
  getCategories,
  createCategory,
  deleteCategory,
  updateCategory,
  Category,
} from "@/redux/categories/categoriesApi";
import {
  ChevronDown,
  Pencil,
  Plus,
  Trash2,
  X,
  Check,
  Tag,
  Loader2,
} from "lucide-react";
import { DeleteModal } from "@/components/common/DeleteModal";

// --- Custom Modal ---
interface ModalProps {
  title: string;
  defaultValue?: string;
  defaultStatus?: boolean;
  onConfirm: (v: string, status: boolean) => void;
  onClose: () => void;
  loading?: boolean;
}

function CatModal({ title, defaultValue = "", defaultStatus = true, onConfirm, onClose, loading }: ModalProps) {
  const [v, setV] = useState(defaultValue);
  const [status, setStatus] = useState(defaultStatus);
  return (
    <div className="c-backdrop" onClick={onClose}>
      <div className="c-modal" onClick={e => e.stopPropagation()}>
        <div className="c-modal-head">
          <h3>{title}</h3>
          <button className="c-modal-x" onClick={onClose}><X size={17} /></button>
        </div>
        <div className="flex flex-col gap-4 py-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase">Category Name</label>
            <input
              autoFocus
              className="c-input"
              placeholder="Category name"
              value={v}
              onChange={e => setV(e.target.value)}
              onKeyDown={e => e.key === "Enter" && v.trim() && onConfirm(v.trim(), status)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase">Status</label>
            <select 
              className="c-input cursor-pointer"
              value={status ? "active" : "inactive"}
              onChange={e => setStatus(e.target.value === "active")}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className="c-modal-foot">
          <button className="c-btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="c-btn-primary"
            disabled={!v.trim() || loading}
            onClick={() => v.trim() && onConfirm(v.trim(), status)}
          >
            {loading ? <Loader2 className="animate-spin" size={15} /> : <Check size={15} />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Page State Types ---
interface ModalState {
  type: "add" | "edit";
  editing?: Category;
}

export default function CategoriesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { categories, loading, isSubmitting, totalRecords, currentPage, totalPages } =
    useSelector((s: RootState) => s.categories);

  const [modal, setModal] = useState<ModalState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);

  /* ── Search, Sort, Filter & Pagination ──────────── */
  const [search, setSearch]   = useState("");
  const [page,   setPage]     = useState(1);
  const [sortBy, setSortBy]   = useState("newest");
  const [status, setStatus]   = useState("all");
  const [limit,  setLimit]    = useState(10);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCategories = useCallback(
    (p: number, q: string, sort: string, st: string, lim: number) => {
      dispatch(getCategories({ search: q, page: p, limit: lim, sortBy: sort, status: st }));
    },
    [dispatch]
  );

  useEffect(() => {
    fetchCategories(page, search, sortBy, status, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy, status, limit, fetchCategories]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchCategories(1, value, sortBy, status, limit);
    }, 400);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setPage(1);
  };

  const handleLimitChange = (value: number) => {
    setLimit(value);
    setPage(1);
  };

  const toSlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

  const refresh = () => fetchCategories(page, search, sortBy, status, limit);

  const handleConfirm = async (name: string, is_active: boolean) => {
    if (!modal) return;
    try {
      if (modal.type === "add") {
        await dispatch(createCategory({ name, slug: toSlug(name), is_active })).unwrap();
      } else if (modal.type === "edit" && modal.editing) {
        await dispatch(updateCategory({ id: modal.editing.id, name, slug: toSlug(name), parentId: modal.editing.parentId, is_active })).unwrap();
      }
      await refresh();
      setModal(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (cat: Category) => {
    try {
      await dispatch(deleteCategory(cat.id)).unwrap();
      await refresh();
      setConfirmDelete(null);
    } catch (e) {
      console.error(e);
    }
  };

  const modalTitle = modal?.type === "add" ? "Add Category" : modal?.editing ? `Edit Category` : "";

  /* ── Pagination page numbers ───────────────────── */
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end   = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const pgBtnBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 32,
    height: 32,
    fontSize: ".8rem",
    fontWeight: 500,
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    background: "#fff",
    color: "#374151",
    cursor: "pointer",
    transition: "all .15s",
  };

  return (
    <>
      <div className="c-page">
        {/* ── Top bar ── */}
        <div className="c-topbar">
          <div className="c-topbar-title">
            <Tag size={20} />
            Manage Categories
          </div>
          <button className="c-btn-add" onClick={() => setModal({ type: "add" })}>
            <Plus size={15} /> Add Category
          </button>
        </div>

        {/* ── Filters row ── */}
        <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
          <div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-80">
            <svg
              xmlns="http://www.w3.org/2000/svg" width="15" height="15"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              style={{
                width: "100%",
                paddingLeft: 32,
                paddingRight: 12,
                paddingTop: 8,
                paddingBottom: 8,
                fontSize: ".82rem",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                outline: "none",
                background: "#fff",
                transition: "border-color .2s",
              }}
              onFocus={e => (e.target.style.borderColor = "#818cf8")}
              onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto sm:contents">
            <select
              value={sortBy}
              onChange={e => handleSortChange(e.target.value)}
              style={{
                padding: "7px 28px 7px 12px",
                fontSize: ".82rem",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                outline: "none",
                background: "#fff",
                color: "#374151",
                cursor: "pointer",
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m2 4 4 4 4-4'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 10px center",
                transition: "border-color .2s",
              }}
              className="flex-1 min-w-0 sm:flex-none sm:min-w-[140px]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">A → Z</option>
              <option value="name_desc">Z → A</option>
            </select>

            <div className="flex items-center gap-1.5 w-full lg:w-auto lg:ml-auto justify-between lg:justify-end">
              <label style={{ fontSize: ".78rem", color: "#6b7280" , fontWeight: 600}}>Total Rows:</label>
              <select
                value={limit}
                onChange={e => handleLimitChange(Number(e.target.value))}
                style={{
                  padding: "5px 24px 5px 8px",
                  fontSize: ".82rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  outline: "none",
                  background: "#fff",
                  color: "#374151",
                  cursor: "pointer",
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m2 4 4 4 4-4'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                  minWidth: 80,
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
              </select>
            </div>
          </div>
        </div>

          {/* skeleton */}
          {loading && categories.length === 0 && Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="c-skel"><div className="c-skel-h" /></div>
          ))}

          {/* empty */}
          {!loading && categories.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300 text-gray-400">
              <Tag size={38} className="mb-3 opacity-30" />
              <p className="font-semibold text-gray-700 mb-1">
                {search || status !== "all" ? "No categories found" : "No categories yet"}
              </p>
              <p className="text-sm">
                {search
                  ? `No results for "${search}". Try a different keyword.`
                  : status !== "all"
                    ? `No ${status} categories found.`
                    : 'Click "Add Category" to get started'}
              </p>
            </div>
          )}

          {/* Table Area */}
          {!loading && categories.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-100 tracking-wide text-xs uppercase">
                    <tr>
                      <th className="px-6 py-4 w-20">No</th>
                      <th className="px-6 py-4">Category Name</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4">Created At</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {categories.map((cat, idx) => (
                      <tr key={cat.id} className="hover:bg-violet-50/30 transition group">
                        <td className="px-6 py-4 text-gray-500 font-medium">
                          {(currentPage - 1) * limit + idx + 1}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-800">{cat.name}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            cat.is_active 
                              ? "bg-green-100 text-green-700 border border-green-200" 
                              : "bg-red-100 text-red-700 border border-red-200"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${cat.is_active ? "bg-green-500" : "bg-red-500"}`} />
                            {cat.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {cat.created_at ? new Date(cat.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setModal({ type: "edit", editing: cat })}
                              className="c-icon-btn-edit"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(cat)}
                              className="c-icon-btn-del"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
            
            {/* Pagination Box */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 10,
                  marginTop: 16,
                  padding: "10px 16px",
                  borderTop: "1px solid #e5e7eb",
                  background: "rgba(249,250,251,0.3)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: ".8rem", color: "#6b7280" }}>
                    Showing {(currentPage - 1) * limit + 1}–{Math.min(currentPage * limit, totalRecords)} of {totalRecords}
                  </span>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setPage(p => p - 1)}
                    style={{
                      ...pgBtnBase,
                      color: currentPage <= 1 ? "#d1d5db" : "#374151",
                      cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                    }}
                  >
                    <ChevronDown size={15} className="rotate-90" />
                  </button>

                  {getPageNumbers().map((pg, i) =>
                    pg === "..." ? (
                      <span key={`dots-${i}`} style={{ padding: "0 4px", fontSize: ".8rem", color: "#9ca3af" }}>...</span>
                    ) : (
                      <button
                        key={pg}
                        onClick={() => setPage(pg as number)}
                        style={{
                          ...pgBtnBase,
                          background: pg === currentPage ? "#4f46e5" : "#fff",
                          color: pg === currentPage ? "#fff" : "#374151",
                          borderColor: pg === currentPage ? "#4f46e5" : "#e5e7eb",
                          fontWeight: pg === currentPage ? 600 : 500,
                        }}
                      >
                        {pg}
                      </button>
                    )
                  )}

                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    style={{
                      ...pgBtnBase,
                      color: currentPage >= totalPages ? "#d1d5db" : "#374151",
                      cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                    }}
                  >
                    <ChevronDown size={15} className="-rotate-90" />
                  </button>
                </div>
              </div>
            )}
            </div>
          )}
      </div>

      {/* Modals */}
      {modal && (
        <CatModal
          title={modalTitle}
          defaultValue={modal.type === "edit" ? modal.editing?.name : ""}
          defaultStatus={modal.type === "edit" ? modal.editing?.is_active : true}
          onConfirm={handleConfirm}
          onClose={() => !isSubmitting && setModal(null)}
          loading={isSubmitting || loading}
        />
      )}
      {confirmDelete && (
        <DeleteModal
          open={!!confirmDelete}
          parentTitle="Delete category?"
          childTitle={`"${confirmDelete.name}" will be permanently deleted.`}
          onConfirm={() => handleDelete(confirmDelete)}
          onClose={() => !isSubmitting && setConfirmDelete(null)}
          loading={isSubmitting || loading}
        />
      )}
    </>
  );
}
