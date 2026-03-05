import { Role } from "@/generated/prisma";

export interface AdminPermission {
  id: string;
  adminId: string;
  module: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface Admin {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  phone: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  postal_code: string | null;
  createdAt: string;
  permissions?: AdminPermission[];
}
