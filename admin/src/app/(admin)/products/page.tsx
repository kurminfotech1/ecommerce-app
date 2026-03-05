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
import Link from "next/link";
import { getCategories, Category } from "@/redux/categories/categoriesApi";
import { usePermission } from "@/hooks/usePermission";

import {
  Search, Plus, Eye, Pencil, Trash2, X,
  ChevronLeft, ChevronRight, Star, Package,
  LayoutGrid, List, ImageOff, Tag, Layers,
  CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Loader2, Upload,
} from "lucide-react";
import { DeleteModal } from "@/components/common/DeleteModal";

// ── Badge ──────────────────────────────────────────────────────────
const Badge = ({ children, color = "gray" }: { children: React.ReactNode; color?: string }) => {
  const colors: Record<string, string> = {
    green: "bg-success-50 text-success-700 border-success-200 dark:bg-success-500/20 dark:text-success-400 dark:border-success-500/30",
    red: "bg-error-50 text-error-600 border-error-200 dark:bg-error-500/20 dark:text-error-400 dark:border-error-500/30",
    blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30",
    amber: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-500/20 dark:text-warning-400 dark:border-warning-500/30",
    gray: "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30",
    purple: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${colors[color]}`}>
      {children}
    </span>
  );
};

// â”€â”€ Image Preview Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ImagePreview = ({ url, onClose }: { url: string; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={onClose}>
    <button className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition" onClick={onClose}>
      <X size={20} />
    </button>
    <img src={url} className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl object-contain" onClick={(e) => e.stopPropagation()} />
  </div>
);

// â”€â”€ Form Field â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Field = ({ label, children, span = 1 }: { label: string; children: React.ReactNode; span?: number }) => (
  <div className={span === 2 ? "col-span-2" : ""}>
    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#155dfc] focus:bg-white dark:focus:bg-gray-700 transition placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-white";
const selectCls = `${inputCls} cursor-pointer`;

const TagInput = ({ tags, setTags, placeholder }: { tags: string[], setTags: (t: string[]) => void, placeholder: string }) => {
  const [val, setVal] = useState("");
  const add = () => {
    if (val.trim() && !tags.includes(val.trim())) {
      setTags([...tags, val.trim()]);
      setVal("");
    }
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
          className={inputCls}
        />
        <button
          type="button"
          onClick={e => { e.preventDefault(); add(); }}
          className="px-4 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition text-gray-500"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-[#155dfc] dark:text-violet-400 rounded-lg text-[13px] font-medium border border-violet-100 dark:border-violet-500/20">
            {t}
            <button type="button" onClick={() => setTags(tags.filter((_, idx) => idx !== i))} className="hover:text-[#0d3fa6] dark:hover:text-white transition">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

// â”€â”€ Utility: find category node anywhere in the tree â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function findCatNode(nodes: Category[], id: string): Category | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findCatNode(n.children ?? [], id);
    if (found) return found;
  }
  return null;
}

// â”€â”€ Resolve L1/L2/L3 from a leaf category_id (bottom-up) â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Empty state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-4">
      <Package size={28} className="text-gray-400 dark:text-gray-500" />
    </div>
    <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">No products yet</p>
    <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">Start adding products to your inventory.</p>
    <button onClick={onAdd} className="bg-[#155dfc] hover:bg-[#1246cc] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm">
      + Add First Product
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { products, totalPages, totalRecords, loading, submitting, uploading } =
    useSelector((s: RootState) => s.products);
  const { categories } = useSelector((s: RootState) => s.categories);
  console.log(categories);

  // ── Permission flags ────────────────────────────────────────────
  const { canCreate, canUpdate, canDelete } = usePermission("Products");
 
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [weightFilter, setWeightFilter] = useState("");
  const [minPriceFilter, setMinPriceFilter] = useState("");
  const [maxPriceFilter, setMaxPriceFilter] = useState("");
  const [page, setPage] = useState(1);


  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const emptyForm = {
    product_name: "", slug: "", short_desc: "", description: "",
    category_id: "",
    ingredient: "", benefits: [] as string[], certifications: [] as string[],
    country_of_origin: "", expiry_months: "", storage_info: "", allergen_info: "",
    meta_title: "", meta_desc: "",
    is_active: true, is_featured: false, is_bestseller: false, is_new: false, is_upcoming: false,
  };

  type VariantRow = {
    size: string; color: string;
    weight: string;
    price: string; compare_price: string;
    stock: string;
    low_stock_threshold: string;
    sku: string;
    uploadedImages: string[]; // already-uploaded URLs
    pendingFiles: File[];   // queued for upload
  };
  const emptyVariantRow = (): VariantRow => ({
    size: "", color: "", weight: "", price: "", compare_price: "", stock: "0", low_stock_threshold: "5", sku: "",
    uploadedImages: [], pendingFiles: [],
  });

  const [form, setForm] = useState<any>(emptyForm);
  const [variants, setVariants] = useState<VariantRow[]>([emptyVariantRow()]); // multi-variant rows

  // â”€â”€ Cascading category state (L1 = main, L2 = child, L3 = sub) â”€
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


  const fetchProducts = useCallback(() => {
    dispatch(getProducts({
      page,
      limit: 10,
      search,
      category: categoryFilter,
      active: activeFilter === "true" ? true : activeFilter === "false" ? false : undefined,
      featured: typeFilter === "featured" ? true : undefined,
      bestseller: typeFilter === "bestseller" ? true : undefined,
      is_new: typeFilter === "new" ? true : undefined,
      is_upcoming: typeFilter === "upcoming" ? true : undefined,
      weight: weightFilter || undefined,
      min_price: minPriceFilter ? Number(minPriceFilter) : undefined,
      max_price: maxPriceFilter ? Number(maxPriceFilter) : undefined,
    }));
  }, [page, search, categoryFilter, activeFilter, typeFilter, weightFilter, minPriceFilter, maxPriceFilter, dispatch]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { dispatch(getCategories()); }, [dispatch]);


  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPreviewImage(null);
        setModalOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = previewImage || modalOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [previewImage, modalOpen]);


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
      ingredient: p.ingredient ?? "",
      benefits: p.benefits ?? [],
      certifications: p.certifications ?? [],
      country_of_origin: p.country_of_origin ?? "",
      expiry_months: p.expiry_months ? String(p.expiry_months) : "",
      storage_info: p.storage_info ?? "",
      allergen_info: p.allergen_info ?? "",
      meta_title: p.meta_title ?? "",
      meta_desc: p.meta_desc ?? "",
      is_active: p.is_active,
      is_featured: p.is_featured,
      is_bestseller: p.is_bestseller ?? false,
      is_new: p.is_new ?? false,
      is_upcoming: p.is_upcoming ?? false,
    });
    // Pre-fill variants â€” including their existing images
    if (p.variants && p.variants.length > 0) {
      setVariants(p.variants.map((v) => ({
        size: v.size ?? "",
        color: v.color ?? "",
        weight: v.weight ?? "",
        price: String(v.price),
        compare_price: v.compare_price ? String(v.compare_price) : "",
        stock: String(v.stock),
        low_stock_threshold: v.low_stock_threshold ? String(v.low_stock_threshold) : "5",
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
        weight: v.weight || undefined,
        price: Number(v.price),
        compare_price: v.compare_price ? Number(v.compare_price) : undefined,
        stock: Number(v.stock || 0),
        low_stock_threshold: v.low_stock_threshold ? Number(v.low_stock_threshold) : undefined,
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

      ingredient: form.ingredient || null,
      benefits: form.benefits,
      certifications: form.certifications,
      country_of_origin: form.country_of_origin || null,
      expiry_months: form.expiry_months ? Number(form.expiry_months) : null,
      storage_info: form.storage_info || null,
      allergen_info: form.allergen_info || null,

      is_active: form.is_active,
      is_featured: form.is_featured,
      is_bestseller: form.is_bestseller,
      is_new: form.is_new,
      is_upcoming: form.is_upcoming,

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


  const stockBadge = (stock: number) => {
    if (stock === 0) return <Badge color="red">Out of stock</Badge>;
    if (stock < 10) return <Badge color="amber">{stock} left</Badge>;
    return <Badge color="green">{stock} in stock</Badge>;
  };


  const ProductCard = ({ product }: { product: Product }) => {
    const firstVariant = product.variants?.[0];
    const firstImage = firstVariant?.images?.[0]?.image_url;
    console.log("product", product);
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
        <Link href={`/products/${product.id}`}>
          <div className="relative">
            <div className="aspect-square bg-gray-100 flex items-center justify-center">
              {firstImage ? (
                <img
                  src={firstImage}
                  alt={product.product_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageOff size={32} className="text-gray-300" />
              )}
            </div>

            {/* Featured badge */}
            <div className="absolute top-3 left-3 flex flex-col gap-1">
              {product.is_featured && (
                <Badge color="amber">
                  <Star size={10} fill="currentColor" /> Featured
                </Badge>
              )}
              {product.is_bestseller && (
                <Badge color="purple">
                  🔥 Bestseller
                </Badge>
              )}
              {product.is_new && (
                <Badge color="blue">
                  ✨ New
                </Badge>
              )}
              {product.is_upcoming && (
                <Badge color="gray">
                  ⏳ Coming Soon
                </Badge>
              )}
            </div>

            {/* Status badge */}
            <div className="absolute top-3 right-3">
              {product.is_active ? (
                <Badge color="green"><CheckCircle2 size={10} /> Active</Badge>
              ) : (
                <Badge color="red"><XCircle size={10} /> Inactive</Badge>
              )}
            </div>
          </div>
        </Link>

        <div className="p-4">
          <Link href={`/products/${product.id}`} className="block">
            <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2 group-hover:text-[#155dfc] transition-colors">
              {product.product_name}
            </h3>
          </Link>

          {product.short_desc && (
            <p className="text-xs text-gray-500 mb-3 line-clamp-2">
              {product.short_desc}
            </p>
          )}

          <div className="flex items-center justify-between mb-3">
            <div>
              {firstVariant ? (
                <>
                  <p className="font-bold text-gray-900">₹{firstVariant.price.toLocaleString()}</p>
                  {firstVariant.compare_price && (
                    <p className="text-xs text-gray-400 line-through">₹{firstVariant.compare_price.toLocaleString()}</p>
                  )}
                </>
              ) : (
                <span className="text-gray-400">No price</span>
              )}
            </div>

            <div>
              {firstVariant ? stockBadge(firstVariant.stock) : <span className="text-gray-400">—</span>}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <Badge color="purple">
              <Tag size={10} />
              {product.category?.name || "—"}
            </Badge>

            {product.variants && product.variants.length > 0 && (
              <Badge color="blue">
                <Layers size={10} />
                {product.variants.length} variant{product.variants.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
            {canUpdate && (
              <button
                onClick={() => openEdit(product)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-[#155dfc] py-2 rounded-lg text-sm font-medium transition"
              >
                <Pencil size={14} />
                Edit
              </button>
            )}
            {canDelete && (
              <DeleteModal
                onConfirm={() => dispatch(deleteProduct(product.id))}
                parentTitle="Delete product?"
                childTitle="This will permanently delete this product and all its variants."
              />
            )}
            {!canUpdate && !canDelete && (
              <span className="text-xs text-gray-400 italic w-full text-center py-1">Read only</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* â”€â”€ Header â”€â”€ */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Products</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {totalRecords} product{totalRecords !== 1 ? "s" : ""} total
              </p>
            </div>
            {/* Add button */}
            {canCreate && (
              <button
                onClick={openCreate}
                className="flex items-center gap-2 bg-[#155dfc] hover:bg-[#1246cc] active:scale-95 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition"
              >
                <Plus size={16} /> Add Product
              </button>
            )}
          </div>

          {/* â”€â”€ Filters Bar â”€â”€ */}
          <div className="flex gap-2 flex-wrap items-center bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            {/* Search */}
            <div className="relative flex-1 min-w-[280px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search products..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#155dfc] w-full transition"
              />
            </div>

            {/* Category filter */}
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-sm px-3 py-2 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#155dfc] transition min-w-[200px]"
            >
              <option value="">All categories</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name || c.category_name}</option>
              ))}
            </select>

            {/* Weight filter */}
            <input
              placeholder="Weight (e.g. 100g, 250g)"
              value={weightFilter}
              onChange={(e) => { setWeightFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-sm px-3 py-2 rounded-xl w-44 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#155dfc] transition"
            />

            {/* Price filter */}
            <div className="flex items-center gap-1">
              <input
                type="number"
                placeholder="Min ₹"
                value={minPriceFilter}
                onChange={(e) => { setMinPriceFilter(e.target.value); setPage(1); }}
                className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-sm px-3 py-2 rounded-xl w-32 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#155dfc] transition"
              />
              <span className="text-gray-400 dark:text-gray-500">-</span>
              <input
                type="number"
                placeholder="Max ₹"
                value={maxPriceFilter}
                onChange={(e) => { setMaxPriceFilter(e.target.value); setPage(1); }}
                className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-sm px-3 py-2 rounded-xl w-32 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#155dfc] transition"
              />
            </div>

            {/* Status Filter */}
            <select
              value={activeFilter}
              onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-sm px-3 py-2 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#155dfc] transition"
            >
              <option value="">Status: All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            {/* Product Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-sm px-3 py-2 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#155dfc] transition"
            >
              <option value="">Type: All</option>
              <option value="featured">Featured</option>
              <option value="bestseller">Bestseller</option>
              <option value="new">New Arrivals</option>
              <option value="upcoming">Coming Soon</option>
            </select>
          </div>
        </div>

        {/* â”€â”€ Product Cards Grid â”€â”€ */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : products?.length === 0 ? (
          <EmptyState onAdd={openCreate} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* â”€â”€ Pagination â”€â”€ */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>


      {previewImage && <ImagePreview url={previewImage} onClose={() => setPreviewImage(null)} />}

     
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-xl z-20 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editId ? "Edit Product" : "Add New Product"}
                </h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {editId ? "Update product details" : "Fill in the details to create a new product"}
                </p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar">

              {/* â”€â”€ Section: Basic â”€â”€ */}
              <div>
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
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

                  {/* â”€â”€ Cascading Category: Level 1 (Main) â”€â”€ */}
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

                  {/* â”€â”€ Cascading Category: Level 2 (Child) â€” only if L1 has children â”€â”€ */}
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

                  {/* â”€â”€ Cascading Category: Level 3 (Sub-child) â€” only if L2 has children â”€â”€ */}
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
                        <span className="font-semibold text-[#155dfc]">
                          {[catL1, catL2, catL3]
                            .filter(Boolean)
                            .map((id) => findCatNode(categories as Category[], id)?.name)
                            .join(" â€º ")}
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

              {/* â”€â”€ Section: Lifestyle/Organic â”€â”€ */}
              <div>
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  ðŸŒ± Wellness & Organic Details
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Ingredients" span={2}>
                    <textarea
                      placeholder="e.g. Organic Hemp, Raw Honey..."
                      value={form.ingredient}
                      onChange={e => setForm({ ...form, ingredient: e.target.value })}
                      className={inputCls}
                      rows={2}
                    />
                  </Field>
                  <Field label="Country of Origin">
                    <input
                      placeholder="e.g. India"
                      value={form.country_of_origin}
                      onChange={e => setForm({ ...form, country_of_origin: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Expiry (Months)">
                    <input
                      type="number"
                      placeholder="e.g. 12"
                      value={form.expiry_months}
                      onChange={e => setForm({ ...form, expiry_months: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Storage Info">
                    <input
                      placeholder="e.g. Store in cool dry place"
                      value={form.storage_info}
                      onChange={e => setForm({ ...form, storage_info: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Allergen Info">
                    <input
                      placeholder="e.g. Contains Nuts"
                      value={form.allergen_info}
                      onChange={e => setForm({ ...form, allergen_info: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Benefits" span={2}>
                    <TagInput
                      placeholder="Add a benefit (e.g. Energy Boost)"
                      tags={form.benefits}
                      setTags={t => setForm({ ...form, benefits: t })}
                    />
                  </Field>
                  <Field label="Certifications" span={2}>
                    <TagInput
                      placeholder="Add a certification (e.g. USDA Organic)"
                      tags={form.certifications}
                      setTags={t => setForm({ ...form, certifications: t })}
                    />
                  </Field>
                </div>
              </div>

              {/* â”€â”€ Section: Variants â”€â”€ */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Layers size={12} /> Variants
                    <span className="ml-1 px-1.5 py-0.5 bg-[#155dfc]/10 text-[#155dfc] rounded-full text-[10px] font-bold">
                      {variants.length}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#155dfc] hover:text-[#1246cc] bg-[#155dfc]/10 hover:bg-[#155dfc]/20 px-3 py-1.5 rounded-lg transition"
                  >
                    <Plus size={12} /> Add Variant
                  </button>
                </div>

                <div className="space-y-4">
                  {variants.map((v, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm"
                    >
                      {/* Variant card header */}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                          Variant#{idx + 1}
                          {(v.size || v.color) && (
                            <span className="ml-2 font-normal text-gray-400 dark:text-gray-500 capitalize">
                              {[v.size, v.color].filter(Boolean).join(" Â· ")}
                            </span>
                          )}
                        </span>
                        {variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVariant(idx)}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-400 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition"
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

                          {/* Weight */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                              Weight (e.g. 500g, 1kg)
                            </label>
                            <input
                              placeholder="e.g. 250g"
                              value={v.weight}
                              onChange={(e) => updateVariant(idx, "weight", e.target.value)}
                              className={inputCls}
                            />
                          </div>

                          {/* Low Stock Alert */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                              Low Stock Threshold
                            </label>
                            <input
                              type="number"
                              placeholder="5"
                              value={v.low_stock_threshold}
                              onChange={(e) => updateVariant(idx, "low_stock_threshold", e.target.value)}
                              className={inputCls}
                            />
                          </div>

                          {/* Size */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                              Size (Optional)
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
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                              Color (Optional)
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={v.color?.startsWith("#") ? v.color : "#000000"}
                                onChange={(e) => updateVariant(idx, "color", e.target.value)}
                                className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer p-0.5 bg-gray-50 dark:bg-gray-700 shrink-0"
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

                        {/* â”€â”€ Variant Images â”€â”€ */}
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
                                      className="w-16 h-16 object-cover rounded-lg border-2 border-dashed border-[#155dfc]/40 cursor-zoom-in"
                                    />
                                    <div className="absolute inset-0 bg-blue-500/10 rounded-lg flex items-end justify-center pb-1 pointer-events-none">
                                      <span className="text-[9px] text-[#155dfc] font-bold bg-white/80 px-1 rounded">Pending</span>
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
                          <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 hover:border-[#155dfc] dark:hover:border-[#155dfc] hover:bg-[#155dfc]/10 dark:hover:bg-[#155dfc]/10 rounded-xl cursor-pointer transition group">
                            <Upload size={14} className="text-gray-400 dark:text-gray-500 group-hover:text-[#155dfc] transition shrink-0" />
                            <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-[#155dfc] transition">
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
                  className="mt-3 w-full border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-[#155dfc] dark:hover:border-[#155dfc] hover:bg-[#155dfc]/10 dark:hover:bg-[#155dfc]/10 text-gray-400 dark:text-gray-500 hover:text-[#155dfc] py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
                >
                  <Plus size={14} /> Add Another Variant
                </button>
              </div>

              {/* â”€â”€ Section: SEO â”€â”€ */}
              <div>
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">SEO</p>
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

              {/* â”€â”€ Section: Status â”€â”€ */}
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div
                    onClick={() => setForm({ ...form, is_active: !form.is_active })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${form.is_active ? "bg-[#155dfc]" : "bg-gray-200 dark:bg-gray-600"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div
                    onClick={() => setForm({ ...form, is_featured: !form.is_featured })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${form.is_featured ? "bg-amber-400 dark:bg-amber-500" : "bg-gray-200 dark:bg-gray-600"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_featured ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Featured</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div
                    onClick={() => setForm({ ...form, is_bestseller: !form.is_bestseller })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${form.is_bestseller ? "bg-purple-500" : "bg-gray-200 dark:bg-gray-600"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_bestseller ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bestseller</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div
                    onClick={() => setForm({ ...form, is_new: !form.is_new })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${form.is_new ? "bg-blue-400" : "bg-gray-200 dark:bg-gray-600"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_new ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">New Arrival</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div
                    onClick={() => setForm({ ...form, is_upcoming: !form.is_upcoming })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${form.is_upcoming ? "bg-gray-500" : "bg-gray-200 dark:bg-gray-600"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_upcoming ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Coming Soon</span>
                </label>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 rounded-b-xl shrink-0 z-20">
              <button
                onClick={handleSubmit}
                disabled={submitting || uploading}
                className=" flex items-center justify-center gap-2 bg-[#155dfc] hover:bg-[#1246cc] disabled:opacity-60 text-white px-2 py-2.5 rounded-xl text-sm font-semibold transition"
              >
                {(submitting || uploading) && <Loader2 size={15} className="animate-spin" />}
                {uploading ? "Uploading images..." : submitting ? "Saving..." : editId ? "Update Product" : "Create Product"}
              </button>
              <button
                onClick={closeModal}
                disabled={submitting || uploading}
                className="px-6 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl text-sm font-semibold transition"
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
