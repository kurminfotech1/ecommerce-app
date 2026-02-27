"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { ImageIcon, Trash2, Upload, CheckCircle2, Loader2 } from "lucide-react";

type LogoData = {
  id: string;
  light_url: string | null;
  favicon_url: string | null;
  updated_at: string;
};

type UploadSlot = "light" | "favicon";

type SlotConfig = {
  key: UploadSlot;
  label: string;
  hint: string;
  bg: string;
};

const SLOTS: SlotConfig[] = [
  { key: "light",   label: "Site Logo",  hint: "Shown in header/sidebar and footer", bg: "bg-gray-50" },
  { key: "favicon", label: "Favicon",    hint: "16×16 or 32×32 px .ico / .png",      bg: "bg-gray-50" },
];

export default function ManageLogoPage() {
  const [logo, setLogo] = useState<LogoData | null>(null);
  const [previews, setPreviews] = useState<Record<UploadSlot, string | null>>({ light: null, favicon: null });
  const [files, setFiles]       = useState<Record<UploadSlot, File | null>>({ light: null, favicon: null });
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState<UploadSlot | null>(null);
  const [loading, setLoading]   = useState(true);
  const refs = { light: useRef<HTMLInputElement>(null), favicon: useRef<HTMLInputElement>(null) };

  // ── fetch current logos ──────────────────────────────────────────
  const fetchLogo = useCallback(async () => {
    try {
      const res = await fetch("/api/logo");
      const json = await res.json();
      setLogo(json.data);
    } catch {
      toast.error("Failed to load current logo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogo(); }, [fetchLogo]);

  // ── file pick ────────────────────────────────────────────────────
  const handleFilePick = (slot: UploadSlot, file: File) => {
    const url = URL.createObjectURL(file);
    setPreviews(p => ({ ...p, [slot]: url }));
    setFiles(f => ({ ...f, [slot]: file }));
  };

  const handleDrop = (slot: UploadSlot, e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFilePick(slot, file);
  };

  // ── save ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    const hasAny = Object.values(files).some(Boolean);
    if (!hasAny) { toast.info("Pick at least one image to upload"); return; }

    setSaving(true);
    try {
      const form = new FormData();
      (Object.keys(files) as UploadSlot[]).forEach(k => { if (files[k]) form.append(k, files[k]!); });

      const res = await fetch("/api/logo", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");

      setLogo(json.data);
      setFiles({ light: null, favicon: null });
      setPreviews({ light: null, favicon: null });
      window.dispatchEvent(new CustomEvent("logo-updated"));
      toast.success(json.message || "Logo uploaded or changed successfully");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── delete ───────────────────────────────────────────────────────
  const handleDelete = async (slot: UploadSlot) => {
    setDeleting(slot);
    try {
      const res = await fetch(`/api/logo?field=${slot}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Delete failed");
      setLogo(json.data);
      window.dispatchEvent(new CustomEvent("logo-updated"));
      toast.success(json.message || `${slot} logo removed`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const currentUrl = (slot: UploadSlot): string | null => {
    if (slot === "light")   return logo?.light_url   ?? null;
    if (slot === "favicon") return logo?.favicon_url ?? null;
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-500/10">
            <ImageIcon className="w-6 h-6 text-brand-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Site Logo</h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 ml-14">
          Upload your site logo and favicon. These are used across the admin panel and user-facing store.
        </p>
        {logo?.updated_at && (
          <p className="text-xs text-gray-400 mt-1 ml-14">
            Last updated: {new Date(logo.updated_at).toLocaleString()}
          </p>
        )}
      </div>

      {/* ── Upload Slots ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {SLOTS.map(({ key, label, hint, bg }) => {
          const preview   = previews[key];
          const saved     = currentUrl(key);
          const displayed = preview ?? saved;
          return (
            <div key={key} className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              {/* preview area */}
              <div
                className={`relative flex items-center justify-center h-40 cursor-pointer group transition-all ${bg}`}
                onClick={() => refs[key].current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(key, e)}
              >
                {displayed ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={displayed} alt={label} className="max-h-28 max-w-[80%] object-contain" />
                    {preview && (
                      <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> New
                      </span>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-gray-600 transition-colors">
                    <Upload className="w-8 h-8" />
                    <span className="text-sm font-medium">Drop or click to upload</span>
                  </div>
                )}
              </div>

              {/* info & actions */}
              <div className="p-4 bg-white dark:bg-gray-900">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{label}</p>
                <p className="text-xs text-gray-400 mb-3">{hint}</p>

                <div className="flex gap-2">
                  <button
                    onClick={() => refs[key].current?.click()}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-lg border border-brand-300 text-brand-600 hover:bg-brand-50 dark:border-brand-600 dark:text-brand-400 dark:hover:bg-brand-500/10 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {displayed ? "Replace" : "Upload"}
                  </button>
                  {saved && (
                    <button
                      onClick={() => handleDelete(key)}
                      disabled={deleting === key}
                      className="flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                      {deleting === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Remove
                    </button>
                  )}
                </div>

                {/* hidden input */}
                <input
                  ref={refs[key]}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFilePick(key, f); e.target.value = ""; }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Save button ─────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !Object.values(files).some(Boolean)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* ── Live Preview ─────────────────────────────────────────────── */}
      <div className="mt-10 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Live Preview</p>
          <p className="text-xs text-gray-400">How the logo and favicon appear on your site</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 bg-white dark:bg-gray-900">
          {/* Site Logo Preview */}
          <div className="p-6 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Sidebar / Header</p>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 flex items-center justify-center min-h-[120px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={logo?.light_url ?? "/images/logo/e-comm-logo.png"} 
                alt="sidebar logo" 
                className="max-h-12 object-contain" 
              />
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">Full logo used in main navigation</p>
          </div>

          {/* Favicon Preview */}
          <div className="p-6">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Collapsed Sidebar / Browser Tab</p>
            <div className="flex flex-col gap-6">
              {/* Sidebar Icon */}
              <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <div className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img 
                    src={logo?.favicon_url ?? logo?.light_url ?? "/icon.png"} 
                    alt="favicon preview" 
                    className="w-8 h-8 object-contain" 
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Sidebar Icon</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Appears when sidebar is collapsed</p>
                </div>
              </div>

              {/* Browser Tab Mock */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 bg-white dark:bg-gray-700 rounded-t-lg border border-gray-200 dark:border-gray-600 border-b-0 px-3 py-2 w-48 shadow-sm">
                  <div className="w-4 h-4 rounded-sm flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={logo?.favicon_url ?? "/icon.png"} 
                      alt="browser favicon" 
                      className="w-3.5 h-3.5 object-contain" 
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate font-medium">Site Admin Panel</span>
                  <div className="ml-auto flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-gray-500"></div>
                  </div>
                </div>
                <div className="h-4 bg-white dark:bg-gray-700 rounded-b-lg border border-gray-200 dark:border-gray-600 shadow-sm opacity-50"></div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-3">Browser Tab</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}