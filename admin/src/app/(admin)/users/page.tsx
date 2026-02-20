"use client";

import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { RootState } from "@/redux/rootReducer";

import {
  fetchUsers,
  register,
  updateAdmin,
  deleteAdmin,
} from "@/redux/auth/authApi";
import { Admin } from "@/types/auth";
import {
  Search, Plus, Pencil, X, Loader2,
  Trash2
} from "lucide-react";
import { DeleteModal } from "@/components/common/DeleteModal";
import { useFormik } from "formik";
import * as Yup from "yup";


const Badge = ({ children, color = "gray" }: { children: React.ReactNode; color?: string }) => {
  const colors: Record<string, string> = {
    dark: "bg-[#1D4ED8] text-white border-[#1D4ED8]",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colors[color] || colors.dark}`}>
      {children}
    </span>
  );
};
;

const Field = ({ label, children, span = 1 }: { label: string; children: React.ReactNode; span?: number }) => (
  <div className={span === 2 ? "col-span-2" : ""}>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
    {children}
  </div>
);


const Skeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 animate-pulse">
        <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
    ))}
  </div>
);

export default function UsersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { admins, loading } = useSelector((s: RootState) => s.auth);

  // ── List state ─────────────────────────────────────────────────
  const [search, setSearch] = useState("");

  // ── Modal state ────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteUser, setDeleteUser] = useState<Admin | null>(null);

  // ── Formik Validation Schema ──────────────────────────────────────
  const validationSchema = Yup.object().shape({
    first_name: Yup.string().required("First name is required"),
    last_name: Yup.string().required("Last name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    phone: Yup.string()
      .matches(/^[0-9]+$/, "Must be only digits")
      .max(10, "Phone number cannot exceed 10 digits")
      .required("Phone number is required"),
    password: Yup.string().when("isEdit", (isEdit, schema) => {
      // In Edit Mode, password is not strictly required.
      // In Formik.when array of values is passed in newer versions, but we'll use a standard approach
      return editId ? schema.optional() : schema.required("Password is required");
    }),
    country: Yup.string(),
    state: Yup.string(),
    city: Yup.string(),
    postal_code: Yup.string(),
  });

  const formik = useFormik({
    initialValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      password: "",
      country: "",
      state: "",
      city: "",
      postal_code: "",
    },
    validationSchema: Yup.object().shape({
      first_name: Yup.string().required("First name is required"),
      last_name: Yup.string().required("Last name is required"),
      email: Yup.string().email("Invalid email").required("Email is required"),
      phone: Yup.string()
        .matches(/^[0-9]+$/, "Must be only digits")
        .max(10, "Must be exactly 10 digits")
        .required("Phone number is required"),
      password: editId ? Yup.string() : Yup.string().required("Password is required"),
      country: Yup.string(),
      state: Yup.string(),
      city: Yup.string(),
      postal_code: Yup.string(),
    }),
    enableReinitialize: true,
    onSubmit: async (values) => {
      const payload: Partial<Admin> & { password?: string } = {
        full_name: `${values.first_name || ""} ${values.last_name || ""}`.trim(),
        email: values.email,
        phone: values.phone,
        country: values.country,
        state: values.state,
        city: values.city,
        postal_code: values.postal_code,
        role: "ADMIN",
      };

      if (values.password) {
        payload.password = values.password;
      }

      let result: any;
      if (editId) {
        result = await dispatch(updateAdmin({ id: editId, data: payload }));
      } else {
        result = await dispatch(register(payload));
      }

      if (updateAdmin.fulfilled.match(result) || register.fulfilled.match(result)) {
        closeModal();
        fetchAllUsers();
      }
    },
  });

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchAllUsers = useCallback(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => { fetchAllUsers(); }, [fetchAllUsers]);

  // ── Helpers ────────────────────────────────────────────────────
  const openCreate = () => {
    formik.resetForm();
    setEditId(null);
    setModalOpen(true);
  };

  const openEdit = (user: Admin) => {
    setEditId(user.id);
    const names = (user.full_name || "").split(" ");
    const first_name = names[0] || "";
    const last_name = names.slice(1).join(" ") || "";
    
    formik.setValues({
      first_name,
      last_name,
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      country: user.country || "",
      state: user.state || "",
      city: user.city || "",
      postal_code: user.postal_code || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditId(null);
    formik.resetForm();
  };

  const onDelete = (user: Admin) => {
    setDeleteUser(user);
  };


  // ── Filtering ──────────────────────────────────────────────────
  const filteredUsers = admins.filter((u: Admin) => 
    (u.email && u.email.toLowerCase().includes(search.toLowerCase())) || 
    (u.full_name && u.full_name.toLowerCase().includes(search.toLowerCase()))
  );
  const totalUsers = admins.length;

  // ────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────
  return (
    <>
    <div className="min-h-screen bg-gray-50/60 flex flex-col">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 w-full flex-1">
        
        {/* ── Header ── */}
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">
           {totalUsers} users total   
            </p>
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search users..."
                defaultValue={search}
                onChange={(e) => { setSearch(e.target.value) }}
                style={{
                width: "100%",
                paddingLeft: 32,
                paddingRight: 12,
                paddingTop: 8,
                paddingBottom: 8,
                fontSize: ".82rem",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                outline: "none",
                background: "#fff",
                transition: "border-color .2s",
              }}
              onFocus={e => (e.target.style.borderColor = "#818cf8")}
              onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>

            {/* Add button */}
            <button
              onClick={openCreate}
              className="c-btn-add"
            >
              <Plus size={16} /> Add User
            </button>
          </div>
        </div>

        {/* ── Table ── */}
        {loading && admins.length === 0 ? (
          <Skeleton />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Phone</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Location</th>
                    <th className="px-4 py-3 text-left">Joined</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-400">
                        No users found.
                      </td>
                    </tr>
                  ) : null}
                  {filteredUsers.map((u: Admin) => (
                    <tr key={u.id} className="hover:bg-violet-50/30 transition group">
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {u.full_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3 text-gray-600">{u.phone || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge color="purple">
                          {u.role}
                        </Badge>
                      </td>
 <td className="px-4 py-3 text-gray-600">
  {[u.country, u.state, u.city]
    .filter(Boolean)
    .join(", ")}
  {u.postal_code && ` - ${u.postal_code}`}
</td>

                      <td className="px-4 py-3 text-gray-600">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 ">
                          <button
                            onClick={() => openEdit(u)}
                            title="Edit"
                           className="ib ib-blue"
                          >
                            <Pencil size={15} />
                          </button>
                         <button className="ib ib-red" title="Delete" onClick={() => onDelete(u)}>
                    <Trash2 size={13} />
                  </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editId ? "Edit User" : "Add New User"}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {editId ? "Update user information" : "Fill in details to register a new admin"}
                </p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-gray-100 transition">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name">
                  <input
                    name="first_name"
                    placeholder="Test"
                    value={formik.values.first_name}
                    onChange={formik.handleChange}
                    style={{
                      width: "100%", paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: ".82rem",
                      border: "1px solid #e5e7eb", borderRadius: 10, outline: "none", background: "#fff", transition: "border-color .2s",
                      borderColor: formik.touched.first_name && formik.errors.first_name ? "red" : "#e5e7eb"
                    }}
                    onFocus={e => (e.target.style.borderColor = "#818cf8")}
                    onBlur={formik.handleBlur}
                  />
                  {formik.touched.first_name && formik.errors.first_name ? (
                    <div className="text-red-500 text-xs mt-1">{formik.errors.first_name as string}</div>
                  ) : null}
                </Field>
                <Field label="Last Name">
                  <input
                    name="last_name"
                    placeholder="Test"
                    value={formik.values.last_name}
                    onChange={formik.handleChange}
                    style={{
                      width: "100%", paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: ".82rem",
                      border: "1px solid #e5e7eb", borderRadius: 10, outline: "none", background: "#fff", transition: "border-color .2s",
                      borderColor: formik.touched.last_name && formik.errors.last_name ? "red" : "#e5e7eb"
                    }}
                    onFocus={e => (e.target.style.borderColor = "#818cf8")}
                    onBlur={formik.handleBlur}
                  />
                  {formik.touched.last_name && formik.errors.last_name ? (
                    <div className="text-red-500 text-xs mt-1">{formik.errors.last_name as string}</div>
                  ) : null}
                </Field>

                <Field label="Email *">
                  <input
                    name="email"
                    type="email"
                    placeholder="test@example.com"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    disabled={!!editId}
                    style={{
                      width: "100%", paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: ".82rem",
                      border: "1px solid #e5e7eb", borderRadius: 10, outline: "none", background: "#fff", transition: "border-color .2s",
                      opacity: editId ? 0.5 : 1, cursor: editId ? "not-allowed" : "text",
                      borderColor: formik.touched.email && formik.errors.email ? "red" : "#e5e7eb"
                    }}
                    onFocus={e => !editId && (e.target.style.borderColor = "#818cf8")}
                    onBlur={formik.handleBlur}
                  />
                  {formik.touched.email && formik.errors.email ? (
                    <div className="text-red-500 text-xs mt-1">{formik.errors.email as string}</div>
                  ) : null}
                </Field>

                <Field label="Phone">
                  <input
                    name="phone"
                    placeholder="9999999999"
                    value={formik.values.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 10) {
                        formik.setFieldValue("phone", value);
                      }
                    }}
                    style={{
                      width: "100%", paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: ".82rem",
                      border: "1px solid #e5e7eb", borderRadius: 10, outline: "none", background: "#fff", transition: "border-color .2s",
                      borderColor: formik.touched.phone && formik.errors.phone ? "red" : "#e5e7eb"
                    }}
                    onFocus={e => (e.target.style.borderColor = "#818cf8")}
                    onBlur={formik.handleBlur}
                  />
                  {formik.touched.phone && formik.errors.phone ? (
                    <div className="text-red-500 text-xs mt-1">{formik.errors.phone as string}</div>
                  ) : null}
                </Field>

                {!editId && (
                  <Field label="Password *" span={2}>
                    <input
                      name="password"
                      type="password"
                      placeholder="Enter a secure password"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      style={{
                        width: "100%", paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: ".82rem",
                        border: "1px solid #e5e7eb", borderRadius: 10, outline: "none", background: "#fff", transition: "border-color .2s",
                        borderColor: formik.touched.password && formik.errors.password ? "red" : "#e5e7eb"
                      }}
                      onFocus={e => (e.target.style.borderColor = "#818cf8")}
                      onBlur={formik.handleBlur}
                    />
                    {formik.touched.password && formik.errors.password ? (
                      <div className="text-red-500 text-xs mt-1">{formik.errors.password as string}</div>
                    ) : null}
                  </Field>
                )}

                <Field label="Country">
                  <input
                    name="country"
                    placeholder="Country"
                    value={formik.values.country}
                    onChange={formik.handleChange}
                    style={{
                      width: "100%", paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: ".82rem",
                      border: "1px solid #e5e7eb", borderRadius: 10, outline: "none", background: "#fff", transition: "border-color .2s",
                    }}
                    onFocus={e => (e.target.style.borderColor = "#818cf8")}
                    onBlur={formik.handleBlur}
                  />
                </Field>

                <Field label="State">
                  <input
                    name="state"
                    placeholder="State"
                    value={formik.values.state}
                    onChange={formik.handleChange}
                    style={{
                      width: "100%", paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: ".82rem",
                      border: "1px solid #e5e7eb", borderRadius: 10, outline: "none", background: "#fff", transition: "border-color .2s",
                    }}
                    onFocus={e => (e.target.style.borderColor = "#818cf8")}
                    onBlur={formik.handleBlur}
                  />
                </Field>

                <Field label="City" >
                  <input
                    name="city"
                    placeholder="City"
                    value={formik.values.city}
                    onChange={formik.handleChange}
                    style={{
                      width: "100%", paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: ".82rem",
                      border: "1px solid #e5e7eb", borderRadius: 10, outline: "none", background: "#fff", transition: "border-color .2s",
                    }}
                    onFocus={e => (e.target.style.borderColor = "#818cf8")}
                    onBlur={formik.handleBlur}
                  />
                </Field>

                <Field label="Postal Code">
                  <input
                    name="postal_code"
                    placeholder="Postal Code"
                    value={formik.values.postal_code}
                    onChange={formik.handleChange}
                    style={{
                      width: "100%", paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: ".82rem",
                      border: "1px solid #e5e7eb", borderRadius: 10, outline: "none", background: "#fff", transition: "border-color .2s",
                    }}
                    onFocus={e => (e.target.style.borderColor = "#818cf8")}
                    onBlur={formik.handleBlur}
                  />
                </Field>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl sticky bottom-0 justify-end">
               <button
                type="button"
                onClick={() => formik.handleSubmit()}
                className="c-btn-add"
              >
               {loading ? (
                   editId ? (
                     <>
                       <Loader2 size={16} className="animate-spin mr-2" />
                       Updating...
                     </>
                   ) : (
                     <>
                   <Loader2 size={16} className="animate-spin mr-2" />
                       Creating...
                     </>
                   )
                 ) : (
                   editId ? "Update User" : "Create User"
                 )}

              </button>
              <button
                onClick={closeModal}
                className="px-6 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl text-sm font-semibold transition"
              >
                Cancel
              </button>
             
            </div>
          </div>
        </div>
      )}
    </div>

      <DeleteModal
        open={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={async () => {
          if (deleteUser) {
            await dispatch(deleteAdmin(deleteUser.id));
            setDeleteUser(null);
            fetchAllUsers();
          }
        }}
        parentTitle={`Delete ${deleteUser?.full_name}?`}
        childTitle={deleteUser ? `This will permanently delete ${deleteUser.email}.` : ""}
      />
    </>
  );
}