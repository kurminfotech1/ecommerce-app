
import api from "@/redux/api/apiSlice";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

// ── GET ALL PRODUCTS ─────────────────────────────
export const getAllProducts = createAsyncThunk(
  "products/get",
  async (params = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([k, v]) => [k, String(v)])
      ).toString();

      const res = await api.get(`/products?${query}`);
      return res.data; 
      // expected response:
      // { data, totalRecords, currentPage, totalPages, pageSize }
    } catch (e) {
      toast.error(e?.response?.data?.error || "Failed to load products");
      return rejectWithValue(e.message);
    }
  }
);

// ── GET SINGLE PRODUCT ───────────────────────────
export const getProduct = createAsyncThunk(
  "products/getOne",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/products?id=${id}`);
      return res.data.data;
    } catch (e) {
      toast.error(e?.response?.data?.error || "Failed to load product");
      return rejectWithValue(e.message);
    }
  }
);