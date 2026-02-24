"use client";

import { useEffect, useState, use } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { RootState } from "@/redux/rootReducer";
import { getProduct, Product } from "@/redux/products/productsApi";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Package, 
  Tag, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  Star, 
  ImageOff,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Heart,
  Share,
  ShoppingCart,
  Eye,
  Plus,
  X
} from "lucide-react";
import Image from "next/image";
import { DeleteModal } from "@/components/common/DeleteModal";
import { deleteProduct } from "@/redux/products/productsApi";

// ── Badge Component ────────────────────────────────────────────────
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

// ── Image Preview Modal ────────────────────────────────────────────
const ImagePreview = ({ url, onClose }: { url: string; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={onClose}>
    <button className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition" onClick={onClose}>
      <XCircle size={20} />
    </button>
    <div className="relative max-w-[90vw] max-h-[90vh] w-full h-full" onClick={(e) => e.stopPropagation()}>
      <Image 
        src={url} 
        alt="Product Preview" 
        fill 
        className="object-contain rounded-2xl shadow-2xl" 
        unoptimized
      />
    </div>
  </div>
);

// ── Stock badge ────────────────────────────────────────────────────
const stockBadge = (stock: number) => {
  if (stock === 0) return <Badge color="red">Out of stock</Badge>;
  if (stock < 10) return <Badge color="amber">{stock} left</Badge>;
  return <Badge color="green">{stock} in stock</Badge>;
};

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { product, loading } = useSelector((state: RootState) => state.products);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'description' | 'additional' | 'benefits' | 'certifications' | 'reviews'>('description');
  
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedWeight, setSelectedWeight] = useState<string | null>(null);
  
  // Unwrap the params Promise
  const unwrappedParams = use(params);
  
  useEffect(() => {
    dispatch(getProduct(unwrappedParams.id));
  }, [dispatch, unwrappedParams.id]);

  // Derived current variant without relying on redundant side-effect sync
  const currentVariant = (product?.variants?.find((v: any) => 
    (v.size || null) === (selectedSize || product?.variants?.[0]?.size || null) && 
    (v.color || null) === (selectedColor || product?.variants?.[0]?.color || null) &&
    (v.weight || null) === (selectedWeight || product?.variants?.[0]?.weight || null)
  )) || product?.variants?.[0];

  useEffect(() => {
    if (product?.variants && product.variants.length > 0 && !selectedSize && !selectedColor && !selectedWeight) {
      const first = product.variants[0];
      // We only set initial state if data is loaded and no selection exists
      // To avoid linter cascading render warning, we can use a functional update or event-driven approach.
      // However, the best way is to derived 'effective' selection in render (see currentVariant above).
    }
  }, [product, selectedSize, selectedColor, selectedWeight]);

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    setActiveImageIndex(0);
    const match = product?.variants?.find((v: any) => 
      (v.size || null) === size && 
      (v.color || null) === (selectedColor || product?.variants?.[0]?.color || null) && 
      (v.weight || null) === (selectedWeight || product?.variants?.[0]?.weight || null)
    );
    if (!match) {
      const fallback = product?.variants?.find((v: any) => (v.size || null) === size);
      if (fallback) {
        setSelectedColor(fallback.color || null);
        setSelectedWeight(fallback.weight || null);
      }
    }
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setActiveImageIndex(0);
    const match = product?.variants?.find((v: any) => 
      (v.size || null) === (selectedSize || product?.variants?.[0]?.size || null) && 
      (v.color || null) === color && 
      (v.weight || null) === (selectedWeight || product?.variants?.[0]?.weight || null)
    );
    if (!match) {
      const fallback = product?.variants?.find((v: any) => (v.color || null) === color);
      if (fallback) {
        setSelectedSize(fallback.size || null);
        setSelectedWeight(fallback.weight || null);
      }
    }
  };

  const handleWeightSelect = (weight: string) => {
    setSelectedWeight(weight);
    setActiveImageIndex(0);
    const match = product?.variants?.find((v: any) => 
      (v.size || null) === (selectedSize || product?.variants?.[0]?.size || null) && 
      (v.color || null) === (selectedColor || product?.variants?.[0]?.color || null) && 
      (v.weight || null) === weight
    );
    if (!match) {
      const fallback = product?.variants?.find((v: any) => (v.weight || null) === weight);
      if (fallback) {
        setSelectedSize(fallback.size || null);
        setSelectedColor(fallback.color || null);
      }
    }
  };

  // Removed setActiveImageIndex(0) effect to avoid cascading render warning.
  // Resets are now handled in handleSelect event handlers.

  // ── Keyboard / scroll lock ───────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPreviewImage(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = previewImage ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [previewImage]);

  // Get all product images from variants
  const getAllImages = (): string[] => {
    if (!product?.variants) return [];
    const allImages: string[] = [];
    product.variants.forEach((variant: any) => {
      if (variant.images) {
        variant.images.forEach((img: any) => {
          allImages.push(img.image_url);
        });
      }
    });
    return [...new Set(allImages)]; // Remove duplicates
  };

  const allImages: string[] = currentVariant?.images && currentVariant.images.length > 0
    ? currentVariant.images.map((img: any) => img.image_url)
    : getAllImages();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#155dfc] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50/60 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package size={28} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Product not found</h2>
          <p className="text-gray-500 mb-6">The product you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <button
            onClick={() => router.push("/products")}
            className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
          >
            ← Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* ── Header ── */}
        <div className="flex flex-wrap gap-3 justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/products")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Products</span>
            </button>
          </div>
          
          {/* <div className="flex gap-2">
            <button
              onClick={() => router.push(`/products/edit/${product.id}`)}
              className="flex items-center gap-2 bg-[#155dfc] hover:bg-[#1246cc] text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-[0_2px_10px_rgba(21,93,252,.28)] hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(21,93,252,.38)]"
            >
              <Edit size={16} /> Edit Product
            </button>
            <DeleteModal
              onConfirm={() => {
                dispatch(deleteProduct(product.id));
                router.push("/products");
              }}
              parentTitle="Delete product?"
              childTitle="This will permanently delete this product and all its variants."
            />
          </div> */}
        </div>

        {/* ── Product Detail Container ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* ── Image Gallery Section ── */}
          <div className="space-y-6">
            {/* Main Image */}
            <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="aspect-square w-full flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-700/30">
                {allImages.length > 0 ? (
                  <Image 
                    src={allImages[activeImageIndex]} 
                    alt={`${product.product_name} - Main View`}
                    width={500}
                    height={500}
                    className="w-full h-full object-contain max-h-[500px] cursor-pointer"
                    onClick={() => setPreviewImage(allImages[activeImageIndex])}
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImageOff size={48} />
                  </div>
                )}
              </div>
              
              {/* Quick View Button */}
              <button 
                onClick={() => setPreviewImage(allImages[activeImageIndex])}
                className="absolute top-4 right-4 bg-white/80 hover:bg-white dark:bg-gray-700/80 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 p-2 rounded-full shadow-md transition"
              >
                <Share size={16} />
              </button>
            </div>
            
            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2.5">
                {allImages.map((imgUrl, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${activeImageIndex === index ? 'border-[#155dfc]' : 'border-gray-200 dark:border-gray-700'}`}
                  >
                    <Image 
                      src={imgUrl} 
                      alt={`View ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* ── Product Information Section ── */}
          <div className="space-y-8">
            {/* Product Header */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {product.is_active ? (
                  <Badge color="green"><CheckCircle2 size={10} /> Active</Badge>
                ) : (
                  <Badge color="red"><XCircle size={10} /> Inactive</Badge>
                )}
                {product.is_featured && <Badge color="amber"><Star size={10} fill="currentColor" /> Featured</Badge>}
                {product.is_bestseller && <Badge color="purple">🔥 Bestseller</Badge>}
                {product.is_new && <Badge color="blue">✨ New Arrival</Badge>}
                <Badge color="purple"><Tag size={10} /> {product.category?.name || "—"}</Badge>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{product.product_name}</h1>
              
              {product.short_desc && (
                <p className="text-gray-600 dark:text-gray-300 text-lg mb-6">{product.short_desc}</p>
              )}
              
              {/* Price Display */}
              {product.variants && product.variants.length > 0 && (
                <div className="mb-6">
                  {currentVariant ? (
                    <>
                      <div className="flex items-end gap-3 mb-2">
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          ₹{currentVariant.price.toLocaleString()}
                        </div>
                        {currentVariant.compare_price && (
                          <div className="text-lg text-gray-500 dark:text-gray-400 line-through mb-1">
                            ₹{currentVariant.compare_price.toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm mt-3">
                        {stockBadge(currentVariant.stock)}
                        {currentVariant.weight && (
                          <span className="text-gray-500 font-medium">Weight: <span className="text-gray-900 dark:text-gray-200">{currentVariant.weight}</span></span>
                        )}
                        {currentVariant.sku && (
                          <span className="text-gray-500 font-medium">SKU: <span className="text-gray-900 dark:text-gray-200">{currentVariant.sku}</span></span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      ₹{Math.min(...product.variants.map((v: any) => v.price)).toLocaleString()}
                      {Math.min(...product.variants.map((v: any) => v.price)) !== Math.max(...product.variants.map((v: any) => v.price)) && 
                        ` - ₹${Math.max(...product.variants.map((v: any) => v.price)).toLocaleString()}`}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Variant Selection */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-6">
                {/* Weight Selection */}
                {Array.from(new Set(product.variants.filter((v: any) => v.weight).map((v: any) => v.weight))).length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-2 font-mono uppercase tracking-widest">Weight Selection</h3>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(product.variants.filter((v: any) => v.weight).map((v: any) => v.weight))).map((weight: any, idx) => {
                        const isSelected = selectedWeight === weight || (!selectedWeight && currentVariant?.weight === weight);
                        return (
                          <button
                            key={idx}
                            onClick={() => handleWeightSelect(weight)}
                            className={`px-4 py-2 border rounded-xl text-sm font-semibold transition-all ${
                              isSelected
                                ? 'border-[#155dfc] text-[#155dfc] bg-blue-50 dark:bg-[#155dfc]/10 shadow-sm'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-[#155dfc] hover:text-[#155dfc]'
                            }`}
                          >
                            {weight}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Size Selection */}
                {Array.from(new Set(product.variants.filter((v: any) => v.size).map((v: any) => v.size))).length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-2 font-mono uppercase tracking-widest">Size Selection</h3>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(product.variants.filter((v: any) => v.size).map((v: any) => v.size))).map((size: any, idx) => {
                        const isSelected = selectedSize === size || (!selectedSize && currentVariant?.size === size);
                        return (
                          <button
                            key={idx}
                            onClick={() => handleSizeSelect(size)}
                            className={`px-4 py-2 border rounded-xl text-sm font-semibold transition-all ${
                              isSelected
                                ? 'border-[#155dfc] text-[#155dfc] bg-blue-50 dark:bg-[#155dfc]/10 shadow-sm'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-[#155dfc] hover:text-[#155dfc]'
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Color Selection */}
                {Array.from(new Set(product.variants.filter((v: any) => v.color).map((v: any) => v.color))).length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-2 font-mono uppercase tracking-widest">Color Selection</h3>
                    <div className="flex flex-wrap gap-3">
                      {Array.from(new Set(product.variants.filter((v: any) => v.color).map((v: any) => v.color))).map((color: any, idx) => {
                        const isSelected = selectedColor === color || (!selectedColor && currentVariant?.color === color);
                        return (
                          <button
                            key={idx}
                            onClick={() => handleColorSelect(color)}
                            className={`flex flex-col items-center p-1.5 rounded-xl border-2 transition-all ${
                              isSelected
                                ? 'border-[#155dfc] bg-blue-50 dark:bg-[#155dfc]/10 shadow-sm'
                                : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                          >
                            <div 
                              className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 shadow-inner"
                              style={{ backgroundColor: color }}
                            ></div>
                            <span className="text-[10px] mt-1 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">{color}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Admin Actions */}
            {/* <div className="space-y-4">
              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/products/edit/${product.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#155dfc] hover:bg-[#1246cc] text-white py-3 px-4 rounded-lg text-base font-medium transition shadow-[0_2px_10px_rgba(21,93,252,.28)] hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(21,93,252,.38)]"
                >
                  <Edit size={20} />
                  Edit Product
                </button>
                
                <DeleteModal
                  onConfirm={() => {
                    dispatch(deleteProduct(product.id));
                    router.push('/products');
                  }}
                  parentTitle="Delete product?"
                  childTitle="This will permanently delete this product and all its variants."
                />
              </div>
            </div> */}
            
            {/* Admin Information */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                    <Package size={18} className="text-[#155dfc]" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Total Variants</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{product.variants?.length || 0}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                    <Star size={18} className="text-[#155dfc]" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Avg Rating</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{product.rating_avg?.toFixed(1) || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* ── Additional Sections ── */}
        <div className="mt-12 space-y-8">
          {/* Product Details Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex -mb-px">
                <button
                  className={`py-4 px-6 text-center font-medium text-sm ${activeTab === 'description' ? 'text-[#155dfc] border-b-2 border-[#155dfc]' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                  onClick={() => setActiveTab('description')}
                >
                  Description
                </button>
                <button
                  className={`py-4 px-6 text-center font-medium text-sm transition-all border-b-2 ${activeTab === 'additional' ? 'text-[#155dfc] border-[#155dfc]' : 'text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                  onClick={() => setActiveTab('additional')}
                >
                  Additional Info
                </button>
                <button
                  className={`py-4 px-6 text-center font-medium text-sm transition-all border-b-2 ${activeTab === 'benefits' ? 'text-[#155dfc] border-[#155dfc]' : 'text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                  onClick={() => setActiveTab('benefits')}
                >
                  Benefits
                </button>
                <button
                  className={`py-4 px-6 text-center font-medium text-sm transition-all border-b-2 ${activeTab === 'certifications' ? 'text-[#155dfc] border-b-2 border-[#155dfc]' : 'text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                  onClick={() => setActiveTab('certifications')}
                >
                  Certifications
                </button>
                <button
                  className={`py-4 px-6 text-center font-medium text-sm transition-all border-b-2 ${activeTab === 'reviews' ? 'text-[#155dfc] border-b-2 border-[#155dfc]' : 'text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                  onClick={() => setActiveTab('reviews')}
                >
                  Reviews
                </button>
              </nav>
            </div>
            
            <div className="p-6">
              {activeTab === 'description' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Product Description</h2>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{product.description}</p>
                  </div>
                </div>
              )}
              
              {activeTab === 'additional' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Additional Information</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 font-mono text-[10px] uppercase tracking-widest">Category</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">{product.category?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 font-mono text-[10px] uppercase tracking-widest">SKU</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">{product.variants && product.variants.length > 0 ? product.variants[0]?.sku || 'N/A' : 'N/A'}</p>
                    </div>
                    {product.country_of_origin && (
                      <div>
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 font-mono text-[10px] uppercase tracking-widest">Origin</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">{product.country_of_origin}</p>
                      </div>
                    )}
                    {product.expiry_months && (
                      <div>
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 font-mono text-[10px] uppercase tracking-widest">Shelf Life</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">{product.expiry_months} Months</p>
                      </div>
                    )}
                    {product.storage_info && (
                      <div className="col-span-2">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 font-mono text-[10px] uppercase tracking-widest">Storage</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">{product.storage_info}</p>
                      </div>
                    )}
                  </div>

                  {product.ingredient && (
                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 font-mono text-[10px] uppercase tracking-widest">Ingredients</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{product.ingredient}</p>
                    </div>
                  )}

                  {product.allergen_info && (
                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                      <h3 className="font-semibold text-red-600 dark:text-red-400 mb-3 font-mono text-[10px] uppercase tracking-widest">Allergen Information</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">{product.allergen_info}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'benefits' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Product Benefits</h2>
                  {product.benefits && product.benefits.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {product.benefits.map((b, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 bg-violet-50 dark:bg-violet-500/5 rounded-xl border border-violet-100 dark:border-violet-500/10">
                          <CheckCircle2 size={18} className="text-violet-500 shrink-0 mt-0.5" />
                          <span className="text-gray-800 dark:text-gray-200 font-medium">{b}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">No benefits listed for this product.</p>
                  )}
                </div>
              )}

              {activeTab === 'certifications' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Certifications</h2>
                  {product.certifications && product.certifications.length > 0 ? (
                    <div className="flex flex-wrap gap-4">
                      {product.certifications.map((c, i) => (
                        <div key={i} className="flex items-center gap-2.5 px-5 py-3 bg-success-50 dark:bg-success-500/5 rounded-xl border border-success-100 dark:border-success-500/10">
                          <CheckCircle2 size={18} className="text-success-500" />
                          <span className="text-gray-800 dark:text-gray-200 font-bold tracking-tight uppercase text-sm">{c}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">No certifications listed for this product.</p>
                  )}
                </div>
              )}
              
              {activeTab === 'reviews' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Customer Reviews</h2>
                  {product.rating_avg !== undefined ? (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={20} 
                              className={`${i < Math.floor(product.rating_avg!) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-500'} `} 
                            />
                          ))}
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">{product.rating_avg?.toFixed(1)} out of 5</span>
                        <span className="text-gray-500 dark:text-gray-400">({product.rating_count || 0} reviews)</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No reviews yet</p>
                  )}
                  
                  <div className="space-y-4">
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">John Doe</h4>
                          <div className="flex items-center gap-1 mt-1">
                            <Star size={14} className="text-amber-400 fill-amber-400" />
                            <Star size={14} className="text-amber-400 fill-amber-400" />
                            <Star size={14} className="text-amber-400 fill-amber-400" />
                            <Star size={14} className="text-amber-400 fill-amber-400" />
                            <Star size={14} className="text-gray-300 dark:text-gray-500" />
                          </div>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">2 days ago</span>
                      </div>
                      <p className="mt-3 text-gray-600 dark:text-gray-300">Great product! Very satisfied with the quality and fast delivery.</p>
                    </div>
                    
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">Jane Smith</h4>
                          <div className="flex items-center gap-1 mt-1">
                            <Star size={14} className="text-amber-400 fill-amber-400" />
                            <Star size={14} className="text-amber-400 fill-amber-400" />
                            <Star size={14} className="text-amber-400 fill-amber-400" />
                            <Star size={14} className="text-amber-400 fill-amber-400" />
                            <Star size={14} className="text-amber-400 fill-amber-400" />
                          </div>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">1 week ago</span>
                      </div>
                      <p className="mt-3 text-gray-600 dark:text-gray-300">Excellent quality and exactly as described. Will buy again!</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          

          
          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* SEO Information */}
            {(product.meta_title || product.meta_desc) && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">SEO Information</h2>
                <div className="space-y-4">
                  {product.meta_title && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Meta Title</p>
                      <p className="text-sm text-gray-800 dark:text-gray-200">{product.meta_title}</p>
                    </div>
                  )}
                  {product.meta_desc && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Meta Description</p>
                      <p className="text-sm text-gray-800 dark:text-gray-200">{product.meta_desc}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            </div>

          {/* Variants Inventory Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Layers size={18} className="text-[#155dfc]" />
                Variants Inventory
              </h2>
              <Badge color="blue">{product.variants?.length || 0} Total Variants</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-700/30">
                    <th className="px-6 py-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Info</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Weight/Size</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">SKU</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Price</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">Stock</th>
                    <th className="px-6 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {product.variants?.map((v: any, idx) => (
                    <tr 
                      key={v.id} 
                      className={`group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${currentVariant?.id === v.id ? 'bg-blue-50/30 dark:bg-[#155dfc]/5' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0 overflow-hidden border border-gray-200 dark:border-gray-600">
                            {v.images?.[0] ? (
                              <Image 
                                src={v.images[0].image_url} 
                                alt="Variant Preview" 
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <Package size={16} className="text-gray-300" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Variant #{idx + 1}</p>
                            <p className="text-[11px] text-gray-400 uppercase font-bold tracking-tight">{v.color || 'Default Color'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{v.weight || '—'}</span>
                          <span className="text-[11px] text-gray-400 font-medium">{v.size || 'No Size'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[11px] font-mono text-gray-600 dark:text-gray-400">{v.sku || 'N/A'}</code>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">₹{v.price.toLocaleString()}</p>
                        {v.compare_price && (
                          <p className="text-[11px] text-gray-400 line-through">₹{v.compare_price.toLocaleString()}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {stockBadge(v.stock)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => {
                            setSelectedSize(v.size || null);
                            setSelectedColor(v.color || null);
                            setSelectedWeight(v.weight || null);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="p-2 text-[#155dfc] hover:bg-[#155dfc]/10 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── Image Preview Modal ── */}
      {previewImage && <ImagePreview url={previewImage} onClose={() => setPreviewImage(null)} />}
    </div>
  );
}