import Axios from "@/lib/api/axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

/* ── Types ─────────────────────────────────────────── */

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  is_active: boolean;
  children?: Category[];
}

export interface CreateCategoryPayload {
  name: string;
  slug: string;
  parentId?: string | null;
  is_active?: boolean;
}

/* ── GET (tree) ──────────────────────────────────── */
export const getCategories = createAsyncThunk<
  Category[],
  void,
  { rejectValue: string }
>(
  "categories/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await Axios.get("categories");
      return res.data.data; // already tree from backend
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to fetch categories");
      return rejectWithValue(error.message);
    }
  }
);

/* ── POST ───────────────────────────────────────── */
export const createCategory = createAsyncThunk<
  Category,
  CreateCategoryPayload,
  { rejectValue: string }
>(
  "categories/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await Axios.post("categories", data);
      toast.success(res.data?.message || "Category created");
      return res.data.category;
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Create failed");
      return rejectWithValue(error.message);
    }
  }
);

/* ── PUT ────────────────────────────────────────── */
export const updateCategory = createAsyncThunk<
  Category,
  { id: string; name: string; slug: string; parentId?: string | null },
  { rejectValue: string }
>(
  "categories/update",
  async (data, { rejectWithValue }) => {
    try {
      const res = await Axios.put(`categories?id=${data.id}`, data);
      toast.success(res.data?.message || "Category updated");
      return res.data.updated;
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Update failed");
      return rejectWithValue(error.message);
    }
  }
);

/* ── DELETE ─────────────────────────────────────── */
export const deleteCategory = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  "categories/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await Axios.delete(`categories?id=${id}`);
      toast.success(res.data?.message || "Category deleted");
      return id;
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Delete failed");
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  }
);