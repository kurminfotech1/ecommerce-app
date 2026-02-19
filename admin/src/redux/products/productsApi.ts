import Axios from "@/lib/api/axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

// ── Types ────────────────────────────────────────────────────────
export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
}

export interface Product {
  id: string;
  product_name: string;
  slug?: string | null;
  description?: string | null;
  short_desc?: string | null;
  size?: string | null;
  color?: string | null;
  price: number;
  compare_price?: number | null;
  stock: number;
  sku?: string | null;
  is_active: boolean;
  is_featured: boolean;
  meta_title?: string | null;
  meta_desc?: string | null;
  category_id: string;
  parentId?: string | null;

  category?: { id: string; name: string };
  images?: ProductImage[];
  children?: Product[];
  parent?: Pick<Product, "id" | "product_name" | "slug"> | null;

  created_at?: string;
  updated_at?: string;
}

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  featured?: boolean;
  includeVariants?: boolean;
}

// ── GET all (paginated) ──────────────────────────────────────────
export const getProducts = createAsyncThunk(
  "products/get",
  async (params: GetProductsParams = {}) => {
    try {
      const query = new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([k, v]) => [k, String(v)])
      ).toString();
      const res = await Axios.get(`/products?${query}`);
      return res.data; // { data, total, page, totalPages }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to load products");
      throw e;
    }
  }
);

// ── CREATE ───────────────────────────────────────────────────────
export const createProduct = createAsyncThunk(
  "products/create",
  async (
    data: Partial<Product> & {
      images?: { image_url: string; sort_order?: number }[];
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await Axios.post("products", data);
      toast.success(res.data.message || "Product created!");
      return res.data.data as Product;
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e);
      return rejectWithValue(e.message);
    }
  }
);

// ── UPDATE ───────────────────────────────────────────────────────
export const updateProduct = createAsyncThunk(
  "products/update",
  async (
    data: Partial<Product> & {
      id: string;
      images?: { image_url: string; sort_order?: number }[];
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await Axios.put(`products?id=${data.id}`, data);
      toast.success(res.data.message || "Product updated!");
      return res.data.data as Product;
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e);
      return rejectWithValue(e.message);
    }
  }
);

// ── DELETE ───────────────────────────────────────────────────────
export const deleteProduct = createAsyncThunk(
  "products/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await Axios.delete(`products?id=${id}`);
      toast.success(res.data.message || "Product deleted!");
      return id;
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e);
      return rejectWithValue(e.message);
    }
  }
);

// ── UPLOAD IMAGES (via /api/upload) ─────────────────────────────
export const uploadImages = createAsyncThunk(
  "products/uploadImages",
  async (files: File[], { rejectWithValue }) => {
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      const res = await Axios.post("upload", formData);
      return res.data.urls as string[];
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Image upload failed");
      return rejectWithValue(e.message);
    }
  }
);
