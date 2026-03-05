"use client";

import React, { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/rootReducer";
import { MODULE_MAP } from "@/lib/utils/permissions";
import { ShieldOff, ArrowLeft, Lock, Loader2 } from "lucide-react";
import Link from "next/link";
import Cookies from "js-cookie";

/**
 * Paths that are always accessible regardless of permissions.
 * The root "/" redirects to "/dashboard" via middleware.
 */
const ALWAYS_ALLOWED_PATHS = ["/", "/dashboard"];

/**
 * PermissionGuard — wraps all (admin) layout children.
 *
 * Behaviour:
 *  - User not loaded yet + cookie present → show spinner (auth in progress, don't block).
 *  - No user + no cookie → middleware handles redirect to login; guard is a no-op.
 *  - SUPERADMIN → always pass through.
 *  - ADMIN without canRead for the current module → show 403 page.
 *  - Path not in MODULE_MAP (not a permissioned route) → pass through.
 */
const PermissionGuard = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { user, loading } = useSelector((state: RootState) => state.auth);

  const hasCookie = useMemo(() => {
    if (typeof window === "undefined") return false;
    return !!Cookies.get("token");
  }, []);

  const { isDenied, isWaiting } = useMemo(() => {
    // Still fetching user from API (cookie exists but user not in Redux yet)
    if (!user && hasCookie && loading) {
      return { isDenied: false, isWaiting: true };
    }

    // No user, no cookie → not authenticated; middleware handles this
    if (!user) return { isDenied: false, isWaiting: false };

    // Superadmin always has full access
    if (user.role === "SUPERADMIN") return { isDenied: false, isWaiting: false };

    // Always-allowed paths
    if (ALWAYS_ALLOWED_PATHS.some((p) => pathname === p)) {
      return { isDenied: false, isWaiting: false };
    }

    // Find the matching module for this pathname
    let matchedModule: string | null = null;
    for (const path in MODULE_MAP) {
      if (path !== "/" && pathname.startsWith(path)) {
        matchedModule = MODULE_MAP[path];
        break;
      }
    }

    // Path not in the permission map → not a restricted route
    if (!matchedModule) return { isDenied: false, isWaiting: false };

    // Check canRead permission for this module
    const perm = user.permissions?.find((p) => p.module === matchedModule);
    const hasAccess = perm?.canRead ?? false;

    return { isDenied: !hasAccess, isWaiting: false };
  }, [pathname, user, hasCookie, loading]);

  // Still waiting for user to load — show subtle spinner to avoid flash of 403
  if (isWaiting) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (isDenied) {
    return <UnauthorizedPage />;
  }

  return <>{children}</>;
};

// ── 403 Unauthorized Page ────────────────────────────────────────────────────
const UnauthorizedPage = () => {
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-6">
      <div className="w-full max-w-lg text-center">
        {/* Animated lock icon */}
        <div className="relative mx-auto mb-8 flex h-32 w-32 items-center justify-center">
          {/* Outer pulse */}
          <span className="absolute inset-0 animate-ping rounded-full bg-rose-100 opacity-50" style={{ animationDuration: "2s" }} />
          {/* Middle ring */}
          <span className="absolute inset-3 rounded-full bg-rose-50 border border-rose-100" />
          {/* Icon */}
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-700 shadow-2xl shadow-rose-300/50">
            <Lock className="h-9 w-9 text-white" strokeWidth={1.5} />
          </div>
        </div>

        {/* Badge label */}
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-rose-600">
          <ShieldOff size={11} /> Access Restricted
        </div>

        {/* Headline */}
        <h1 className="mb-3 text-5xl font-black text-gray-900 tracking-tight">
          403
        </h1>
        <h2 className="mb-3 text-xl font-bold text-gray-700">
          You don&apos;t have permission
        </h2>

        {/* Sub-message */}
        <p className="mb-2 text-sm text-gray-500 leading-relaxed">
          Your account doesn&apos;t have access to this page.
          <br />
          Please contact your superadmin to request access.
        </p>

        {/* Decorative divider */}
        <div className="relative my-8 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-200" />
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-50">
            <ShieldOff className="h-3.5 w-3.5 text-gray-300" />
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-200" />
        </div>

        {/* Action button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-brand-200 transition-all duration-200 hover:shadow-xl hover:scale-[1.03] active:scale-[0.98]"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        {/* Explainer card */}
        <div className="mt-10 rounded-2xl border border-amber-100 bg-amber-50/80 px-5 py-4 text-left">
          <p className="flex items-start gap-2 text-xs text-amber-700 leading-relaxed">
            <span className="mt-0.5 flex-shrink-0">💡</span>
            <span>
              <span className="font-semibold">Why am I seeing this?</span>{" "}
              Your admin account does not have &quot;Sidebar Access&quot; enabled for
              this module. A superadmin can grant it from{" "}
              <span className="font-semibold">Master → User Permission</span>.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PermissionGuard;
