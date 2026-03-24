"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Phone, Mail, MapPin, Loader2, Save } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";

type ContactInfo = {
  email: string;
  phone: string;
  address: string;
};

export default function ContactInfoPage() {
  const [info, setInfo] = useState<ContactInfo>({ email: "", phone: "", address: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasExistingInfo, setHasExistingInfo] = useState(false);

  const { canUpdate } = usePermission("Contact Info");

  const fetchInfo = useCallback(async () => {
    try {
      const res = await fetch("/api/contact-info");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load contact info");
      
      const payload = json.data || {};
      
      if (json.data && Object.keys(json.data).length > 0) {
        setHasExistingInfo(true);
      }
      
      setInfo({
        email: payload.email || "",
        phone: payload.phone || "",
        address: payload.address || "",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to load contact info");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdate) return;
    
    setSaving(true);
    try {
      const res = await fetch("/api/contact-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(info),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setHasExistingInfo(true);
      toast.success(data.message || "Contact info updated successfully");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-500/10">
            <Phone className="w-6 h-6 text-brand-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contact Info</h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 ml-14">
          Manage the contact details displayed on your store.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="flex items-center gap-2 block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Mail className="w-4 h-4 text-gray-400" /> Email Address
            </label>
            <input
              type="email"
              value={info.email}
              onChange={(e) => setInfo({ ...info, email: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
              placeholder="support@example.com"
              disabled={!canUpdate}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Phone className="w-4 h-4 text-gray-400" /> Phone Number
            </label>
            <input
              type="text"
              value={info.phone}
              onChange={(e) => setInfo({ ...info, phone: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
              placeholder="+1 (555) 123-4567"
              disabled={!canUpdate}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <MapPin className="w-4 h-4 text-gray-400" /> Office Address
            </label>
            <textarea
              value={info.address}
              onChange={(e) => setInfo({ ...info, address: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all resize-none"
              placeholder="123 Commerce St, City, Country"
              disabled={!canUpdate}
            />
          </div>

          {canUpdate && (
            <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : hasExistingInfo ? "Update Contact Info" : "Save Contact Info"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
