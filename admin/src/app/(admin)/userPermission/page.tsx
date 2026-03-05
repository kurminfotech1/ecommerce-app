"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "@/lib/api/axios";
import { Admin, AdminPermission } from "@/types/auth";
import {
  Shield,
  ShieldCheck,
  User,
  Save,
  Loader2,
  Check,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "react-toastify";

/**
 * Module names MUST exactly match the strings stored in the DB (AdminPermission.module).
 * These also correspond to the `moduleName` field in AppSidebar's navItems.
 */
const MODULES = [
  "Dashboard",
  "Categories",
  "Products",
  "Orders",
  "Users",
  "Reviews",
  "Returns",
  "Blog",
  "manage logo",
  "User Permission",
];

const PermissionPage = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<
    Record<string, Partial<AdminPermission>>
  >({});

  // ── Fetch Admins with Permissions ──────────────────────────────────────────
  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/permission");
      setAdmins(res.data.admins || []);

      // If no admin selected yet, select the first one
      if (res.data.admins?.length > 0 && !selectedAdminId) {
        setSelectedAdminId(res.data.admins[0].id);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to fetch admins");
    } finally {
      setLoading(false);
    }
  }, [selectedAdminId]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // ── Initialize Local Permissions State when selected admin changes ──────────
  useEffect(() => {
    if (selectedAdminId) {
      const admin = admins.find((a) => a.id === selectedAdminId);
      if (admin) {
        const initialPerms: Record<string, Partial<AdminPermission>> = {};

        MODULES.forEach((module) => {
          const existing = admin.permissions?.find((p) => p.module === module);
          initialPerms[module] = {
            module,
            // canRead controls sidebar visibility — default false (no access)
            canRead: existing ? existing.canRead : false,
            canCreate: existing ? existing.canCreate : false,
            canUpdate: existing ? existing.canUpdate : false,
            canDelete: existing ? existing.canDelete : false,
          };
        });

        setPermissions(initialPerms);
      }
    }
  }, [selectedAdminId, admins]);

  // ── Handle Permission Toggle ───────────────────────────────────────────────
  const handleToggle = (module: string, action: keyof AdminPermission) => {
    setPermissions((prev) => {
      const current = prev[module] || {
        module,
        canRead: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
      };

      const newValue = !current[action as keyof typeof current];

      // If turning OFF sidebar access, also turn off all actions
      if (action === "canRead" && !newValue) {
        return {
          ...prev,
          [module]: {
            ...current,
            canRead: false,
            canCreate: false,
            canUpdate: false,
            canDelete: false,
          },
        };
      }

      return {
        ...prev,
        [module]: {
          ...current,
          [action]: newValue,
        },
      };
    });
  };

  // ── Grant / Revoke All for a module ───────────────────────────────────────
  const handleGrantAll = (module: string) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        module,
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      },
    }));
  };

  const handleRevokeAll = (module: string) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        module,
        canRead: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
      },
    }));
  };

  // ── Save Permissions ───────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedAdminId) return;

    try {
      setSaving(true);
      const payload = {
        adminId: selectedAdminId,
        permissions: Object.values(permissions),
      };

      await axios.post("/permission", payload);
      toast.success("Permissions saved successfully");

      // Refresh to get updated data
      fetchAdmins();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getSelectedAdmin = () => admins.find((a) => a.id === selectedAdminId);

  const getModuleStats = (module: string) => {
    const perm = permissions[module];
    if (!perm?.canRead) return { visible: false, actions: 0 };
    const actions = [perm.canCreate, perm.canUpdate, perm.canDelete].filter(
      Boolean
    ).length;
    return { visible: true, actions };
  };

  if (loading && admins.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/60 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="text-brand-500" /> Admin Permissions
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Control which sidebar sections each admin can see, and what actions they can perform.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Admin List Column */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Admins
            </h2>
            <div className="flex flex-col gap-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              {admins.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">
                  No admins found to manage permissions.
                </div>
              ) : (
                admins.map((admin) => {
                  const visibleCount =
                    admin.permissions?.filter((p) => p.canRead).length ?? 0;
                  return (
                    <button
                      key={admin.id}
                      onClick={() => setSelectedAdminId(admin.id)}
                      className={`flex items-center gap-3 px-4 py-3 text-left transition ${
                        selectedAdminId === admin.id
                          ? "bg-brand-50 text-brand-700 border-l-4 border-brand-500"
                          : "border-l-4 border-transparent hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                        <User size={20} />
                      </div>
                      <div className="truncate min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {admin.full_name || admin.email}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">
                          {visibleCount} module{visibleCount !== 1 ? "s" : ""}{" "}
                          accessible
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Permission Matrix Column */}
          <div className="lg:col-span-3">
            {selectedAdminId ? (
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col h-full">
                {/* Section Header */}
                <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <div className="bg-brand-500 p-2 rounded-lg text-white">
                      <Shield size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        Permissions for{" "}
                        <span className="text-brand-600 font-extrabold capitalize">
                          {getSelectedAdmin()?.full_name?.split(" ")[0] ||
                            getSelectedAdmin()?.email}
                        </span>
                      </h3>
                      <p className="text-xs text-gray-500">
                        Toggle sidebar visibility &amp; allowed actions per module
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-brand-700 disabled:opacity-50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {saving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    Save Changes
                  </button>
                </div>

                {/* Legend */}
                <div className="px-6 py-3 bg-blue-50/60 border-b border-blue-100 flex flex-wrap gap-4 text-xs text-blue-700">
                  <span className="flex items-center gap-1.5">
                    <Eye size={13} className="text-indigo-500" />
                    <strong>Sidebar Access</strong> — makes the module visible in the admin&apos;s sidebar
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Shield size={13} className="text-gray-400" />
                    <strong>Actions</strong> — what the admin can do inside that module
                  </span>
                </div>

                {/* Permission Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white">
                      <tr className="border-b border-gray-100 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                        <th className="px-6 py-4 min-w-[160px]">Module</th>
                        <th className="px-4 py-4 text-center whitespace-nowrap">
                          <span className="flex items-center justify-center gap-1">
                            <Eye size={12} /> Sidebar Access
                          </span>
                        </th>
                        <th className="px-4 py-4 text-center">Create</th>
                        <th className="px-4 py-4 text-center">Update</th>
                        <th className="px-4 py-4 text-center">Delete</th>
                        <th className="px-4 py-4 text-center">Quick</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {MODULES.map((module) => {
                        const stats = getModuleStats(module);
                        const perm = permissions[module];
                        const canSeeActions = !!perm?.canRead;

                        return (
                          <tr
                            key={module}
                            className={`group transition duration-150 ${
                              !canSeeActions
                                ? "bg-gray-50/30 opacity-70"
                                : "hover:bg-blue-50/20"
                            }`}
                          >
                            {/* Module Name */}
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-2">
                                {canSeeActions ? (
                                  <Eye
                                    size={14}
                                    className="text-indigo-400 flex-shrink-0"
                                  />
                                ) : (
                                  <EyeOff
                                    size={14}
                                    className="text-gray-300 flex-shrink-0"
                                  />
                                )}
                                <span
                                  className={`font-semibold text-sm capitalize ${
                                    canSeeActions
                                      ? "text-gray-800"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {module}
                                </span>
                              </div>
                              {canSeeActions && stats.actions > 0 && (
                                <p className="text-[10px] text-gray-400 mt-0.5 ml-5">
                                  {stats.actions} action
                                  {stats.actions !== 1 ? "s" : ""} allowed
                                </p>
                              )}
                            </td>

                            {/* Sidebar Access (canRead) */}
                            <td className="px-4 py-3.5 text-center">
                              <ToggleSwitch
                                checked={!!perm?.canRead}
                                onChange={() => handleToggle(module, "canRead" as any)}
                                label="Sidebar Access"
                                colorOn="indigo"
                              />
                            </td>

                            {/* Create */}
                            <td className="px-4 py-3.5 text-center">
                              <Checkbox
                                checked={!!perm?.canCreate}
                                onChange={() =>
                                  canSeeActions &&
                                  handleToggle(module, "canCreate" as any)
                                }
                                disabled={!canSeeActions}
                                label="Create"
                                accent="emerald"
                              />
                            </td>

                            {/* Update */}
                            <td className="px-4 py-3.5 text-center">
                              <Checkbox
                                checked={!!perm?.canUpdate}
                                onChange={() =>
                                  canSeeActions &&
                                  handleToggle(module, "canUpdate" as any)
                                }
                                disabled={!canSeeActions}
                                label="Update"
                                accent="amber"
                              />
                            </td>

                            {/* Delete */}
                            <td className="px-4 py-3.5 text-center">
                              <Checkbox
                                checked={!!perm?.canDelete}
                                onChange={() =>
                                  canSeeActions &&
                                  handleToggle(module, "canDelete" as any)
                                }
                                disabled={!canSeeActions}
                                label="Delete"
                                accent="rose"
                              />
                            </td>

                            {/* Quick grant/revoke */}
                            <td className="px-4 py-3.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleGrantAll(module)}
                                  title="Grant all permissions"
                                  className="rounded-md px-2 py-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition"
                                >
                                  All
                                </button>
                                <button
                                  onClick={() => handleRevokeAll(module)}
                                  title="Revoke all permissions"
                                  className="rounded-md px-2 py-1 text-[10px] font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 transition"
                                >
                                  None
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer save button */}
                <div className="border-t border-gray-100 px-6 py-4 flex justify-end bg-gray-50/30">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-brand-600 px-8 py-2.5 text-sm font-bold text-white shadow hover:bg-brand-700 disabled:opacity-50 transition-all duration-200"
                  >
                    {saving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    Save Permissions
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center text-gray-400">
                <Shield className="mb-4 h-12 w-12 opacity-20" />
                <p className="font-medium">Select an admin to configure their permissions.</p>
                <p className="text-sm mt-1 text-gray-300">
                  Choose from the list on the left.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Toggle Switch (for Sidebar Access) ────────────────────────────────────────
const ToggleSwitch = ({
  checked,
  onChange,
  label,
  colorOn,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  colorOn: string;
}) => {
  const onColors: Record<string, string> = {
    indigo: "bg-indigo-600",
    emerald: "bg-emerald-600",
  };

  return (
    <button
      onClick={onChange}
      title={`${label}: ${checked ? "On" : "Off"}`}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? onColors[colorOn] ?? "bg-brand-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
};

// ── Checkbox Component ────────────────────────────────────────────────────────
const Checkbox = ({
  checked,
  onChange,
  label,
  accent,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  accent: string;
  disabled?: boolean;
}) => {
  const activeAccent: Record<string, string> = {
    emerald: "bg-emerald-600 border-emerald-600",
    amber: "bg-amber-500 border-amber-500",
    rose: "bg-rose-600 border-rose-600",
    brand: "bg-brand-600 border-brand-600",
  };

  return (
    <div className="flex justify-center">
      <button
        onClick={onChange}
        disabled={disabled}
        className={`relative flex h-7 w-7 items-center justify-center rounded-md border-2 transition-all duration-150 ${
          disabled
            ? "border-gray-100 bg-gray-50 cursor-not-allowed"
            : checked
            ? activeAccent[accent]
            : "border-gray-200 bg-white hover:border-gray-400"
        } shadow-sm`}
        title={disabled ? "Enable Sidebar Access first" : `${checked ? "Disable" : "Enable"} ${label}`}
      >
        {checked && !disabled && (
          <Check className="h-3.5 w-3.5 text-white" />
        )}
      </button>
    </div>
  );
};

export default PermissionPage;