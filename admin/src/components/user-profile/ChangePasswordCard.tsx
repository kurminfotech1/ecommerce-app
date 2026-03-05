"use client";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/rootReducer";
import { changePassword } from "@/redux/auth/authApi";
import { Eye, EyeOff, CheckCircle2, Loader2, Lock } from "lucide-react";

// ── Password strength ────────────────────────────────────────────────────────
function passwordStrength(pwd: string): { level: number; label: string; color: string } {
  if (!pwd) return { level: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 6)   score++;
  if (pwd.length >= 10)  score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { level: 1, label: "Weak",   color: "bg-red-500" };
  if (score <= 3) return { level: 2, label: "Medium", color: "bg-amber-400" };
  return              { level: 3, label: "Strong", color: "bg-emerald-500" };
}

// ── Password field with show/hide toggle ─────────────────────────────────────
function PwdField({
  id, label, value, onChange, placeholder,
}: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs leading-normal text-gray-500 dark:text-gray-400">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-4 pr-11 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition"
        />
        <button
          type="button"
          onClick={() => setShow((p) => !p)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          tabIndex={-1}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function ChangePasswordCard() {
  const adminData = useSelector((state: RootState) => state.auth.user);

  const [form, setForm]             = useState({ current: "", newPwd: "", confirm: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");

  const strength = passwordStrength(form.newPwd);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.current || !form.newPwd || !form.confirm) {
      setError("All fields are required.");
      return;
    }
    if (form.newPwd.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (form.newPwd !== form.confirm) {
      setError("New passwords do not match.");
      return;
    }
    if (!adminData?.email) {
      setError("Unable to determine your account. Please refresh.");
      return;
    }

    setSubmitting(true);
    const result = await changePassword({
      email:       adminData.email,
      password:    form.current,
      newPassword: form.newPwd,
    });
    setSubmitting(false);

    if (result.success) {
      setForm({ current: "", newPwd: "", confirm: "" });
    } else {
      setError(result.message || "Password change failed.");
    }
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Change Password
          </h4>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <PwdField
                id="cp-current"
                label="Current Password"
                value={form.current}
                onChange={(v) => setForm((p) => ({ ...p, current: v }))}
                placeholder="Enter current password"
              />
              <PwdField
                id="cp-new"
                label="New Password"
                value={form.newPwd}
                onChange={(v) => { setForm((p) => ({ ...p, newPwd: v })); setError(""); }}
                placeholder="Min. 6 characters"
              />
              <PwdField
                id="cp-confirm"
                label="Confirm New Password"
                value={form.confirm}
                onChange={(v) => { setForm((p) => ({ ...p, confirm: v })); setError(""); }}
                placeholder="Re-enter new password"
              />
            </div>

            {/* Strength + match indicator */}
            {form.newPwd && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex gap-1 h-1.5 w-28">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all ${
                        strength.level >= i ? strength.color : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    />
                  ))}
                </div>
                <span className={`text-xs font-medium ${
                  strength.level === 1 ? "text-red-500" :
                  strength.level === 2 ? "text-amber-500" : "text-emerald-600"
                }`}>
                  {strength.label}
                </span>
                {form.confirm && (
                  <span className={`text-xs font-medium flex items-center gap-1 ${
                    form.newPwd === form.confirm ? "text-emerald-600" : "text-red-500"
                  }`}>
                    {form.newPwd === form.confirm
                      ? <><CheckCircle2 size={12} /> Passwords match</>
                      : "No match"}
                  </span>
                )}
              </div>
            )}

            {/* Error message only — no success banner */}
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full md:w-auto items-center justify-center gap-2 rounded-full border border-gray-300 bg-brand-600 px-4 py-3 text-sm font-medium text-white shadow-theme-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {submitting
                  ? <><Loader2 size={15} className="animate-spin" /> Changing…</>
                  : <><Lock size={14} /> Change Password</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
