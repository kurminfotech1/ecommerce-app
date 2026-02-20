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

export interface CategoriesResponse {
  data: Category[];
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

export interface CategoriesQueryParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  status?: string;
}

/* ── GET (tree) ──────────────────────────────────── */
export const getCategories = createAsyncThunk<
  CategoriesResponse,
  CategoriesQueryParams | void,
  { rejectValue: string }
>(
  "categories/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.set("search", params.search);
      if (params?.page)   query.set("page", String(params.page));
      if (params?.limit)  query.set("limit", String(params.limit));
      if (params?.sortBy) query.set("sortBy", params.sortBy);
      if (params?.status && params.status !== "all") query.set("status", params.status);

      const res = await Axios.get(`categories?${query.toString()}`);
      return res.data;
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
      const errorMessage = error.response?.data?.error || error.message;
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
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
      toast.error(error?.response?.data?.error );
      return rejectWithValue(error.message);
    }
  }
);

/* ── PATCH (toggle active/inactive) ─────────────── */
export const toggleCategoryStatus = createAsyncThunk<
  Category,
  string,
  { rejectValue: string }
>(
  "categories/toggleStatus",
  async (id, { rejectWithValue }) => {
    try {
      const res = await Axios.patch(`categories?id=${id}`);
      toast.success(res.data?.message || "Category status updated");
      return res.data.updated;
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to toggle category status");
      return rejectWithValue(error?.response?.data?.error || error.message);
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