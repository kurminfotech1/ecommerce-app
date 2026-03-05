"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/rootReducer";
import { AdminPermission } from "@/types/auth";

type Action = keyof Pick<AdminPermission, "canRead" | "canCreate" | "canUpdate" | "canDelete">;

interface UsePermissionReturn {
  /** true if the current user can perform this action on the module */
  can: (action: Action) => boolean;
  /** Shorthand booleans */
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  /** true if user is SUPERADMIN (always has all permissions) */
  isSuperAdmin: boolean;
}

/**
 * usePermission — returns action-level permission flags for a given module.
 *
 * Usage:
 *   const { canCreate, canUpdate, canDelete } = usePermission("Categories");
 *
 * Module names must match AdminPermission.module values in the DB:
 *   "Dashboard", "Categories", "Products", "Orders", "Users",
 *   "Reviews", "Returns", "Blog", "manage logo", "User Permission"
 */
export function usePermission(module: string): UsePermissionReturn {
  const { user } = useSelector((state: RootState) => state.auth);

  return useMemo(() => {
    const isSuperAdmin = user?.role === "SUPERADMIN";

    // SUPERADMINs always have full access
    if (isSuperAdmin) {
      return {
        can: () => true,
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        isSuperAdmin: true,
      };
    }

    // Find the permission record for this module
    const perm = user?.permissions?.find((p) => p.module === module);

    const canRead = perm?.canRead ?? false;
    const canCreate = perm?.canCreate ?? false;
    const canUpdate = perm?.canUpdate ?? false;
    const canDelete = perm?.canDelete ?? false;

    return {
      can: (action: Action) => {
        switch (action) {
          case "canRead":   return canRead;
          case "canCreate": return canCreate;
          case "canUpdate": return canUpdate;
          case "canDelete": return canDelete;
          default:          return false;
        }
      },
      canRead,
      canCreate,
      canUpdate,
      canDelete,
      isSuperAdmin: false,
    };
  }, [user, module]);
}
