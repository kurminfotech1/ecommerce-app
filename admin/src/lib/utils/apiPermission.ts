import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import { Role } from "@/generated/prisma";

type Action = "canRead" | "canCreate" | "canUpdate" | "canDelete";

interface PermissionCheckResult {
  /** null means permission granted, NextResponse means return this immediately */
  error: NextResponse | null;
  /** The resolved admin record (role + id) if check passed */
  admin: { id: string; role: Role } | null;
}

/**
 * checkApiPermission — call this at the top of any API route handler.
 *
 * 1. Verifies the JWT token (401 if missing/invalid).
 * 2. SUPERADMINs always pass — returns { error: null }.
 * 3. For ADMIN role: looks up the AdminPermission row for `module` and checks `action`.
 *    - 403 if the permission record doesn't exist or the flag is false.
 * 
 * Usage:
 *   const { error } = await checkApiPermission("Categories", "canCreate");
 *   if (error) return error;
 */
export async function checkApiPermission(
  module: string,
  action: Action
): Promise<PermissionCheckResult> {
  const user = await verifyToken();

  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      admin: null,
    };
  }

  // Fetch the admin record to check role
  const admin = await prisma.admin.findUnique({
    where: { id: user.id },
    select: { id: true, role: true },
  });

  if (!admin) {
    return {
      error: NextResponse.json({ error: "Admin not found" }, { status: 401 }),
      admin: null,
    };
  }

  // SUPERADMINs bypass all permission checks
  if (admin.role === Role.SUPERADMIN) {
    return { error: null, admin };
  }

  // Regular ADMIN — check module permission
  const perm = await prisma.adminPermission.findUnique({
    where: { adminId_module: { adminId: admin.id, module } },
  });

  if (!perm || !perm[action]) {
    const actionLabel = action.replace("can", "").toLowerCase();
    return {
      error: NextResponse.json(
        {
          error: `Forbidden: You don't have ${actionLabel} permission for ${module}.`,
          code: "PERMISSION_DENIED",
        },
        { status: 403 }
      ),
      admin: null,
    };
  }

  return { error: null, admin };
}
