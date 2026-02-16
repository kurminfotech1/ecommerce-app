"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { RootState } from "@/redux/rootReducer";

import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/redux/products/productsApi";

import { getCategories } from "@/redux/categories/categoriesApi";

import { Eye, Pencil, Trash2, X } from "lucide-react";

const SkeletonTable = () => (
  <div className="bg-white rounded-xl shadow border overflow-hidden">
    <div className="divide-y">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 animate-pulse"
        >
          <div className="w-12 h-12 bg-gray-200 rounded-lg" />

          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-200 rounded w-1/4" />
          </div>

          <div className="w-20 h-4 bg-gray-200 rounded" />
          <div className="w-16 h-4 bg-gray-200 rounded" />
          <div className="w-24 h-4 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  </div>
);

export default function ProductsPage() {
  const dispatch = useDispatch<AppDispatch>();

  const { products, totalPages, loading } = useSelector((s: RootState) => s.products);
  const { categories } = useSelector((s: RootState) => s.categories);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [detailProduct, setDetailProduct] = useState<any>(null);

  const emptyForm = {
    product_name: "",
    slug: "",
    short_desc: "",
    description: "",
    price: "",
    compare_price: "",
    stock: "",
    category_id: "",
    meta_title: "",
    meta_desc: "",
    is_featured: false,
  };

  const [form, setForm] = useState<any>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [skuPreview, setSkuPreview] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    dispatch(getProducts({
      page,
      limit: 10,
      search,
      category: categoryFilter,
    }));
    dispatch(getCategories());
  }, [page, search, categoryFilter]);

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
    document.body.style.overflow =
      previewImage || detailProduct || modalOpen
        ? "hidden"
        : "auto";
  }, [previewImage, detailProduct, modalOpen]);


  const openCreate = () => {
    setForm(emptyForm);
    setImages([]);
    setSkuPreview("");
    setEditId(null);
    setModalOpen(true);
  };

  const openEdit = (p: any) => {
    setEditId(p.id);
    setSkuPreview(p.sku);
    setImages(p.images?.map((i: any) => i.image_url) || []);

    setForm({
      ...p,
      price: String(p.price),
      compare_price: p.compare_price ?? "",
      stock: String(p.stock),
      category_id: String(p.category_id),
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditId(null);
  };

  const handleName = (name: string) => {
    setForm({
      ...form,
      product_name: name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
    });
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return;

    setUploading(true);

    const urls: string[] = [];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      urls.push(data.url);
    }

    setImages((prev) => [...prev, ...urls]);
    setUploading(false);
  };

  const handleSubmit = async () => {
    const payload = {
      ...form,
      price: Number(form.price),
      compare_price: form.compare_price
        ? Number(form.compare_price)
        : null,
      stock: Number(form.stock),
      category_id: Number(form.category_id),
    };

    let res: any;

    if (editId) {
      res = await dispatch(updateProduct({ id: editId, ...payload }));
    } else {
      res = await dispatch(createProduct(payload));
    }

    const productId = res.payload.id;

    if (images.length) {
      await fetch("/api/product-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: images.map((url) => ({
            product_id: productId,
            image_url: url,
          })),
        }),
      });
    }

    dispatch(getProducts({
      page,
      limit: 10,
      search,
      category: categoryFilter,
    }));
    closeModal();
  };

  return (
    <>
      <div className="flex flex-wrap gap-3 justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>

        <div className="flex gap-3 items-center">

          <input
            placeholder="Search product..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border px-4 py-2 rounded-lg w-64 focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All categories</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.category_name}
              </option>
            ))}
          </select>

          <button
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow disabled:opacity-50"
            disabled={loading}
          >
            + Add Product
          </button>

        </div>
      </div>

      {loading ? (
          <SkeletonTable />
      ) : products.length === 0 ? (
        <div className="bg-white border rounded-xl shadow p-10 text-center text-gray-500">
          No products found
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow border overflow-hidden">

          <div className="max-h-[520px] overflow-y-auto">

            <table className="w-full">

              {/* Sticky header */}
              <thead className="top-0 bg-gray-100 text-left text-sm shadow">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((p: any) => (
                  <tr
                    key={p.id}
                    className="border-t hover:bg-gray-50"
                    // onClick={() => setDetailProduct(p)}
                  >
                    <td className="p-3">
                      <div className="flex gap-3 items-center">
                        {p.images?.[0] && (
                          <img
                            src={p.images[0].image_url}
                            className="w-12 h-12 object-cover rounded-lg border cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage(p.images[0].image_url);
                            }}
                          />
                        )}
                        <div>
                          <p className="font-medium">
                            {p.product_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {p.short_desc}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">
                      {p.category?.category_name}
                    </td>

                    <td className="p-3">₹{p.price}</td>
                    <td className="p-3">{p.stock}</td>
                    <td className="p-3 text-xs">{p.sku}</td>

                    <td
                      className="p-3 text-right flex gap-2 justify-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setDetailProduct(p)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-700"
                      >
                        <Eye size={18} />
                      </button>

                      <button
                        onClick={() => openEdit(p)}
                        className="p-2 hover:bg-blue-100 rounded-lg text-blue-600"
                      >
                        <Pencil size={18} />
                      </button>

                      <button
                        onClick={() => dispatch(deleteProduct(p.id))}
                        className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </div>
        // <table className="w-full bg-white rounded-xl shadow border overflow-hidden">
        //   <thead className="bg-gray-100 text-left text-sm">
        //     <tr>
        //       <th className="p-3">Product</th>
        //       <th className="p-3">Category</th>
        //       <th className="p-3">Price</th>
        //       <th className="p-3">Stock</th>
        //       <th className="p-3">SKU</th>
        //       <th className="p-3 text-right">Actions</th>
        //     </tr>
        //   </thead>

        //   <tbody>
        //     {products.map((p: any) => (
        //       <tr key={p.id} className="border-t hover:bg-gray-50">
        //         <td className="p-3">
        //           <div className="flex gap-3 items-center">
        //             {p.images?.[0] && (
        //               <img
        //                 src={p.images[0].image_url}
        //                 className="w-12 h-12 object-cover rounded-lg border"
        //                 onClick={(e) => {
        //                   e.stopPropagation();
        //                   setPreviewImage(p.images[0].image_url);
        //                 }}
        //               />
        //             )}
        //             <div>
        //               <p className="font-medium">
        //                 {p.product_name}
        //               </p>
        //               <p className="text-xs text-gray-500">
        //                 {p.short_desc}
        //               </p>
        //             </div>
        //           </div>
        //         </td>

        //         <td className="p-3">
        //           {p.category?.category_name}
        //         </td>

        //         <td className="p-3">₹{p.price}</td>
        //         <td className="p-3">{p.stock}</td>
        //         <td className="p-3 text-xs">{p.sku}</td>

        //         <td className="p-3 text-right flex gap-2 justify-end">
        //           <button
        //             onClick={() => openEdit(p)}
        //             className="p-2 hover:bg-blue-100 rounded-lg text-blue-600"
        //           >
        //             <Pencil size={18} />
        //           </button>

        //           <button
        //             onClick={() => dispatch(deleteProduct(p.id))}
        //             className="p-2 hover:bg-red-100 rounded-lg text-red-600"
        //           >
        //             <Trash2 size={18} />
        //           </button>
        //         </td>
        //       </tr>
        //     ))}
        //   </tbody>
        // </table>
      )}

      {products.length > 0 && totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Prev
          </button>

          <span className="px-4 py-1">
            Page {page}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Product Detail Modal */}

      {detailProduct && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setDetailProduct(null)}
        >
          <div
            className="bg-white rounded-xl w-[900px] max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {detailProduct.product_name}
              </h2>
              <button onClick={() => setDetailProduct(null)}>
                <X />
              </button>
            </div>

            {detailProduct.images?.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mb-6">
                {detailProduct.images.map((img: any, i: number) => (
                  <img
                    key={i}
                    src={img.image_url}
                    className="rounded-lg cursor-pointer border hover:scale-105 transition"
                    onClick={() => setPreviewImage(img.image_url)}
                  />
                ))}
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-6 mb-6">

              <div>
                <h3 className="font-semibold mb-2">Basic</h3>
                <p><b>Slug:</b> {detailProduct.slug || "-"}</p>
                <p><b>Category:</b> {detailProduct.category?.category_name}</p>
                <p><b>SKU:</b> {detailProduct.sku}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Pricing</h3>
                <p><b>Price:</b> ₹{detailProduct.price}</p>
                <p>
                  <b>Compare:</b>{" "}
                  {detailProduct.compare_price
                    ? `₹${detailProduct.compare_price}`
                    : "-"}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Inventory</h3>
                <p><b>Stock:</b> {detailProduct.stock}</p>
                <p>
                  <b>Status:</b>{" "}
                  {detailProduct.is_active ? "Active" : "Inactive"}
                </p>
                <p>
                  <b>Featured:</b>{" "}
                  {detailProduct.is_featured ? "Yes" : "No"}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">SEO</h3>
                <p><b>Meta title:</b> {detailProduct.meta_title || "-"}</p>
                <p><b>Meta desc:</b> {detailProduct.meta_desc || "-"}</p>
              </div>

            </div>

            {/* Descriptions */}
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Short description</h3>
              <p className="text-gray-700">
                {detailProduct.short_desc || "-"}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Full description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {detailProduct.description || "-"}
              </p>
            </div>

          </div>
        </div>
      )}


      {/* Image Preview Modal */}

      {previewImage && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative">

            <img
              src={previewImage}
              className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-lg"
            />

            <button
              className="absolute top-2 right-2 bg-white p-2 rounded-full shadow"
              onClick={() => setPreviewImage(null)}
            >
              <X size={20} />
            </button>

          </div>
        </div>
      )}

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white w-[800px] max-h-[90vh] overflow-y-auto rounded-xl p-6">

            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editId ? "Edit Product" : "Create Product"}
              </h2>

              <button onClick={closeModal}>
                <X />
              </button>
            </div>

            {skuPreview && (
              <p className="mb-4 text-sm text-gray-500">
                SKU: <b>{skuPreview}</b>
              </p>
            )}

            <div className="grid grid-cols-2 gap-4">

              <input
                placeholder="Product name"
                value={form.product_name}
                onChange={(e) => handleName(e.target.value)}
                className="border px-4 py-2 rounded-lg"
              />

              <input
                placeholder="Slug"
                value={form.slug}
                onChange={(e) =>
                  setForm({ ...form, slug: e.target.value })
                }
                className="border px-4 py-2 rounded-lg"
              />

              <select
                value={form.category_id}
                onChange={(e) =>
                  setForm({ ...form, category_id: e.target.value })
                }
                className="border px-4 py-2 rounded-lg"
              >
                <option value="">Category</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.category_name}
                  </option>
                ))}
              </select>

              <input
                placeholder="Price"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: e.target.value })
                }
                className="border px-4 py-2 rounded-lg"
              />

              <input
                placeholder="Compare price"
                value={form.compare_price}
                onChange={(e) =>
                  setForm({ ...form, compare_price: e.target.value })
                }
                className="border px-4 py-2 rounded-lg"
              />

              <input
                placeholder="Stock"
                value={form.stock}
                onChange={(e) =>
                  setForm({ ...form, stock: e.target.value })
                }
                className="border px-4 py-2 rounded-lg"
              />

              <input
                placeholder="Short description"
                value={form.short_desc}
                onChange={(e) =>
                  setForm({ ...form, short_desc: e.target.value })
                }
                className="border px-4 py-2 rounded-lg col-span-2"
              />

              <textarea
                placeholder="Full description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="border px-4 py-2 rounded-lg col-span-2"
              />

              <input
                placeholder="Meta title"
                value={form.meta_title}
                onChange={(e) =>
                  setForm({ ...form, meta_title: e.target.value })
                }
                className="border px-4 py-2 rounded-lg col-span-2"
              />

              <input
                placeholder="Meta description"
                value={form.meta_desc}
                onChange={(e) =>
                  setForm({ ...form, meta_desc: e.target.value })
                }
                className="border px-4 py-2 rounded-lg col-span-2"
              />

              <label className="flex gap-2 items-center col-span-2">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      is_featured: e.target.checked,
                    })
                  }
                />
                Featured product
              </label>

              {/* IMAGE UPLOAD */}
              <div className="col-span-2">
                <label className="font-medium">Product Images</label>

                <input
                  type="file"
                  multiple
                  onChange={(e) => handleImageUpload(e.target.files)}
                  className="border px-4 py-2 rounded-lg w-full mt-2"
                />

                {uploading && (
                  <p className="text-sm text-gray-500">
                    Uploading...
                  </p>
                )}

                <div className="flex gap-3 mt-3 flex-wrap">
                  {images.map((img, i) => (
                    <div key={i} className="relative">
                      <img
                        src={img}
                        className="w-20 h-20 object-cover rounded-lg border"
                      />

                      <button
                        onClick={() =>
                          setImages(
                            images.filter(
                              (_, idx) => idx !== i
                            )
                          )
                        }
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                className="col-span-2 bg-blue-600 text-white py-2 rounded-lg"
              >
                {editId ? "Update Product" : "Create Product"}
              </button>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
