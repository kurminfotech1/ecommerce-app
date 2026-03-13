"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Megaphone, Trash2, Edit, Plus, Loader2, Link as LinkIcon, CheckCircle2, XCircle } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";

type AnnouncementBar = {
  id: string;
  text: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export default function AnnouncementBarPage() {
  const [data, setData] = useState<AnnouncementBar[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementBar | null>(null);
  
  // Form state
  const [text, setText] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isGlobalEnabled, setIsGlobalEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Permission flags (Should match the module name in DB/Sidebar)
  const { canCreate, canUpdate, canDelete } = usePermission("Announcement Bar");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/announcement-bar");
      const json = await res.json();
      setData(json.data || []);
      setIsGlobalEnabled(json.settings?.is_enabled ?? true);
    } catch {
      toast.error("Failed to load announcement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (item?: AnnouncementBar) => {
    if (item) {
      setEditingItem(item);
      setText(item.text);
      setIsActive(item.is_active);
    } else {
      setEditingItem(null);
      setText("");
      setIsActive(true);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text) {
      toast.error("Announcement text is required");
      return;
    }

    setSubmitting(true);
    try {
      const method = editingItem ? "PUT" : "POST";
      const url = editingItem ? `/api/announcement-bar?id=${editingItem.id}` : "/api/announcement-bar";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, is_active: isActive }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Operation failed");

      toast.success(json.message);
      fetchData();
      handleCloseModal();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSettings = async () => {
    const newVal = !isGlobalEnabled;
    setSettingsLoading(true);
    try {
      const res = await fetch("/api/announcement-bar?type=settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_enabled: newVal }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update settings");
      
      setIsGlobalEnabled(newVal);
      toast.success(json.message);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    try {
      const res = await fetch(`/api/announcement-bar?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Delete failed");

      toast.success(json.message);
      fetchData();
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-500/10">
              <Megaphone className="w-6 h-6 text-brand-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Announcement Bar</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 ml-14">
            Manage the announcement bars displayed at the top of your store.
          </p>
        </div>
        {canCreate && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Section Status</span>
              <button
                onClick={handleToggleSettings}
                disabled={settingsLoading}
                className={`w-10 h-5 rounded-full transition-colors relative ${isGlobalEnabled ? "bg-green-600" : "bg-gray-300 dark:bg-gray-700"} ${settingsLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${isGlobalEnabled ? "translate-x-5" : "translate-x-0"}`} />
              </button>
              <span className={`text-xs font-bold ${isGlobalEnabled ? "text-green-600" : "text-gray-400"}`}>
                {isGlobalEnabled ? "ENABLED" : "DISABLED"}
              </span>
            </div>
            
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add New Bar
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr className="border-b border-gray-200 dark:border-gray-800 text-xs font-bold uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4">Announcement Text</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Updated At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No announcement found.
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white max-w-xs truncate" title={item.text}>
                        {item.text}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.is_active 
                          ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" 
                          : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                      }`}>
                        {item.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {item.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(item.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canUpdate && (
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingItem ? "Edit Announcement" : "Add Announcement"}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Text *
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. Get 20% off on your first order!"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm min-h-[100px]"
                  required
                />
              </div>

              <div className="flex items-center gap-3 py-2">
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${isActive ? "bg-brand-600" : "bg-gray-300 dark:bg-gray-700"}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isActive ? "translate-x-6" : "translate-x-0"}`} />
                </button>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Visible on site
                </span>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingItem ? "Update Bar" : "Create Bar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
