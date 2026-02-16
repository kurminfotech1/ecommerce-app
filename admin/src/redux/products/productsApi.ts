import Axios from "@/lib/api/axios";
import { createAsyncThunk } from "@reduxjs/toolkit";

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
    const query = new URLSearchParams(params).toString();

    const res = await fetch(`/api/products?${query}`);
    return await res.json();
  }
);


/* CREATE */

export const createProduct = createAsyncThunk(
  "products/create",
  async (data: any, { rejectWithValue }) => {
    try {
      const res = await Axios.post("products", data);
      return res.data;
    } catch (e: any) {
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
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

/* DELETE */

export const deleteProduct = createAsyncThunk(
  "products/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await Axios.delete(`products?id=${id}`);
      return id;
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);
