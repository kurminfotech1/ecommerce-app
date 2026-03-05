import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { Role } from "@/generated/prisma";

// ─── GET: Fetch all ADMIN users with their permissions ───────────────────────
export async function GET() {
  try {
    const user = await verifyToken();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admins = await prisma.admin.findMany({
      where: { role: { not: Role.SUPERADMIN } },
      orderBy: { createdAt: "desc" },
      include: { permissions: true },
    });

    return NextResponse.json({ admins }, { status: 200 });
  } catch (error) {
    console.error("Permission GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST: Upsert permissions for an admin (batch by adminId) ─────────────────
export async function POST(req: Request) {
  try {
    const user: any = await verifyToken();

    if (!user || user.role !== Role.SUPERADMIN) {
      return NextResponse.json(
        { error: "Forbidden. Only Superadmin can manage permissions." },
        { status: 403 }
      );
    }

    const body = await req.json();
    /**
     * Expected body:
     * {
     *   adminId: string;
     *   permissions: {
     *     module: string;
     *     canCreate: boolean;
     *     canRead: boolean;
     *     canUpdate: boolean;
     *     canDelete: boolean;
     *   }[]
     * }
     */
    const { adminId, permissions } = body;

    if (!adminId || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "adminId and permissions array are required" },
        { status: 400 }
      );
    }

    // Verify the target admin exists and is not SUPERADMIN
    const targetAdmin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!targetAdmin || targetAdmin.role === Role.SUPERADMIN) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Upsert each module permission
    const upsertOps = permissions.map((perm: {
      module: string;
      canCreate: boolean;
      canRead: boolean;
      canUpdate: boolean;
      canDelete: boolean;
    }) =>
      prisma.adminPermission.upsert({
        where: { adminId_module: { adminId, module: perm.module } },
        update: {
          canCreate: perm.canCreate,
          canRead: perm.canRead,
          canUpdate: perm.canUpdate,
          canDelete: perm.canDelete,
        },
        create: {
          adminId,
          module: perm.module,
          canCreate: perm.canCreate,
          canRead: perm.canRead,
          canUpdate: perm.canUpdate,
          canDelete: perm.canDelete,
        },
      })
    );

    await prisma.$transaction(upsertOps);

    // Return updated admin with permissions
    const updated = await prisma.admin.findUnique({
      where: { id: adminId },
      include: { permissions: true },
    });

    return NextResponse.json(
      { message: "Permissions saved successfully", admin: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Permission POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
