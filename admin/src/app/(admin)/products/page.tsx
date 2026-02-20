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
  ProductVariantInput,
} from "@/redux/products/productsApi";
import { getCategories, Category } from "@/redux/categories/categoriesApi";

import {
  Search, Plus, Eye, Pencil, Trash2, X,
  ChevronLeft, ChevronRight, Star, Package,
  LayoutGrid, List, ImageOff, Tag, Layers,
  CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Loader2, Upload,
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
  const { products, totalPages, totalRecords, loading, submitting, uploading } =
    useSelector((s: RootState) => s.products);
  const { categories } = useSelector((s: RootState) => s.categories);
  console.log(categories);
  // ── List state ─────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");
  const [minPriceFilter, setMinPriceFilter] = useState("");
  const [maxPriceFilter, setMaxPriceFilter] = useState("");
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
    category_id: "",
    meta_title: "", meta_desc: "",
    is_active: true, is_featured: false,
  };

  type VariantRow = {
    size: string; color: string;
    price: string; compare_price: string;
    stock: string; sku: string;
    uploadedImages: string[]; // already-uploaded URLs
    pendingFiles: File[];   // queued for upload
  };
  const emptyVariantRow = (): VariantRow => ({
    size: "", color: "", price: "", compare_price: "", stock: "0", sku: "",
    uploadedImages: [], pendingFiles: [],
  });

  const [form, setForm] = useState<any>(emptyForm);
  const [variants, setVariants] = useState<VariantRow[]>([emptyVariantRow()]); // multi-variant rows

  // ── Cascading category state (L1 = main, L2 = child, L3 = sub) ─
  const [catL1, setCatL1] = useState("");
  const [catL2, setCatL2] = useState("");
  const [catL3, setCatL3] = useState("");

  const catMainList = (categories as Category[]).filter((c) => !c.parentId);
  const catL2List = catL1 ? (findCatNode(categories as Category[], catL1)?.children ?? []) : [];
  const catL3List = catL2 ? (findCatNode(categories as Category[], catL2)?.children ?? []) : [];

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
    dispatch(getProducts({
      page,
      limit: 10,
      search,
      category: categoryFilter,
      active: activeFilter === "true" ? true : activeFilter === "false" ? false : undefined,
      featured: featuredFilter === "true" ? true : undefined,
      size: sizeFilter || undefined,
      min_price: minPriceFilter ? Number(minPriceFilter) : undefined,
      max_price: maxPriceFilter ? Number(maxPriceFilter) : undefined,
    }));
  }, [page, search, categoryFilter, activeFilter, featuredFilter, sizeFilter, minPriceFilter, maxPriceFilter, dispatch]);

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
    setVariants([emptyVariantRow()]);
    setCatL1(""); setCatL2(""); setCatL3("");
    setEditId(null);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditId(p.id);
    const resolved = resolveCatSelections(categories as Category[], p.category_id);
    setCatL1(resolved.l1); setCatL2(resolved.l2); setCatL3(resolved.l3);
    setForm({
      product_name: p.product_name,
      slug: p.slug ?? "",
      short_desc: p.short_desc ?? "",
      description: p.description ?? "",
      category_id: p.category_id,
      meta_title: p.meta_title ?? "",
      meta_desc: p.meta_desc ?? "",
      is_active: p.is_active,
      is_featured: p.is_featured,
    });
    // Pre-fill variants — including their existing images
    if (p.variants && p.variants.length > 0) {
      setVariants(p.variants.map((v) => ({
        size: v.size ?? "",
        color: v.color ?? "",
        price: String(v.price),
        compare_price: v.compare_price ? String(v.compare_price) : "",
        stock: String(v.stock),
        sku: v.sku ?? "",
        uploadedImages: v.images?.map((img) => img.image_url) ?? [],
        pendingFiles: [],
      })));
    } else {
      setVariants([emptyVariantRow()]);
    }
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

  // ── Variant field helpers ─────────────────────────────────────
  const updateVariant = (idx: number, field: string, value: string) =>
    setVariants((prev) => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));

  const addVariant = () => setVariants((prev) => [...prev, emptyVariantRow()]);

  const removeVariant = (idx: number) =>
    setVariants((prev) => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);

  // Add files to a specific variant's pending queue
  const addVariantFiles = (idx: number, files: FileList | null) => {
    if (!files) return;
    setVariants((prev) => prev.map((v, i) =>
      i === idx ? { ...v, pendingFiles: [...v.pendingFiles, ...Array.from(files)] } : v
    ));
  };

  // Remove a pending file from a variant
  const removeVariantPending = (variantIdx: number, fileIdx: number) =>
    setVariants((prev) => prev.map((v, i) =>
      i === variantIdx ? { ...v, pendingFiles: v.pendingFiles.filter((_, fi) => fi !== fileIdx) } : v
    ));

  // Remove an already-uploaded image from a variant
  const removeVariantUploaded = (variantIdx: number, imgIdx: number) =>
    setVariants((prev) => prev.map((v, i) =>
      i === variantIdx ? { ...v, uploadedImages: v.uploadedImages.filter((_, ii) => ii !== imgIdx) } : v
    ));

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.product_name || !form.category_id) {
      alert("Product name and category are required.");
      return;
    }
    const validVariants = variants.filter((v) => v.price);
    if (validVariants.length === 0) {
      alert("At least one variant with a price is required.");
      return;
    }

    // Upload per-variant pending images, then build payloads
    const variantsPayload: ProductVariantInput[] = [];
    for (const v of validVariants) {
      let variantImageUrls = [...v.uploadedImages];
      if (v.pendingFiles.length > 0) {
        const uploadRes = await dispatch(uploadImages(v.pendingFiles));
        if (uploadImages.fulfilled.match(uploadRes)) {
          variantImageUrls = [...variantImageUrls, ...uploadRes.payload];
        }
      }
      variantsPayload.push({
        size: v.size || undefined,
        color: v.color || undefined,
        price: Number(v.price),
        compare_price: v.compare_price ? Number(v.compare_price) : undefined,
        stock: Number(v.stock || 0),
        sku: v.sku || undefined,
        images: variantImageUrls.map((url, i) => ({ image_url: url, sort_order: i })),
      });
    }

    const payload = {
      product_name: form.product_name,
      slug: form.slug || null,
      description: form.description || null,
      short_desc: form.short_desc || null,
      category_id: form.category_id,
      is_active: form.is_active,
      is_featured: form.is_featured,
      meta_title: form.meta_title || null,
      meta_desc: form.meta_desc || null,
      variants: variantsPayload,
    };


    // 3. Create or update
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
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Products</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {totalRecords} product{totalRecords !== 1 ? "s" : ""} total
              </p>
            </div>
            {/* Add button */}
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition"
            >
              <Plus size={16} /> Add Product
            </button>
          </div>

          {/* ── Filters Bar ── */}
          <div className="flex gap-2 flex-wrap items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
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

            {/* Size filter */}
            <input
              placeholder="Size (e.g. M)"
              value={sizeFilter}
              onChange={(e) => { setSizeFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 bg-white text-sm px-3 py-2 rounded-xl w-28 focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
            />

            {/* Price filter */}
            <div className="flex items-center gap-1">
              <input
                type="number"
                placeholder="Min ₹"
                value={minPriceFilter}
                onChange={(e) => { setMinPriceFilter(e.target.value); setPage(1); }}
                className="border border-gray-200 bg-white text-sm px-3 py-2 rounded-xl w-24 focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                placeholder="Max ₹"
                value={maxPriceFilter}
                onChange={(e) => { setMaxPriceFilter(e.target.value); setPage(1); }}
                className="border border-gray-200 bg-white text-sm px-3 py-2 rounded-xl w-24 focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
              />
            </div>

            {/* Status Filter */}
            <select
              value={activeFilter}
              onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 bg-white text-sm px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
            >
              <option value="">Status: All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            {/* Featured Filter */}
            <select
              value={featuredFilter}
              onChange={(e) => { setFeaturedFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 bg-white text-sm px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
            >
              <option value="">Featured: All</option>
              <option value="true">Featured Only</option>
            </select>
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
                            onClick={() => {
                              const firstImg = p.variants?.[0]?.images?.[0]?.image_url;
                              if (firstImg) setPreviewImage(firstImg);
                            }}
                          >
                            {p.variants?.[0]?.images?.[0] ? (
                              <img src={p.variants[0].images[0].image_url} className="w-full h-full object-cover" />
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

                      {/* Price — from first variant */}
                      <td className="px-4 py-3">
                        {p.variants?.[0] ? (
                          <>
                            <p className="font-semibold text-gray-800">₹{p.variants[0].price.toLocaleString()}</p>
                            {p.variants[0].compare_price && (
                              <p className="text-xs text-gray-400 line-through">₹{p.variants[0].compare_price.toLocaleString()}</p>
                            )}
                          </>
                        ) : <span className="text-gray-300">—</span>}
                      </td>

                      {/* Stock — from first variant */}
                      <td className="px-4 py-3">
                        {p.variants?.[0] ? stockBadge(p.variants[0].stock) : <span className="text-gray-300">—</span>}
                      </td>

                      {/* Variants count */}
                      <td className="px-4 py-3">
                        {p.variants && p.variants.length > 0 ? (
                          <Badge color="blue">
                            <Layers size={10} />
                            {p.variants.length} variant{p.variants.length > 1 ? "s" : ""}
                          </Badge>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* SKU — from first variant */}
                      <td className="px-4 py-3">
                        <code className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-mono">
                          {p.variants?.[0]?.sku || "—"}
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
                  {detailProduct.variants?.[0]?.sku && <Badge color="gray"><code className="font-mono">{detailProduct.variants[0].sku}</code></Badge>}
                </div>
              </div>
              <button onClick={() => setDetailProduct(null)} className="p-2 rounded-lg hover:bg-gray-100 transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Category", value: detailProduct.category?.name },
                  { label: "Slug", value: detailProduct.slug || "—" },
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
              {detailProduct.variants && detailProduct.variants.length > 0 && (
                <div>
                  <button
                    onClick={() => setExpandedVariants((v) => !v)}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3"
                  >
                    <Layers size={15} />
                    {detailProduct.variants.length} Variant{detailProduct.variants.length > 1 ? "s" : ""}
                    {expandedVariants ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {expandedVariants && (
                    <div className="space-y-3">
                      {detailProduct.variants.map((v) => (
                        <div key={v.id} className="bg-gray-50 rounded-xl overflow-hidden">
                          {/* Variant info row */}
                          <div className="flex items-center gap-3 px-3 pt-3 pb-2">
                            <div className="flex-1">
                              <div className="flex gap-2 flex-wrap">
                                {v.sku && <Badge color="gray"><code className="font-mono">{v.sku}</code></Badge>}
                                {v.size && <Badge color="blue">Size: {v.size}</Badge>}
                                {v.color && (
                                  <Badge color="purple">
                                    {v.color.startsWith("#") && (
                                      <span
                                        className="inline-block w-2.5 h-2.5 rounded-full border border-white/50 shrink-0"
                                        style={{ background: v.color }}
                                      />
                                    )}
                                    {v.color}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-semibold text-gray-800">₹{v.price.toLocaleString()}</p>
                              {v.compare_price && (
                                <p className="text-xs text-gray-400 line-through">₹{v.compare_price.toLocaleString()}</p>
                              )}
                              {stockBadge(v.stock)}
                            </div>
                          </div>

                          {/* Variant images strip */}
                          {v.images && v.images.length > 0 && (
                            <div className="flex gap-2 px-3 pb-3 flex-wrap">
                              {v.images.map((img, imgIdx) => (
                                <img
                                  key={imgIdx}
                                  src={img.image_url}
                                  alt={`Variant image ${imgIdx + 1}`}
                                  onClick={() => setPreviewImage(img.image_url)}
                                  className="w-14 h-14 object-cover rounded-lg border border-gray-200 cursor-zoom-in hover:scale-105 hover:shadow-md transition"
                                />
                              ))}
                            </div>
                          )}
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
                      placeholder="Enter product name"
                      value={form.product_name}
                      onChange={(e) => handleName(e.target.value)}
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Slug">
                    <input
                      placeholder="Enter slug"
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
                      placeholder="Enter short description"
                      value={form.short_desc}
                      onChange={(e) => setForm({ ...form, short_desc: e.target.value })}
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Full Description" span={2}>
                    <textarea
                      rows={3}
                      placeholder="Enter full description"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>

              {/* ── Section: Variants ── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Layers size={12} /> Variants
                    <span className="ml-1 px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded-full text-[10px] font-bold">
                      {variants.length}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition"
                  >
                    <Plus size={12} /> Add Variant
                  </button>
                </div>

                <div className="space-y-4">
                  {variants.map((v, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm"
                    >
                      {/* Variant card header */}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                          Variant #{idx + 1}
                          {(v.size || v.color) && (
                            <span className="ml-2 font-normal text-gray-400 capitalize">
                              {[v.size, v.color].filter(Boolean).join(" · ")}
                            </span>
                          )}
                        </span>
                        {variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVariant(idx)}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 transition"
                            title="Remove variant"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>

                      <div className="p-4 space-y-4">
                        {/* Fields grid */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* Price */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                              Price (₹) *
                            </label>
                            <input
                              type="number"
                              placeholder="0"
                              value={v.price}
                              onChange={(e) => updateVariant(idx, "price", e.target.value)}
                              className={inputCls}
                            />
                          </div>

                          {/* Compare Price */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                              Compare Price (₹)
                            </label>
                            <input
                              type="number"
                              placeholder="0"
                              value={v.compare_price}
                              onChange={(e) => updateVariant(idx, "compare_price", e.target.value)}
                              className={inputCls}
                            />
                          </div>

                          {/* Stock */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                              Stock
                            </label>
                            <input
                              type="number"
                              placeholder="0"
                              value={v.stock}
                              onChange={(e) => updateVariant(idx, "stock", e.target.value)}
                              className={inputCls}
                            />
                          </div>

                          {/* SKU */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                              SKU
                            </label>
                            <input
                              placeholder="Auto-generated if blank"
                              value={v.sku}
                              onChange={(e) => updateVariant(idx, "sku", e.target.value)}
                              className={inputCls}
                            />
                          </div>

                          {/* Size */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                              Size
                            </label>
                            <input
                              placeholder="e.g. S, M, L, XL"
                              value={v.size}
                              onChange={(e) => updateVariant(idx, "size", e.target.value)}
                              className={inputCls}
                            />
                          </div>

                          {/* Color */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                              Color
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={v.color?.startsWith("#") ? v.color : "#000000"}
                                onChange={(e) => updateVariant(idx, "color", e.target.value)}
                                className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5 bg-gray-50 shrink-0"
                                title="Pick a color"
                              />
                              <input
                                type="text"
                                placeholder="e.g. Red, #FF0000"
                                value={v.color}
                                onChange={(e) => updateVariant(idx, "color", e.target.value)}
                                className={inputCls}
                              />
                            </div>
                          </div>
                        </div>

                        {/* ── Variant Images ── */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <Upload size={11} /> Variant Images
                          </label>

                          {/* Thumbnails row */}
                          {(v.uploadedImages.length > 0 || v.pendingFiles.length > 0) && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {/* Already uploaded */}
                              {v.uploadedImages.map((url, imgIdx) => (
                                <div key={`up-${imgIdx}`} className="relative group w-16 h-16">
                                  <img
                                    src={url}
                                    onClick={() => setPreviewImage(url)}
                                    className="w-16 h-16 object-cover rounded-lg border border-gray-200 cursor-zoom-in"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeVariantUploaded(idx, imgIdx)}
                                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                                  >
                                    <X size={9} />
                                  </button>
                                </div>
                              ))}
                              {/* Pending (local preview) */}
                              {v.pendingFiles.map((file, fi) => {
                                const objUrl = URL.createObjectURL(file);
                                return (
                                  <div key={`pf-${fi}`} className="relative group w-16 h-16">
                                    <img
                                      src={objUrl}
                                      onClick={() => setPreviewImage(objUrl)}
                                      className="w-16 h-16 object-cover rounded-lg border-2 border-dashed border-violet-300 cursor-zoom-in"
                                    />
                                    <div className="absolute inset-0 bg-violet-500/10 rounded-lg flex items-end justify-center pb-1 pointer-events-none">
                                      <span className="text-[9px] text-violet-700 font-bold bg-white/80 px-1 rounded">Pending</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeVariantPending(idx, fi)}
                                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                                    >
                                      <X size={9} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Upload trigger */}
                          <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 hover:border-violet-400 hover:bg-violet-50/40 rounded-xl cursor-pointer transition group">
                            <Upload size={14} className="text-gray-400 group-hover:text-violet-500 transition shrink-0" />
                            <span className="text-xs text-gray-500 group-hover:text-violet-600 transition">
                              {v.uploadedImages.length + v.pendingFiles.length > 0
                                ? `Add more images for this variant`
                                : `Upload images for this variant`}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => addVariantFiles(idx, e.target.files)}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Add button */}
                <button
                  type="button"
                  onClick={addVariant}
                  className="mt-3 w-full border-2 border-dashed border-gray-200 hover:border-violet-300 hover:bg-violet-50/30 text-gray-400 hover:text-violet-500 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
                >
                  <Plus size={14} /> Add Another Variant
                </button>
              </div>

              {/* ── Section: SEO ── */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">SEO</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Meta Title" span={2}>
                    <input
                      placeholder="Enter meta title"
                      value={form.meta_title}
                      onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Meta Description" span={2}>
                    <input
                      placeholder="Enter meta description"
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
