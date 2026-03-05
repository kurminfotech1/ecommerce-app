"use client";
import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { RootState } from "@/redux/rootReducer";
import { fetchAdminById } from "@/redux/auth/authApi";
import { decryptData } from "@/lib/crypto";
import Cookies from "js-cookie";
import { ShieldCheck } from "lucide-react";

const initials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

export default function UserMetaCard() {
  const userId = useMemo(() => {
    const raw = Cookies.get("userId");
    return raw ? decryptData(raw) : null;
  }, []);

  const dispatch = useDispatch<AppDispatch>();
  const adminData = useSelector((state: RootState) => state.auth.user);

  React.useEffect(() => {
    if (userId && !adminData) dispatch(fetchAdminById(userId));
  }, [dispatch, userId, adminData]);

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <div className="w-14 h-14 shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white font-bold text-xl shadow-md select-none">
          {adminData?.full_name ? initials(adminData.full_name) : "NA"}
        </div>
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {adminData?.full_name || "Administrator"}
          </h4>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-700">
              <ShieldCheck size={11} />
              {adminData?.role || "USER"}
            </span>
            {(adminData?.state || adminData?.country) && (
              <span className="text-xs text-gray-400">
                {[adminData.state, adminData.country].filter(Boolean).join(", ")}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
