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
  ShoppingCart
} from "lucide-react";
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
    <img src={url} className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl object-contain" onClick={(e) => e.stopPropagation()} />
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
  const [expandedVariants, setExpandedVariants] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'description' | 'additional' | 'reviews'>('description');
  
  // Unwrap the params Promise
  const unwrappedParams = use(params);
  
  useEffect(() => {
    dispatch(getProduct(unwrappedParams.id));
  }, [dispatch, unwrappedParams.id]);

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

  const allImages: string[] = getAllImages();

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
          <p className="text-gray-500 mb-6">The product you're looking for doesn't exist or has been removed.</p>
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
                  <img 
                    src={allImages[activeImageIndex]} 
                    alt={`${product.product_name} - Image ${activeImageIndex + 1}`}
                    className="w-full h-full object-contain max-h-[500px]"
                    onClick={() => setPreviewImage(allImages[activeImageIndex])}
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
                    <img 
                      src={imgUrl} 
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {activeImageIndex === index && (
                      <div className="absolute inset-0 border-2 border-[#155dfc] rounded-xl"></div>
                    )}
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
                <Badge color="purple"><Tag size={10} /> {product.category?.name || "—"}</Badge>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{product.product_name}</h1>
              
              {product.short_desc && (
                <p className="text-gray-600 dark:text-gray-300 text-lg mb-6">{product.short_desc}</p>
              )}
              
              {/* Price Display */}
              {product.variants && product.variants.length > 0 && (
                <div className="mb-6">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    ₹{Math.min(...product.variants.map((v: any) => v.price)).toLocaleString()}
                    {Math.min(...product.variants.map((v: any) => v.price)) !== Math.max(...product.variants.map((v: any) => v.price)) && 
                      ` - ₹${Math.max(...product.variants.map((v: any) => v.price)).toLocaleString()}`}
                  </div>
                  {product.variants.some((v: any) => v.compare_price) && (
                    <div className="text-lg text-gray-500 dark:text-gray-400 line-through">
                      ₹{Math.max(...product.variants.filter((v: any) => v.compare_price).map((v: any) => v.compare_price)).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Variant Selection */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-6">
                {/* Size Selection */}
                {Array.from(new Set(product.variants.filter((v: any) => v.size).map((v: any) => v.size))).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">SIZE</h3>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(product.variants.filter((v: any) => v.size).map((v: any) => v.size))).map((size, idx) => (
                        <button
                          key={idx}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:border-[#155dfc] hover:text-[#155dfc] dark:hover:text-[#155dfc] transition-colors"
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Color Selection */}
                {Array.from(new Set(product.variants.filter((v: any) => v.color).map((v: any) => v.color))).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">COLOR</h3>
                    <div className="flex flex-wrap gap-3">
                      {Array.from(new Set(product.variants.filter((v: any) => v.color).map((v: any) => v.color))).map((color, idx) => (
                        <button
                          key={idx}
                          className="flex flex-col items-center"
                        >
                          <div 
                            className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: color }}
                          ></div>
                          <span className="text-xs mt-1 text-gray-600 dark:text-gray-300">{color}</span>
                        </button>
                      ))}
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
                  className={`py-4 px-6 text-center font-medium text-sm ${activeTab === 'additional' ? 'text-[#155dfc] border-b-2 border-[#155dfc]' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                  onClick={() => setActiveTab('additional')}
                >
                  Additional Info
                </button>
                <button
                  className={`py-4 px-6 text-center font-medium text-sm ${activeTab === 'reviews' ? 'text-[#155dfc] border-b-2 border-[#155dfc]' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
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
                      <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Category</h3>
                      <p className="text-gray-600 dark:text-gray-300">{product.category?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">SKU</h3>
                      <p className="text-gray-600 dark:text-gray-300">{product.variants && product.variants.length > 0 ? product.variants[0]?.sku || 'N/A' : 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Created</h3>
                      <p className="text-gray-600 dark:text-gray-300">{product.created_at ? new Date(product.created_at).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Updated</h3>
                      <p className="text-gray-600 dark:text-gray-300">{product.updated_at ? new Date(product.updated_at).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
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
          
          {/* Variants Section */}
          {product.variants && product.variants.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
              <div className="flex flex-wrap gap-3 justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Product Variants</h2>
                <button
                  onClick={() => setExpandedVariants(!expandedVariants)}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  {expandedVariants ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  {expandedVariants ? 'Hide' : 'Show'} variants
                </button>
              </div>
              
              {expandedVariants && (
                <div className="space-y-4">
                  {product.variants.map((variant: any) => (
                    <div key={variant.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Variant Images */}
                        {variant.images && variant.images.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {variant.images.map((img: any, imgIdx: number) => (
                              <div key={imgIdx} className="relative">
                                <img
                                  src={img.image_url}
                                  alt={`Variant image ${imgIdx + 1}`}
                                  onClick={() => setPreviewImage(img.image_url)}
                                  className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700 cursor-zoom-in hover:scale-105 hover:shadow-md transition"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">SKU</h3>
                              <p className="font-medium text-gray-900 dark:text-gray-200">{variant.sku || '—'}</p>
                            </div>
                            <div>
                              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Size</h3>
                              <p className="font-medium text-gray-900 dark:text-gray-200">{variant.size || '—'}</p>
                            </div>
                            <div>
                              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Color</h3>
                              <p className="font-medium text-gray-900 dark:text-gray-200">
                                {variant.color ? (
                                  <span className="flex items-center gap-2">
                                    <span
                                      className="inline-block w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                                      style={{ backgroundColor: variant.color }}
                                    ></span>
                                    {variant.color}
                                  </span>
                                ) : '—'}
                              </p>
                            </div>
                            <div>
                              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Stock</h3>
                              <p className="font-medium">{stockBadge(variant.stock)}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div>
                              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Price</h3>
                              <p className="font-medium text-gray-900 dark:text-gray-200">₹{variant.price.toLocaleString()}</p>
                            </div>
                            <div>
                              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Compare Price</h3>
                              <p className="font-medium text-gray-500 dark:text-gray-400">{variant.compare_price ? `₹${variant.compare_price.toLocaleString()}` : '—'}</p>
                            </div>
                            <div>
                              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Created</h3>
                              <p className="font-medium text-gray-900 dark:text-gray-200">{variant.created_at ? new Date(variant.created_at).toLocaleDateString() : '—'}</p>
                            </div>
                            <div>
                              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Updated</h3>
                              <p className="font-medium text-gray-900 dark:text-gray-200">{variant.updated_at ? new Date(variant.updated_at).toLocaleDateString() : '—'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
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
            
            {/* Product Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Product Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status</span>
                  <span className={`font-medium ${product.is_active ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Featured</span>
                  <span className={`font-medium ${product.is_featured ? 'text-warning-600 dark:text-warning-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    {product.is_featured ? 'Yes' : 'No'}
                  </span>
                </div>
                {product.rating_avg !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Rating</span>
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-amber-400 fill-current" />
                      <span className="font-medium text-gray-900 dark:text-white">{product.rating_avg?.toFixed(1)}</span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">({product.rating_count || 0})</span>
                    </div>
                  </div>
                )}
                {product.sold_count !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Sold</span>
                    <span className="font-medium text-gray-900 dark:text-white">{product.sold_count}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Image Preview Modal ── */}
      {previewImage && <ImagePreview url={previewImage} onClose={() => setPreviewImage(null)} />}
    </div>
  );
}