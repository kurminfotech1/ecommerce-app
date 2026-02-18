import Axios from "@/lib/api/axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface ProductImage {
  id: number;
  image_url: string;
}

export interface Product {
  id: number;
  product_name: string;
  slug?: string;
  description?: string;
  short_desc?: string;
  size?: string;
  color?: string;
  price: number;
  compare_price?: number;
  stock: number;
  sku?: string;
  is_featured?: boolean;
  category_id: number;

  category?: {
    id: number;
    category_name: string;
  };

  images?: ProductImage[];
}

/* GET */

export const getProducts = createAsyncThunk(
  "products/get",
  async (params: any = {}) => {
    try {const query = new URLSearchParams(params).toString();

    const res = await Axios.get(`/products?${query}`);
    return res.data;
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e);
      throw e;
    }
  }
);


/* CREATE */

export const createProduct = createAsyncThunk(
  "products/create",
  async (data: any, { rejectWithValue }) => {
    try {
      const res = await Axios.post("products", data);
      toast.success(res.data.message);
      return res.data.data;
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e);
      return rejectWithValue(e.message);
    }
  }
);


/* UPDATE */

export const updateProduct = createAsyncThunk(
  "products/update",
  async (data: any, { rejectWithValue }) => {
    try {
      const res = await Axios.put(`products?id=${data.id}`, data);
      toast.success(res.data.message);
      return res.data.data;
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e);
      return rejectWithValue(e.message);
    }
  }
);


/* DELETE */

export const deleteProduct = createAsyncThunk(
  "products/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      const res = await Axios.delete(`products?id=${id}`);
      toast.success(res.data.message);
      return id;
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e);
      return rejectWithValue(e.message);
    }
  }
);

