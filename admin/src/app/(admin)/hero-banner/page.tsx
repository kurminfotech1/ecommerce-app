"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { LayoutTemplate, Plus, Edit2, Trash2, Loader2, Save, Image as ImageIcon, X } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";

type Banner = {
  id: string;
  badge_text: string | null;
  title: string;
  description: string | null;
  cta_text: string | null;
  cta_link: string | null;
  background_image: string | null;
  is_active: boolean;
  sort_order: number;
};

export default function HeroBannerPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    badge_text: "",
    title: "",
    description: "",
    cta_text: "",
    cta_link: "",
    background_image: "",
    is_active: true,
    sort_order: 0,
  });
  
  const [uploadingImage, setUploadingImage] = useState(false);

  const { canCreate, canRead, canUpdate, canDelete } = usePermission("Hero Banner");

  const fetchBanners = useCallback(async () => {
    try {
      const res = await fetch("/api/hero-banner");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load hero banners");
      setBanners(Array.isArray(data) ? data : (data.data || []));
    } catch (err: any) {
      toast.error(err.message || "Failed to load hero banners");
      setBanners([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canRead) {
      fetchBanners();
    } else {
      setLoading(false);
    }
  }, [fetchBanners, canRead]);

  const handleOpenModal = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        badge_text: banner.badge_text || "",
        title: banner.title || "",
        description: banner.description || "",
        cta_text: banner.cta_text || "",
        cta_link: banner.cta_link || "",
        background_image: banner.background_image || "",
        is_active: banner.is_active,
        sort_order: banner.sort_order,
      });
    } else {
      setEditingBanner(null);
      setFormData({
        badge_text: "",
        title: "",
        description: "",
        cta_text: "",
        cta_link: "",
        background_image: "",
        is_active: true,
        sort_order: banners.length,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload image");
      
      setFormData((prev) => ({ ...prev, background_image: data.url }));
      toast.success("Image uploaded successfully");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
        toast.error("Title is required");
        return;
    }
    setSaving(true);
    
    try {
      const url = editingBanner ? `/api/hero-banner?id=${editingBanner.id}` : "/api/hero-banner";
      const method = editingBanner ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save banner");
      
      toast.success(data.message || "Banner saved successfully");
      fetchBanners();
      handleCloseModal();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    
    try {
      const res = await fetch(`/api/hero-banner?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete banner");
      
      toast.success(data.message || "Banner deleted");
      fetchBanners();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!canRead) {
    return <div className="p-8 text-center text-gray-500">You do not have permission to view this page.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-500/10">
              <LayoutTemplate className="w-6 h-6 text-brand-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hero Banners</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 ml-14">
            Manage the hero banners displayed on your storefront homepage.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" /> Add Banner
          </button>
        )}
      </div>

      {banners.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
          <LayoutTemplate className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No banners found. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <div key={banner.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm flex flex-col">
              <div className="h-40 bg-gray-100 dark:bg-gray-800 relative">
                {banner.background_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={banner.background_image} alt={banner.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImageIcon className="w-8 h-8 opacity-50" />
                  </div>
                )}
                {!banner.is_active && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">Inactive</div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="mb-2 flex flex-col items-start">
                  {banner.badge_text && (
                    <span className="text-[10px] font-bold text-brand-600 bg-brand-50 dark:bg-brand-500/10 dark:text-brand-400 px-2 py-0.5 rounded uppercase tracking-wider mb-1.5 block w-max">
                      {banner.badge_text}
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{banner.title}</h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 flex-1">
                  {banner.description || <span className="italic text-gray-300">No description</span>}
                </p>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Sort: {banner.sort_order}</span>
                  <div className="flex items-center gap-2">
                    {canUpdate && (
                      <button onClick={() => handleOpenModal(banner)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => handleDelete(banner.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden my-8 mt-24">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingBanner ? "Edit Banner" : "Create Banner"}
              </h2>
              <button type="button" onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="E.g. Summer Sale"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={formData.badge_text}
                    onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="E.g. NEW ARRIVAL"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                  placeholder="Banner sub-heading or description text..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CTA Text</label>
                  <input
                    type="text"
                    value={formData.cta_text}
                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="E.g. Shop Now"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CTA Link</label>
                  <input
                    type="text"
                    value={formData.cta_link}
                    onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="E.g. /category/summer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Background Image</label>
                <div className="flex gap-3 items-center">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.background_image}
                      onChange={(e) => setFormData({ ...formData, background_image: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed"
                      placeholder="Image URL..."
                      readOnly
                    />
                  </div>
                  <div>
                    <input
                      type="file"
                      id="banner-image"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <label
                      htmlFor="banner-image"
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium cursor-pointer transition-colors"
                    >
                      {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                      {uploadingImage ? "Uploading..." : "Upload Image"}
                    </label>
                  </div>
                </div>
                {formData.background_image && (
                  <div className="mt-3 relative h-32 w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={formData.background_image} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
                <div className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 rounded focus:ring-brand-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    Is Active?
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving..." : "Save Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
