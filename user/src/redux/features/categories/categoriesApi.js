
import api from "@/redux/api/apiSlice";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

/* ── GET Categories ───────────────────────────── */

export const getCategories = createAsyncThunk(
  "categories/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();

      if (params?.search) query.set("search", params.search);
      if (params?.page) query.set("page", String(params.page));
      if (params?.limit) query.set("limit", String(params.limit));
      if (params?.sortBy) query.set("sortBy", params.sortBy);
      if (params?.status && params.status !== "all") {
        query.set("status", params.status);
      }

      const res = await api.get(`categories?${query.toString()}`);

      return res.data;
    } catch (error) {
      const message =   
        error?.response?.data?.error || "Failed to fetch categories";

      toast.error(message);

      return rejectWithValue(message);
    }
  }
);