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

// Lightweight shape used when sending images to create/update endpoints
export type ProductImageInput = {
  image_url: string;
  sort_order?: number;
};

export interface ProductVariant {
  id: string;
  product_id: string;
  size?: string | null;
  color?: string | null;
  price: number;
  compare_price?: number | null;
  stock: number;
  sku: string;
  created_at?: string;
  updated_at?: string;
}

// Input shape when sending variants to create/update endpoints
export type ProductVariantInput = {
  size?: string;
  color?: string;
  price: number;
  compare_price?: number;
  stock?: number;
  sku?: string;
};

export interface Product {
  id: string;
  product_name: string;
  slug?: string | null;
  description?: string | null;
  short_desc?: string | null;
  is_active: boolean;
  is_featured: boolean;
  meta_title?: string | null;
  meta_desc?: string | null;
  category_id: string;

  category?: { id: string; name: string };
  images?: ProductImage[];
  variants?: ProductVariant[];

  sold_count?: number;
  rating_avg?: number;
  rating_count?: number;

  created_at?: string;
  updated_at?: string;
}

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  active?: boolean;
  featured?: boolean;
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
type CreateProductInput = Omit<Partial<Product>, "images" | "variants"> & {
  images?: ProductImageInput[];
  variants?: ProductVariantInput[];
};

export const createProduct = createAsyncThunk(
  "products/create",
  async (data: CreateProductInput, { rejectWithValue }) => {
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
type UpdateProductInput = Omit<Partial<Product>, "images" | "variants"> & {
  id: string;
  images?: ProductImageInput[];
  variants?: ProductVariantInput[];
};

export const updateProduct = createAsyncThunk(
  "products/update",
  async (data: UpdateProductInput, { rejectWithValue }) => {
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
