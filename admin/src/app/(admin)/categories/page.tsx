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
  toggleCategoryStatus,
  Category,
} from "@/redux/categories/categoriesApi";
import {
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  X,
  Check,
  Tag,
  Loader2,
} from "lucide-react";
import { DeleteModal } from "@/components/common/DeleteModal";
import { PopConfirm } from "@/components/common/PopConfirm";


/* ═══════════════════════════════════════════════════════════
   CONTEXT MENU
═══════════════════════════════════════════════════════════ */
interface CtxItem {
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  success?: boolean;
  onClick: () => void;
}
interface CtxMenuProps { items: CtxItem[]; onClose: () => void; }

function CtxMenu({ items, onClose }: CtxMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  return (
    <div className="c-ctx-menu" ref={ref}>
      {items.map((item, i) => (
        <button
          key={i}
          className={`c-ctx-item${item.danger ? " danger" : ""}${item.success ? " success" : ""}`}
          onClick={() => { item.onClick(); onClose(); }}
        >
          <span className="c-ctx-icon">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ADD / EDIT MODAL
═══════════════════════════════════════════════════════════ */
interface ModalProps {
  title: string;
  defaultValue?: string;
  onConfirm: (v: string) => void;
  onClose: () => void;
  loading?: boolean;
}
function CatModal({ title, defaultValue = "", onConfirm, onClose, loading }: ModalProps) {
  const [v, setV] = useState(defaultValue);
  return (
    <div className="c-backdrop" onClick={onClose}>
      <div className="c-modal" onClick={e => e.stopPropagation()}>
        <div className="c-modal-head">
          <h3>{title}</h3>
          <button className="c-modal-x" onClick={onClose}><X size={17} /></button>
        </div>
        <input
          autoFocus
          className="c-input"
          placeholder="Category name"
          value={v}
          onChange={e => setV(e.target.value)}
          onKeyDown={e => e.key === "Enter" && v.trim() && onConfirm(v.trim())}
        />
        <div className="c-modal-foot">
          <button className="c-btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="c-btn-primary"
            disabled={!v.trim() || loading}
            onClick={() => v.trim() && onConfirm(v.trim())}
          >
            {loading ? <Loader2 className="animate-spin" size={15} /> : <Check size={15} />} Save
          </button>
        </div>
      </div>
    </div>
  );
}



/* ═══════════════════════════════════════════════════════════
   INLINE SWITCH (pure CSS, no internal state)
═══════════════════════════════════════════════════════════ */
const CatSwitch = React.forwardRef<
  HTMLButtonElement,
  { checked: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ checked, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    role="switch"
    aria-checked={checked}
    className={`c-switch ${checked ? "c-switch--on" : "c-switch--off"}`}
    {...props}
  >
    <span className="c-switch-knob" />
  </button>
));
CatSwitch.displayName = "CatSwitch";

/* ═══════════════════════════════════════════════════════════
   SUB-CATEGORY COLUMN  (one of the 3 cols)
═══════════════════════════════════════════════════════════ */
interface SubColProps {
  sub: Category;
  onAddChild: (parent: Category) => void;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  onToggleStatus: (cat: Category) => void;
}
function SubCol({ sub, onAddChild, onEdit, onDelete, onToggleStatus }: SubColProps) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen]  = useState(false);
  const [togglePopChild, setTogglePopChild] = useState<string | null>(null);
  const [togglePopSub, setTogglePopSub] = useState(false);
  const children = sub.children ?? [];

  return (
    <div className={`c-sub-col${!sub.is_active ? " c-sub-col--disabled" : ""}`}>
      {/* sub header */}
      <div className="c-sub-header">
        <div
          className="c-sub-title"
          onClick={() => setExpanded(p => !p)}
          style={{ flex: 1, cursor: "pointer" }}
        >
          <span>{sub.name.toUpperCase()}</span>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>

        <div className="c-sub-ctx" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Switch inside the sub-category header */}
          <PopConfirm
            trigger={
              <CatSwitch checked={sub.is_active} onClick={(e) => { e.stopPropagation(); }} />
            }
            title={sub.is_active ? "Deactivate Sub-Category?" : "Activate Sub-Category?"}
            description={`Are you sure you want to ${sub.is_active ? "deactivate" : "activate"} "${sub.name}"?`}
            open={togglePopSub}
            onOpenChange={setTogglePopSub}
          >
            <div className="c-pop-actions">
              <button className="c-btn-ghost c-pop-btn" onClick={() => setTogglePopSub(false)}>Cancel</button>
              <button
                className={`c-pop-btn ${sub.is_active ? "c-btn-danger" : "c-btn-primary"}`}
                onClick={() => { onToggleStatus(sub); setTogglePopSub(false); }}
              >
                {sub.is_active ? "Deactivate" : "Activate"}
              </button>
            </div>
          </PopConfirm>
          <button className="c-three-dot" onClick={() => setMenuOpen(p => !p)}>
            <MoreVertical size={15} />
          </button>
          {menuOpen && (
            <CtxMenu
              onClose={() => setMenuOpen(false)}
              items={[
                { label: "Add Child Category", icon: <Plus size={13} />, success: true, onClick: () => onAddChild(sub) },
                { label: "Edit",      icon: <Pencil size={13} />, onClick: () => onEdit(sub) },
                { label: "Delete",    icon: <Trash2 size={13} />, danger: true, onClick: () => onDelete(sub) },
              ]}
            />
          )}
        </div>
      </div>

      <div className={`c-collapse-wrap${expanded ? " is-open" : ""}`}>
        <div className="c-collapse-inner">
          {/* thin accent line — visible only when expanded */}
          <div className="c-sub-accent" />
          <div className="c-child-list">
            {children.length === 0 && (
              <span style={{ fontSize: ".74rem", color: "#9ca3af", fontStyle: "italic" }}>
                No items
              </span>
            )}
            {children.map(child => (
              <div key={child.id} className={`c-child-item${!child.is_active ? " c-child-item--disabled" : ""}`}>
                <div className="c-child-left">
                  <span className="c-child-dot" />
                  <span className={`c-child-name${!child.is_active ? " c-inactive-text" : ""}`}>{child.name}</span>
                </div>
                <div className="c-child-actions">
                  <PopConfirm
                    trigger={
                      <CatSwitch checked={child.is_active} onClick={(e) => e.stopPropagation()} />
                    }
                    title={child.is_active ? "Deactivate Category?" : "Activate Category?"}
                    description={`Are you sure you want to ${child.is_active ? "deactivate" : "activate"} "${child.name}"?`}
                    open={togglePopChild === child.id}
                    onOpenChange={(open) => setTogglePopChild(open ? child.id : null)}
                  >
                    <div className="c-pop-actions">
                      <button className="c-btn-ghost c-pop-btn" onClick={() => setTogglePopChild(null)}>Cancel</button>
                      <button
                        className={`c-pop-btn ${child.is_active ? "c-btn-danger" : "c-btn-primary"}`}
                        onClick={() => { onToggleStatus(child); setTogglePopChild(null); }}
                      >
                        {child.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </PopConfirm>
                  <button className="ib ib-blue" title="Edit" onClick={() => onEdit(child)}>
                    <Pencil size={13} />
                  </button>
                  <button className="ib ib-red" title="Delete" onClick={() => onDelete(child)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN CATEGORY CARD  (full-width accordion)
═══════════════════════════════════════════════════════════ */
interface CardProps {
  cat: Category;
  onAddSub:   (parent: Category) => void;
  onEdit:     (cat: Category)    => void;
  onDelete:   (cat: Category)    => void;
  onToggleStatus: (cat: Category) => void;
}
function MainCard({ cat, onAddSub, onEdit, onDelete, onToggleStatus }: CardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [togglePopOpen, setTogglePopOpen] = useState(false);
  const subs = cat.children ?? [];

  return (
    <div className={`c-card${!cat.is_active ? " c-card--disabled" : ""}`}>
      {/* ── header row ── */}
      <div className="c-card-header">
        <div className="c-card-left">
          <span>{cat.name.toUpperCase()}</span>
          {/* inline edit pencil beside name */}
          <button
            className="c-name-edit-btn"
            title="Edit category"
            onClick={() => onEdit(cat)}
          >
            <Pencil />
          </button>
          {/* switch for active/inactive next to edit */}
          <PopConfirm
            trigger={
              <CatSwitch checked={cat.is_active} onClick={(e) => e.stopPropagation()} />
            }
            title={cat.is_active ? "Deactivate Category?" : "Activate Category?"}
            description={`Are you sure you want to ${cat.is_active ? "deactivate" : "activate"} "${cat.name}"?`}
            open={togglePopOpen}
            onOpenChange={setTogglePopOpen}
          >
            <div className="c-pop-actions">
              <button className="c-btn-ghost c-pop-btn" onClick={() => setTogglePopOpen(false)}>Cancel</button>
              <button
                className={`c-pop-btn ${cat.is_active ? "c-btn-danger" : "c-btn-primary"}`}
                onClick={() => { onToggleStatus(cat); setTogglePopOpen(false); }}
              >
                {cat.is_active ? "Deactivate" : "Activate"}
              </button>
            </div>
          </PopConfirm>
        </div>

        <div style={{ position: "relative" }}>
          <button className="c-three-dot" onClick={() => setMenuOpen(p => !p)}>
            <MoreVertical size={17} />
          </button>
          {menuOpen && (
            <CtxMenu
              onClose={() => setMenuOpen(false)}
              items={[
                { label: "Add Sub Category", icon: <Plus size={13} />, success: true,  onClick: () => onAddSub(cat) },
                { label: "Delete",           icon: <Trash2 size={13} />, danger: true, onClick: () => onDelete(cat) },
              ]}
            />
          )}
        </div>
      </div>

      {/* ── always-visible body: 3-col sub grid ── */}
      {
        subs.length === 0
          ? <div className="c-card-empty">No sub-categories yet!</div>
          : (
            <div className="c-sub-grid">
              {subs.map(sub => (
                <SubCol
                  key={sub.id}
                  sub={sub}
                  onAddChild={onAddSub}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleStatus={onToggleStatus}
                />
              ))}
            </div>
          )
      }
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */
interface ModalState {
  type: "add-main" | "add-sub" | "edit";
  parent?:  Category;
  editing?: Category;
}



export default function CategoriesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { categories, loading, isSubmitting, totalRecords, currentPage, totalPages } =
    useSelector((s: RootState) => s.categories);

  const [modal,         setModal]         = useState<ModalState | null>(null);
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

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const handleLimitChange = (value: number) => {
    setLimit(value);
    setPage(1);
  };

  const toSlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

  const refresh = () => fetchCategories(page, search, sortBy, status, limit);

  const handleConfirm = async (name: string) => {
    if (!modal) return;
    try {
      if (modal.type === "add-main") {
        await dispatch(createCategory({ name, slug: toSlug(name), is_active: true })).unwrap();
      } else if (modal.type === "add-sub" && modal.parent) {
        await dispatch(createCategory({ name, slug: toSlug(name), parentId: modal.parent.id, is_active: true })).unwrap();
      } else if (modal.type === "edit" && modal.editing) {
        await dispatch(updateCategory({ id: modal.editing.id, name, slug: toSlug(name), parentId: modal.editing.parentId })).unwrap();
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

  const handleToggleStatus = async (cat: Category) => {
    try {
      await dispatch(toggleCategoryStatus(cat.id)).unwrap();
      await refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const modalTitle =
    modal?.type === "add-main" ? "Add Main Category" :
    modal?.type === "add-sub"  ? `Add Sub Category under \u201c${modal.parent?.name}\u201d` :
    modal?.editing             ? `Edit ${!modal.editing.parentId ? "Main Category" : categories.some(c => c.id === modal.editing?.parentId) ? "Sub Category" : "Child Category"} \u201c${modal.editing.name}\u201d` : "";

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

  /* ── Shared select style ─────────────────────────── */
  const selectStyle: React.CSSProperties = {
    padding: "7px 28px 7px 12px",
    fontSize: ".82rem",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    outline: "none",
    background: "#fff",
    color: "#374151",
    cursor: "pointer",
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m2 4 4 4 4-4'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
    transition: "border-color .2s",
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
          <button className="c-btn-add" onClick={() => setModal({ type: "add-main" })}>
            <Plus size={15} /> Add Category
          </button>
        </div>

        {/* ── Filters row ── */}
        <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
          {/* Search — full width on mobile, constrained on desktop */}
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

          {/* Status + Sort — one row on mobile, inline on desktop */}
          <div className="flex gap-2 w-full sm:w-auto sm:contents">
            <select
              value={status}
              onChange={e => handleStatusChange(e.target.value)}
              style={selectStyle}
              className="flex-1 min-w-0 sm:flex-none sm:min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={sortBy}
              onChange={e => handleSortChange(e.target.value)}
              style={selectStyle}
              className="flex-1 min-w-0 sm:flex-none sm:min-w-[140px]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">A → Z</option>
              <option value="name_desc">Z → A</option>
            </select>
          </div>

          {/* Total Records + Rows — one row on mobile, pushed right on desktop */}
          <div className="flex items-center gap-2 w-full lg:w-auto lg:ml-auto justify-between lg:justify-end">
            {totalRecords > 0 && (
              <span
                style={{
                  fontSize: ".78rem",
                  fontWeight: 600,
                  color: "#6b7280",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: "7px 14px",
                  background: "#fff",
                  whiteSpace: "nowrap",
                }}
              >
                Total Records: {totalRecords}
              </span>
            )}

            <div className="flex items-center gap-1.5">
              <label style={{ fontSize: ".78rem", color: "#6b7280" , fontWeight: 600,}}>Total Rows:</label>
              <select
                value={limit}
                onChange={e => handleLimitChange(Number(e.target.value))}
                style={{ ...selectStyle, minWidth: 80, padding: "5px 24px 5px 8px" }}
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

        {/* cards */}
        {categories.length > 0 && categories.map(cat => (
          <MainCard
            key={cat.id}
            cat={cat}
            onAddSub={parent  => setModal({ type: "add-sub", parent })}
            onEdit={c         => setModal({ type: "edit", editing: c })}
            onDelete={c       => setConfirmDelete(c)}
            onToggleStatus={handleToggleStatus}
          />
        ))}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
              marginTop: 16,
              padding: "10px 0",
            }}
          >
            {/* Left: Showing + per-page */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: ".8rem", color: "#6b7280" }}>
                Showing {(currentPage - 1) * limit + 1}–{Math.min(currentPage * limit, totalRecords)} of {totalRecords}
              </span>
           
            </div>

            {/* Right: page buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {/* Prev */}
              <button
                disabled={currentPage <= 1}
                onClick={() => setPage(p => p - 1)}
                style={{
                  ...pgBtnBase,
                  color: currentPage <= 1 ? "#d1d5db" : "#374151",
                  cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                }}
              >
                <ChevronDown size={15} style={{ transform: "rotate(90deg)" }} />
              </button>

              {/* Page numbers */}
              {getPageNumbers().map((pg, i) =>
                pg === "..." ? (
                  <span key={`dots-${i}`} style={{ padding: "0 4px", fontSize: ".8rem", color: "#9ca3af" }}>…</span>
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

              {/* Next */}
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setPage(p => p + 1)}
                style={{
                  ...pgBtnBase,
                  color: currentPage >= totalPages ? "#d1d5db" : "#374151",
                  cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                }}
              >
                <ChevronDown size={15} style={{ transform: "rotate(-90deg)" }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* modals */}
      {modal && (
        <CatModal
          title={modalTitle}
          defaultValue={modal.type === "edit" ? modal.editing?.name : ""}
          onConfirm={handleConfirm}
          onClose={() => !isSubmitting && setModal(null)}
          loading={isSubmitting || loading}
        />
      )}
      {confirmDelete && (
        <DeleteModal
          open={!!confirmDelete}
          parentTitle="Delete category?"
          childTitle={`"${confirmDelete.name}" and all its sub-categories will be permanently deleted.`}
          onConfirm={() => handleDelete(confirmDelete)}
          onClose={() => !isSubmitting && setConfirmDelete(null)}
          loading={isSubmitting || loading}
        />
      )}
    </>
  );
}
