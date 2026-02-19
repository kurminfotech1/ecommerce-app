"use client";

import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { RootState } from "@/redux/rootReducer";

import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImages,
  Product,
} from "@/redux/products/productsApi";
import { getCategories, Category } from "@/redux/categories/categoriesApi";

import {
  Search, Plus, Eye, Pencil, Trash2, X, Upload,
  ChevronLeft, ChevronRight, Star, Package,
  LayoutGrid, List, ImageOff, Tag, Layers,
  CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Loader2,
} from "lucide-react";
import { DeleteModal } from "@/components/common/DeleteModal";

// ── Skeleton ────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 animate-pulse">
        <div className="w-14 h-14 bg-gray-200 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-2/5" />
          <div className="h-3 bg-gray-100 rounded w-1/4" />
        </div>
        <div className="w-20 h-5 bg-gray-200 rounded-full" />
        <div className="w-16 h-4 bg-gray-200 rounded" />
        <div className="w-24 h-4 bg-gray-200 rounded" />
        <div className="w-20 h-8 bg-gray-200 rounded-lg" />
      </div>
    ))}
  </div>
);

// ── Badge ────────────────────────────────────────────────────────
const Badge = ({ children, color = "gray" }: { children: React.ReactNode; color?: string }) => {
  const colors: Record<string, string> = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50 text-red-600 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    gray: "bg-gray-50 text-gray-600 border-gray-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colors[color]}`}>
      {children}
    </span>
  );
};

// ── Image Preview Modal ──────────────────────────────────────────
const ImagePreview = ({ url, onClose }: { url: string; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={onClose}>
    <button className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition" onClick={onClose}>
      <X size={20} />
    </button>
    <img src={url} className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl object-contain" onClick={(e) => e.stopPropagation()} />
  </div>
);

// ── Form Field ───────────────────────────────────────────────────
const Field = ({ label, children, span = 1 }: { label: string; children: React.ReactNode; span?: number }) => (
  <div className={span === 2 ? "col-span-2" : ""}>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full border border-gray-200 bg-gray-50 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition placeholder:text-gray-400";
const selectCls = `${inputCls} cursor-pointer`;

// ── Utility: find category node anywhere in the tree ─────────────
function findCatNode(nodes: Category[], id: string): Category | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findCatNode(n.children ?? [], id);
    if (found) return found;
  }
  return null;
}

// ── Resolve L1/L2/L3 from a leaf category_id (bottom-up) ─────────
function resolveCatSelections(categories: Category[], id: string) {
  if (!id) return { l1: "", l2: "", l3: "" };
  const node = findCatNode(categories, id);
  if (!node) return { l1: id, l2: "", l3: "" };
  if (!node.parentId) return { l1: id, l2: "", l3: "" };
  const parent = findCatNode(categories, node.parentId);
  if (!parent) return { l1: id, l2: "", l3: "" };
  if (!parent.parentId) return { l1: parent.id, l2: id, l3: "" };
  const grand = findCatNode(categories, parent.parentId);
  if (!grand || grand.parentId) return { l1: parent.id, l2: id, l3: "" };
  return { l1: grand.id, l2: parent.id, l3: id };
}

// ── Empty state ──────────────────────────────────────────────────
const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
    <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mb-4">
      <Package size={28} className="text-violet-400" />
    </div>
    <p className="text-lg font-semibold text-gray-700 mb-1">No products yet</p>
    <p className="text-sm text-gray-400 mb-6">Start adding products to your inventory.</p>
    <button onClick={onAdd} className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm">
      + Add First Product
    </button>
  </div>
);

// ────────────────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { products, totalPages, total, loading, submitting, uploading } =
    useSelector((s: RootState) => s.products);
  const { categories } = useSelector((s: RootState) => s.categories);
  console.log(categories);
  // ── List state ─────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);

  // ── Modal state ────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // ── Detail modal ───────────────────────────────────────────────
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [expandedVariants, setExpandedVariants] = useState(false);

  // ── Preview ────────────────────────────────────────────────────
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // ── Form ───────────────────────────────────────────────────────
  const emptyForm = {
    product_name: "", slug: "", short_desc: "", description: "",
    size: "", color: "", price: "", compare_price: "", stock: "0",
    category_id: "", parentId: "",
    meta_title: "", meta_desc: "",
    is_active: true, is_featured: false,
  };

  const [form, setForm] = useState<any>(emptyForm);
  const [images, setImages] = useState<string[]>([]); // confirmed URLs
  const [pendingFiles, setPendingFiles] = useState<File[]>([]); // awaiting upload

  // ── Cascading category state (L1 = main, L2 = child, L3 = sub) ─
  const [catL1, setCatL1] = useState("");
  const [catL2, setCatL2] = useState("");
  const [catL3, setCatL3] = useState("");

  const catMainList = (categories as Category[]).filter((c) => !c.parentId);
  const catL2List   = catL1 ? (findCatNode(categories as Category[], catL1)?.children ?? []) : [];
  const catL3List   = catL2 ? (findCatNode(categories as Category[], catL2)?.children ?? []) : [];

  // Effective category_id = deepest selected level
  const effectiveCatId = catL3 || catL2 || catL1;

  const handleCatL1 = (id: string) => {
    setCatL1(id); setCatL2(""); setCatL3("");
    setForm((f: any) => ({ ...f, category_id: id }));
  };
  const handleCatL2 = (id: string) => {
    setCatL2(id); setCatL3("");
    setForm((f: any) => ({ ...f, category_id: id || catL1 }));
  };
  const handleCatL3 = (id: string) => {
    setCatL3(id);
    setForm((f: any) => ({ ...f, category_id: id || catL2 || catL1 }));
  };

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchProducts = useCallback(() => {
    dispatch(getProducts({ page, limit: 10, search, category: categoryFilter }));
  }, [page, search, categoryFilter, dispatch]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { dispatch(getCategories()); }, [dispatch]);

  // ── Keyboard / scroll lock ─────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPreviewImage(null);
        setDetailProduct(null);
        setModalOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = previewImage || detailProduct || modalOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [previewImage, detailProduct, modalOpen]);

  // ── Helpers ────────────────────────────────────────────────────
  const openCreate = () => {
    setForm(emptyForm);
    setImages([]);
    setPendingFiles([]);
    setCatL1(""); setCatL2(""); setCatL3("");
    setEditId(null);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditId(p.id);
    setImages(p.images?.map((i) => i.image_url) || []);
    setPendingFiles([]);
    // Resolve L1/L2/L3 from existing category_id
    const resolved = resolveCatSelections(categories as Category[], p.category_id);
    setCatL1(resolved.l1); setCatL2(resolved.l2); setCatL3(resolved.l3);
    setForm({
      product_name: p.product_name,
      slug: p.slug ?? "",
      short_desc: p.short_desc ?? "",
      description: p.description ?? "",
      size: p.size ?? "",
      color: p.color ?? "",
      price: String(p.price),
      compare_price: p.compare_price ? String(p.compare_price) : "",
      stock: String(p.stock),
      category_id: p.category_id,
      parentId: p.parentId ?? "",
      meta_title: p.meta_title ?? "",
      meta_desc: p.meta_desc ?? "",
      is_active: p.is_active,
      is_featured: p.is_featured,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditId(null);
  };

  const handleName = (name: string) => {
    setForm((f: any) => ({
      ...f,
      product_name: name,
      slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    }));
  };

  // ── File selection (local preview) ────────────────────────────
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    setPendingFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const removePending = (idx: number) =>
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));

  const removeUploaded = (idx: number) =>
    setImages((prev) => prev.filter((_, i) => i !== idx));

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.product_name || !form.category_id || !form.price) {
      alert("Product name, category and price are required.");
      return;
    }

    // 1. Upload pending files first
    let newUrls: string[] = [];
    if (pendingFiles.length > 0) {
      const result = await dispatch(uploadImages(pendingFiles));
      if (uploadImages.fulfilled.match(result)) {
        newUrls = result.payload;
      } else {
        return; // abort — toast already shown
      }
    }

    const allImageUrls = [...images, ...newUrls];

    const payload = {
      product_name: form.product_name,
      slug: form.slug || null,
      description: form.description || null,
      short_desc: form.short_desc || null,
      size: form.size || null,
      color: form.color || null,
      price: Number(form.price),
      compare_price: form.compare_price ? Number(form.compare_price) : null,
      stock: Number(form.stock || 0),
      category_id: form.category_id,
      parentId: form.parentId || null,
      is_active: form.is_active,
      is_featured: form.is_featured,
      meta_title: form.meta_title || null,
      meta_desc: form.meta_desc || null,
      images: allImageUrls.map((url, idx) => ({ image_url: url, sort_order: idx })),
    };

    // 2. Create or update
    let result: any;
    if (editId) {
      result = await dispatch(updateProduct({ id: editId, ...payload }));
    } else {
      result = await dispatch(createProduct(payload));
    }

    if (createProduct.fulfilled.match(result) || updateProduct.fulfilled.match(result)) {
      closeModal();
      fetchProducts();
    }
  };

  // ── Stock badge ────────────────────────────────────────────────
  const stockBadge = (stock: number) => {
    if (stock === 0) return <Badge color="red">Out of stock</Badge>;
    if (stock < 10) return <Badge color="amber">{stock} left</Badge>;
    return <Badge color="green">{stock} in stock</Badge>;
  };

  // ────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50/60">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {total} product{total !== 1 ? "s" : ""} total
            </p>
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search products..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 w-56 transition"
              />
            </div>

            {/* Category filter */}
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 bg-white text-sm px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
            >
              <option value="">All categories</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name || c.category_name}</option>
              ))}
            </select>

            {/* Add button */}
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition"
            >
              <Plus size={16} /> Add Product
            </button>
          </div>
        </div>

        {/* ── Table ── */}
        {loading ? (
          <Skeleton />
        ) : products?.length === 0 ? (
          <EmptyState onAdd={openCreate} />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Price</th>
                    <th className="px-4 py-3 text-left">Stock</th>
                    <th className="px-4 py-3 text-left">Variants</th>
                    <th className="px-4 py-3 text-left">SKU</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((p: Product) => (
                    <tr key={p.id} className="hover:bg-violet-50/30 transition group">
                      {/* Product name + image */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-xl border border-gray-200 overflow-hidden bg-gray-100 shrink-0 cursor-pointer"
                            onClick={() => p.images?.[0] && setPreviewImage(p.images[0].image_url)}
                          >
                            {p.images?.[0] ? (
                              <img src={p.images[0].image_url} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageOff size={14} className="text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 leading-tight">{p.product_name}</p>
                            {p.short_desc && (
                              <p className="text-xs text-gray-400 mt-0.5 max-w-[200px] truncate">{p.short_desc}</p>
                            )}
                            {p.is_featured && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-medium mt-0.5">
                                <Star size={9} fill="currentColor" /> Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <Badge color="purple">
                          <Tag size={10} />
                          {p.category?.name || "—"}
                        </Badge>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800">₹{p.price.toLocaleString()}</p>
                        {p.compare_price && (
                          <p className="text-xs text-gray-400 line-through">₹{p.compare_price.toLocaleString()}</p>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-3">{stockBadge(p.stock)}</td>

                      {/* Variants */}
                      <td className="px-4 py-3">
                        {p.children && p.children.length > 0 ? (
                          <Badge color="blue">
                            <Layers size={10} />
                            {p.children.length} variant{p.children.length > 1 ? "s" : ""}
                          </Badge>
                        ) : p.parentId ? (
                          <Badge color="gray">Variant</Badge>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* SKU */}
                      <td className="px-4 py-3">
                        <code className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-mono">
                          {p.sku || "—"}
                        </code>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {p.is_active ? (
                          <Badge color="green"><CheckCircle2 size={10} /> Active</Badge>
                        ) : (
                          <Badge color="red"><XCircle size={10} /> Inactive</Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition">
                          <button
                            onClick={() => setDetailProduct(p)}
                            title="View"
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => openEdit(p)}
                            title="Edit"
                            className="p-2 rounded-lg hover:bg-violet-100 text-violet-600 transition"
                          >
                            <Pencil size={15} />
                          </button>
                          <DeleteModal
                            onConfirm={() => dispatch(deleteProduct(p.id))}
                            parentTitle="Delete product?"
                            childTitle="This will permanently delete this product and all its variants."
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronLeft size={14} /> Prev
              </button>
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

      {/* ══════════════════════════════════════════════════════════
          Detail Modal
      ══════════════════════════════════════════════════════════ */}
      {detailProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDetailProduct(null)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{detailProduct.product_name}</h2>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {detailProduct.is_active ? <Badge color="green"><CheckCircle2 size={10} /> Active</Badge> : <Badge color="red"><XCircle size={10} /> Inactive</Badge>}
                  {detailProduct.is_featured && <Badge color="amber"><Star size={10} fill="currentColor" /> Featured</Badge>}
                  {detailProduct.sku && <Badge color="gray"><code className="font-mono">{detailProduct.sku}</code></Badge>}
                </div>
              </div>
              <button onClick={() => setDetailProduct(null)} className="p-2 rounded-lg hover:bg-gray-100 transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Images */}
              {detailProduct.images && detailProduct.images.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {detailProduct.images.map((img, i) => (
                    <img
                      key={i}
                      src={img.image_url}
                      className="aspect-square rounded-xl object-cover cursor-pointer border border-gray-100 hover:scale-105 transition"
                      onClick={() => setPreviewImage(img.image_url)}
                    />
                  ))}
                </div>
              )}

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Category", value: detailProduct.category?.name },
                  { label: "Slug", value: detailProduct.slug || "—" },
                  { label: "Price", value: `₹${detailProduct.price.toLocaleString()}` },
                  { label: "Compare Price", value: detailProduct.compare_price ? `₹${detailProduct.compare_price.toLocaleString()}` : "—" },
                  { label: "Stock", value: detailProduct.stock },
                  { label: "SKU", value: detailProduct.sku || "—" },
                  { label: "Size", value: detailProduct.size || "—" },
                  { label: "Color", value: detailProduct.color || "—" },
                  { label: "Meta Title", value: detailProduct.meta_title || "—" },
                  { label: "Meta Description", value: detailProduct.meta_desc || "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-sm text-gray-800 font-medium">{String(value)}</p>
                  </div>
                ))}
              </div>

              {/* Descriptions */}
              {detailProduct.short_desc && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Short Description</p>
                  <p className="text-sm text-gray-700">{detailProduct.short_desc}</p>
                </div>
              )}
              {detailProduct.description && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{detailProduct.description}</p>
                </div>
              )}

              {/* Variants */}
              {detailProduct.children && detailProduct.children.length > 0 && (
                <div>
                  <button
                    onClick={() => setExpandedVariants((v) => !v)}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3"
                  >
                    <Layers size={15} />
                    {detailProduct.children.length} Variants
                    {expandedVariants ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {expandedVariants && (
                    <div className="space-y-2">
                      {detailProduct.children.map((child) => (
                        <div key={child.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                          {child.images?.[0] && (
                            <img src={child.images[0].image_url} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{child.product_name}</p>
                            <div className="flex gap-2 mt-0.5">
                              {child.size && <Badge color="gray">Size: {child.size}</Badge>}
                              {child.color && <Badge color="gray">Color: {child.color}</Badge>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-800">₹{child.price.toLocaleString()}</p>
                            {stockBadge(child.stock)}
                          </div>
                          <button
                            onClick={() => { setDetailProduct(null); openEdit(child); }}
                            className="p-1.5 rounded-lg hover:bg-violet-100 text-violet-600 transition"
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => { setDetailProduct(null); openEdit(detailProduct); }}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-semibold transition"
              >
                Edit Product
              </button>
              <button
                onClick={() => setDetailProduct(null)}
                className="px-6 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl text-sm font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          Image Preview
      ══════════════════════════════════════════════════════════ */}
      {previewImage && <ImagePreview url={previewImage} onClose={() => setPreviewImage(null)} />}

      {/* ══════════════════════════════════════════════════════════
          Create / Edit Modal
      ══════════════════════════════════════════════════════════ */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editId ? "Edit Product" : "Add New Product"}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {editId ? "Update product details" : "Fill in the details to create a new product"}
                </p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-gray-100 transition">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">

              {/* ── Section: Basic ── */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Package size={12} /> Basic Info
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Product Name *" span={2}>
                    <input
                      placeholder="e.g. Nike Air Max 270"
                      value={form.product_name}
                      onChange={(e) => handleName(e.target.value)}
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Slug">
                    <input
                      placeholder="e.g. nike-air-max-270"
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      className={inputCls}
                    />
                  </Field>

                  {/* ── Cascading Category: Level 1 (Main) ── */}
                  <Field label="Category *">
                    <select
                      value={catL1}
                      onChange={(e) => handleCatL1(e.target.value)}
                      className={selectCls}
                    >
                      <option value="">Select category</option>
                      {catMainList.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </Field>

                  {/* ── Cascading Category: Level 2 (Child) — only if L1 has children ── */}
                  {catL2List.length > 0 ? (
                    <Field label="Sub-Category">
                      <select
                        value={catL2}
                        onChange={(e) => handleCatL2(e.target.value)}
                        className={selectCls}
                      >
                        <option value="">Select sub-category</option>
                        {catL2List.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </Field>
                  ) : <div />}

                  {/* ── Cascading Category: Level 3 (Sub-child) — only if L2 has children ── */}
                  {catL2 && catL3List.length > 0 && (
                    <Field label="Sub-Sub-Category">
                      <select
                        value={catL3}
                        onChange={(e) => handleCatL3(e.target.value)}
                        className={selectCls}
                      >
                        <option value="">Select sub-sub-category</option>
                        {catL3List.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </Field>
                  )}

                  {/* Breadcrumb path */}
                  {effectiveCatId && (
                    <div className="col-span-2 -mt-1">
                      <p className="text-[11px] text-gray-400">
                        Selected:{" "}
                        <span className="font-semibold text-violet-600">
                          {[catL1, catL2, catL3]
                            .filter(Boolean)
                            .map((id) => findCatNode(categories as Category[], id)?.name)
                            .join(" › ")}
                        </span>
                      </p>
                    </div>
                  )}

                  <Field label="Short Description" span={2}>
                    <input
                      placeholder="One-line description"
                      value={form.short_desc}
                      onChange={(e) => setForm({ ...form, short_desc: e.target.value })}
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Full Description" span={2}>
                    <textarea
                      rows={3}
                      placeholder="Detailed product description..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>

              {/* ── Section: Pricing & Inventory ── */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Tag size={12} /> Pricing & Inventory
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Price (₹) *">
                    <input
                      type="number"
                      placeholder="0"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Compare Price (₹)">
                    <input
                      type="number"
                      placeholder="0"
                      value={form.compare_price}
                      onChange={(e) => setForm({ ...form, compare_price: e.target.value })}
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Stock">
                    <input
                      type="number"
                      placeholder="0"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      className={inputCls}
                    />
                  </Field>

                  {/* <Field label="Parent Product (for variants)">
                    <select
                      value={form.parentId}
                      onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                      className={inputCls}
                    >
                      <option value="">None (this is a parent)</option>
                      {products
                        .filter((p) => !p.parentId && p.id !== editId)
                        .map((p) => (
                          <option key={p.id} value={p.id}>{p.product_name}</option>
                        ))}
                    </select>
                  </Field> */}
                </div>
              </div>

              {/* ── Section: Variant Attributes ── */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Layers size={12} /> Variant Attributes
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Size">
                    <input
                      placeholder="e.g. M, L, XL, 10"
                      value={form.size}
                      onChange={(e) => setForm({ ...form, size: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Color">
                    <div className="flex items-center gap-2">
                      {/* Native color wheel */}
                      <input
                        type="color"
                        value={form.color?.startsWith("#") ? form.color : "#000000"}
                        onChange={(e) => setForm({ ...form, color: e.target.value })}
                        className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5 bg-gray-50 shrink-0"
                        title="Pick a color"
                      />
                      {/* Hex / name text field */}
                      <input
                        type="text"
                        placeholder="#000000 or Red"
                        value={form.color}
                        onChange={(e) => setForm({ ...form, color: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                  </Field>
                </div>
              </div>

              {/* ── Section: SEO ── */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">SEO</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Meta Title" span={2}>
                    <input
                      placeholder="SEO title"
                      value={form.meta_title}
                      onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Meta Description" span={2}>
                    <input
                      placeholder="SEO description"
                      value={form.meta_desc}
                      onChange={(e) => setForm({ ...form, meta_desc: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>

              {/* ── Section: Status ── */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div
                    onClick={() => setForm({ ...form, is_active: !form.is_active })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${form.is_active ? "bg-violet-500" : "bg-gray-200"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div
                    onClick={() => setForm({ ...form, is_featured: !form.is_featured })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${form.is_featured ? "bg-amber-400" : "bg-gray-200"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_featured ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Featured</span>
                </label>
              </div>

              {/* ── Section: Images ── */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Upload size={12} /> Product Images
                </p>

                {/* Upload zone */}
                <label className="block border-2 border-dashed border-gray-200 hover:border-violet-300 rounded-xl p-5 text-center cursor-pointer transition bg-gray-50 hover:bg-violet-50/30">
                  <Upload size={20} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to upload images</p>
                  <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WEBP up to 5 MB each</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                </label>

                {/* Pending (not yet uploaded) */}
                {pendingFiles.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-400 mb-2">Pending upload ({pendingFiles.length})</p>
                    <div className="flex gap-2 flex-wrap">
                      {pendingFiles.map((file, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            className="w-20 h-20 object-cover rounded-xl border-2 border-dashed border-amber-300"
                          />
                          <button
                            type="button"
                            onClick={() => removePending(i)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow"
                          >
                            <X size={10} />
                          </button>
                          <div className="absolute bottom-1 left-0 right-0 text-center">
                            <span className="text-[9px] bg-amber-400 text-white px-1 rounded">pending</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Uploaded images */}
                {images.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-400 mb-2">Uploaded ({images.length})</p>
                    <div className="flex gap-2 flex-wrap">
                      {images.map((url, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={url}
                            className="w-20 h-20 object-cover rounded-xl border border-gray-200 cursor-pointer"
                            onClick={() => setPreviewImage(url)}
                          />
                          <button
                            type="button"
                            onClick={() => removeUploaded(i)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow opacity-0 group-hover:opacity-100 transition"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl sticky bottom-0">
              <button
                onClick={handleSubmit}
                disabled={submitting || uploading}
                className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition"
              >
                {(submitting || uploading) && <Loader2 size={15} className="animate-spin" />}
                {uploading ? "Uploading images..." : submitting ? "Saving..." : editId ? "Update Product" : "Create Product"}
              </button>
              <button
                onClick={closeModal}
                disabled={submitting || uploading}
                className="px-6 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl text-sm font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper (referenced inside JSX)
function stockBadge(stock: number) {
  if (stock === 0) return <Badge color="red">Out of stock</Badge>;
  if (stock < 10) return <Badge color="amber">{stock} left</Badge>;
  return <Badge color="green">{stock} in stock</Badge>;
}
