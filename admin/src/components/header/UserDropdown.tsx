"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { logout } from "@/redux/auth/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { AppDispatch } from "@/redux/store";
import { RootState } from "@/redux/rootReducer";
import { fetchAdminById } from "@/redux/auth/authApi";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
export default function UserDropdown() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const admins = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    const id = Cookies.get("userId");
    setUserId(id);
  }, []);

  useEffect(() => {
    if (userId) {
      dispatch(fetchAdminById(userId));
    }
  }, [dispatch, userId]);

  function toggleDropdown(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleLogout = () => {
    dispatch(logout());
     toast.success("Logged out successfully");
    router.push("/");
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center group focus:outline-none"
      >
        <span className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm shadow-sm group-hover:bg-blue-700 transition-colors">
          {admins?.full_name ? admins.full_name.charAt(0).toUpperCase() : "N"}
        </span>

        <span className="hidden sm:block mr-2 font-semibold text-gray-800 dark:text-white text-sm">
          {admins?.full_name || "Admin admin"}
        </span>

        <svg
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-3 w-[260px] flex-col rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-dark z-50 overflow-hidden"
      >
        {/* SECTION 1: USER INFO */}
        <div className="px-5 py-4 bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-gray-800">
          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
            {admins?.full_name || "Admin admin"}
          </p>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {admins?.email || "admin@gmail.com"}
          </p>
        </div>

        {/* SECTION 2: LINKS */}
        <div className="p-2">
          <DropdownItem
            onItemClick={closeDropdown}
            tag="a"
            href="/profile"
            className="flex items-center gap-3 px-3 py-2.5 font-semibold text-gray-700 dark:text-gray-300 rounded-xl group text-[14px] hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-white/5 transition-all"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
              <svg
                className="text-gray-500 group-hover:text-blue-600 transition-colors"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            Edit profile
          </DropdownItem>
        </div>

        {/* SECTION 3: ACTIONS */}
        <div className="p-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-transparent">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 font-semibold text-red-500 rounded-xl text-[14px] hover:bg-red-50 dark:hover:bg-red-900/10 transition-all text-left"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </div>
            Sign out
          </button>
        </div>
      </Dropdown>
    </div>
  );
}