"use client";

import { useEffect, useRef, useState } from "react";
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
  ChevronUp,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  X,
  Check,
  Tag,
} from "lucide-react";


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
}
function CatModal({ title, defaultValue = "", onConfirm, onClose }: ModalProps) {
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
            disabled={!v.trim()}
            onClick={() => v.trim() && onConfirm(v.trim())}
          >
            <Check size={15} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CONFIRM DELETE MODAL
═══════════════════════════════════════════════════════════ */
interface ConfirmProps { name: string; onConfirm: () => void; onClose: () => void; }
function ConfirmDelete({ name, onConfirm, onClose }: ConfirmProps) {
  return (
    <div className="c-backdrop" onClick={onClose}>
      <div className="c-modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
        <div className="c-modal-head">
          <h3>Delete category?</h3>
          <button className="c-modal-x" onClick={onClose}><X size={17} /></button>
        </div>
        <p style={{ fontSize: ".85rem", color: "#6b7280", marginBottom: 20 }}>
          "{name}" and all its sub-categories will be permanently deleted.
        </p>
        <div className="c-modal-foot">
          <button className="c-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="c-btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SUB-CATEGORY COLUMN  (one of the 3 cols)
═══════════════════════════════════════════════════════════ */
interface SubColProps {
  sub: Category;
  onAddChild: (parent: Category) => void;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
}
function SubCol({ sub, onAddChild, onEdit, onDelete }: SubColProps) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen]  = useState(false);
  const children = sub.children ?? [];

  return (
    <div className="c-sub-col">
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

        <div className="c-sub-ctx">
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
              <div key={child.id} className="c-child-item">
                <div className="c-child-left">
                  <span className="c-child-dot" />
                  <span className="c-child-name">{child.name}</span>
                </div>
                <div className="c-child-actions">
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
}
function MainCard({ cat, onAddSub, onEdit, onDelete }: CardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const subs = cat.children ?? [];

  return (
    <div className="c-card">
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
  const { categories, loading } = useSelector((s: RootState) => s.categories);

  const [modal,         setModal]         = useState<ModalState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);

  useEffect(() => { dispatch(getCategories()); }, [dispatch]);

  const toSlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

  const refresh = () => dispatch(getCategories());

  const handleConfirm = (name: string) => {
    if (!modal) return;
    if (modal.type === "add-main") {
      dispatch(createCategory({ name, slug: toSlug(name), is_active: true })).then(refresh);
    } else if (modal.type === "add-sub" && modal.parent) {
      dispatch(createCategory({ name, slug: toSlug(name), parentId: modal.parent.id, is_active: true })).then(refresh);
    } else if (modal.type === "edit" && modal.editing) {
      dispatch(updateCategory({ id: modal.editing.id, name, slug: toSlug(name), parentId: modal.editing.parentId })).then(refresh);
    }
    setModal(null);
  };

  const handleDelete = (cat: Category) => {
    dispatch(deleteCategory(cat.id)).then(refresh);
    setConfirmDelete(null);
  };

  const modalTitle =
    modal?.type === "add-main" ? "Add Main Category" :
    modal?.type === "add-sub"  ? `Add Sub Category under \u201c${modal.parent?.name}\u201d` :
    modal?.editing             ? `Edit \u201c${modal.editing.name}\u201d` : "";

  return (
    <>
      <div className="c-page">
        {/* top bar */}
        <div className="c-topbar">
          <div className="c-topbar-title">
            <Tag size={20} />
            Manage Categories
          </div>
          <button className="c-btn-add" onClick={() => setModal({ type: "add-main" })}>
            <Plus size={15} /> Add Category
          </button>
        </div>

        {/* skeleton */}
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="c-skel"><div className="c-skel-h" /></div>
        ))}

        {/* empty */}
        {!loading && categories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300 text-gray-400">
            <Tag size={38} className="mb-3 opacity-30" />
            <p className="font-semibold text-gray-700 mb-1">No categories yet</p>
            <p className="text-sm">Click &quot;Add Category&quot; to get started</p>
          </div>
        )}

        {/* cards */}
        {!loading && categories.map(cat => (
          <MainCard
            key={cat.id}
            cat={cat}
            onAddSub={parent  => setModal({ type: "add-sub", parent })}
            onEdit={c         => setModal({ type: "edit", editing: c })}
            onDelete={c       => setConfirmDelete(c)}
          />
        ))}
      </div>

      {/* modals */}
      {modal && (
        <CatModal
          title={modalTitle}
          defaultValue={modal.type === "edit" ? modal.editing?.name : ""}
          onConfirm={handleConfirm}
          onClose={() => setModal(null)}
        />
      )}
      {confirmDelete && (
        <ConfirmDelete
          name={confirmDelete.name}
          onConfirm={() => handleDelete(confirmDelete)}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}
