import { AdminPermission } from "@/types/auth";

/**
 * Maps URL pathname prefix → module display name.
 * These names MUST match exactly what is stored in the DB (AdminPermission.module).
 */
export const MODULE_MAP: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/categories": "Categories",
  "/products": "Products",
  "/orders": "Orders",
  "/users": "Users",
  "/reviews": "Reviews",
  "/returns": "Returns",
  "/blog": "Blog",
  "/logo": "manage logo",
  "/userPermission": "User Permission",
};

/**
 * Reverse lookup: module name → the URL path that route lives at.
 * Useful for the sidebar to know which path corresponds to a module name.
 */
export const MODULE_NAME_TO_PATH: Record<string, string> = Object.fromEntries(
  Object.entries(MODULE_MAP).map(([path, name]) => [name, path])
);

/**
 * Given a pathname, return the matching module name or null.
 */
export const getModuleName = (pathname: string): string | null => {
  for (const path in MODULE_MAP) {
    if (pathname.startsWith(path)) {
      return MODULE_MAP[path];
    }
  }
  return null;
};

/**
 * Check if an admin has read permission for a given module name.
 * SUPERADMINs always have full access — check role before calling this.
 */
export const hasReadPermission = (
  permissions: AdminPermission[] | undefined,
  moduleName: string
): boolean => {
  if (!permissions || permissions.length === 0) return false;
  const perm = permissions.find((p) => p.module === moduleName);
  return perm?.canRead ?? false;
};

/**
 * Check a specific action permission for a module.
 */
export const hasPermission = (
  permissions: AdminPermission[] | undefined,
  moduleName: string,
  action: keyof Pick<AdminPermission, "canRead" | "canCreate" | "canUpdate" | "canDelete">
): boolean => {
  if (!permissions || permissions.length === 0) return false;
  const perm = permissions.find((p) => p.module === moduleName);
  return perm?.[action] ?? false;
};
