"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Megaphone, Trash2, Edit, Plus, Loader2, Link as LinkIcon, CheckCircle2, XCircle, Pencil } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { DeleteModal } from "@/components/common/DeleteModal";

type AnnouncementBar = {
  id: string;
  text: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export default function AnnouncementBarPage() {
  const [data, setData] = useState<AnnouncementBar[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementBar | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AnnouncementBar | null>(null);
  
  // Form state
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<number | string>(1);
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
      setPriority(item.priority);
      setIsActive(item.is_active);
    } else {
      setEditingItem(null);
      setText("");
      setPriority(1);
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
        body: JSON.stringify({ text, priority: Number(priority), is_active: isActive }),
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

  const handleDelete = async (item: AnnouncementBar) => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/announcement-bar?id=${item.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Delete failed");

      toast.success(json.message);
      fetchData();
      setConfirmDelete(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
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
          <p className="text-gray-500 dark:text-gray-400 md:ml-14 text-sm sm:text-base">
            Manage the announcement bars displayed at the top of your store.
          </p>
        </div>
        {canCreate && (
          <div className="flex items-center flex-wrap gap-3">
            <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">Section Status</span>
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
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add New Bar</span>
              <span className="sm:hidden">Add New</span>
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-visible shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr className="border-b border-gray-200 dark:border-gray-800 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500">
                <th className="px-4 sm:px-6 py-4">Announcement Text</th>
                <th className="px-4 sm:px-6 py-4 text-center hidden md:table-cell">Priority</th>
                <th className="px-4 sm:px-6 py-4 text-center">Status</th>
                <th className="px-4 sm:px-6 py-4 hidden lg:table-cell">Updated At</th>
                <th className="px-4 sm:px-6 py-4 text-right">Actions</th>
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
                    <td className="px-4 sm:px-6 py-4">
                      <div className="relative group/tooltip inline-block max-w-[150px] sm:max-w-xs">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate cursor-default">
                          {item.text}
                        </p>
                        {/* Tooltip */}
                        <div className="pointer-events-none absolute bottom-full left-0 mb-2 z-50 hidden group-hover/tooltip:block">
                          <div className="bg-gray-900 dark:bg-gray-700 text-white text-[11px] font-medium rounded-lg px-3 py-1.5 shadow-lg w-max max-w-[350px] break-words text-left">
                            {item.text}
                            {/* Arrow */}
                            <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-center hidden md:table-cell">
                      <div className="relative group/tooltip inline-block">
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded cursor-help">
                          {item.priority}
                        </span>
                        {/* Tooltip */}
                        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 hidden group-hover/tooltip:block">
                          <div className="bg-gray-900 dark:bg-gray-700 text-white text-[10px] font-medium rounded-lg px-3 py-1.5 shadow-lg w-max whitespace-nowrap">
                            Higher priority appears first
                            {/* Arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 rounded-full text-[10px] sm:text-xs font-medium ${
                        item.is_active 
                          ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" 
                          : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                      }`}>
                        {item.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span className="hidden sm:inline">{item.is_active ? "Active" : "Inactive"}</span>
                        <span className="sm:hidden">{item.is_active ? "On" : "Off"}</span>
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-xs text-gray-500 hidden lg:table-cell">
                      {new Date(item.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canUpdate && (
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="c-icon-btn-edit"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setConfirmDelete(item)}
                            className="c-icon-btn-del"
                            title="Delete"
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority (higher appears first)
                </label>
                <input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  placeholder="1"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                  min="0"
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
      {confirmDelete && (
        <DeleteModal
          open={!!confirmDelete}
          parentTitle="Delete announcement?"
          childTitle="This announcement will be permanently removed from your store."
          onConfirm={() => handleDelete(confirmDelete)}
          onClose={() => setConfirmDelete(null)}
          loading={submitting}
        />
      )}
    </div>
  );
}
