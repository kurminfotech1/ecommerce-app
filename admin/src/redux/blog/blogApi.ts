import Axios from "@/lib/api/axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

// ── Types ────────────────────────────────────────────────────────

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  created_at?: string;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  featured_image?: string | null;

  // Author & Category (plain strings)
  category: string;
  author: string;

  // Tags (many-to-many)
  tags?: BlogTag[];

  // SEO
  meta_title?: string | null;
  meta_desc?: string | null;
  canonical_url?: string | null;

  // Status
  is_draft: boolean;
  is_published: boolean;
  is_featured: boolean;

  // Publishing
  published_at?: string | null;

  // System
  created_at?: string;
  updated_at?: string;
}

export interface GetBlogsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  author?: string;
  tag?: string;
  published?: string;
  featured?: string;
  draft?: string;
}

// ── GET all (paginated) ──────────────────────────────────────────
export const getBlogs = createAsyncThunk(
  "blogs/get",
  async (params: GetBlogsParams = {}) => {
    try {
      const query = new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([k, v]) => [k, String(v)])
      ).toString();
      const res = await Axios.get(`/blog?${query}`);
      return res.data;
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to load blogs");
      throw e;
    }
  }
);

// ── GET single blog ─────────────────────────────────────────────
export const getBlog = createAsyncThunk(
  "blogs/getOne",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await Axios.get(`/blog?id=${id}`);
      return res.data.data as Blog;
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to load blog");
      return rejectWithValue(e.message);
    }
  }
);

// ── CREATE ───────────────────────────────────────────────────────
export const createBlog = createAsyncThunk(
  "blogs/create",
  async (data: Partial<Blog> & { tag_ids?: string[] }, { rejectWithValue }) => {
    try {
      const res = await Axios.post("blog", data);
      toast.success(res.data.message || "Blog created!");
      return res.data.data as Blog;
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to create blog");
      return rejectWithValue(e.message);
    }
  }
);

// ── UPDATE ───────────────────────────────────────────────────────
export const updateBlog = createAsyncThunk(
  "blogs/update",
  async (data: Partial<Blog> & { id: string; tag_ids?: string[] }, { rejectWithValue }) => {
    try {
      const res = await Axios.put(`blog?id=${data.id}`, data);
      toast.success(res.data.message || "Blog updated!");
      return res.data.data as Blog;
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to update blog");
      return rejectWithValue(e.message);
    }
  }
);

// ── DELETE ───────────────────────────────────────────────────────
export const deleteBlog = createAsyncThunk(
  "blogs/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await Axios.delete(`blog?id=${id}`);
      toast.success(res.data.message || "Blog deleted!");
      return id;
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to delete blog");
      return rejectWithValue(e.message);
    }
  }
);

// ── UPLOAD BLOG IMAGE (via /api/blog-upload) ────────────────────
export const uploadBlogImage = createAsyncThunk(
  "blogs/uploadImage",
  async (file: File, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await Axios.post("blog-upload", formData);
      return res.data.url as string;
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Image upload failed");
      return rejectWithValue(e.message);
    }
  }
);
