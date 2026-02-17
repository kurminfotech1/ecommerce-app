import Axios from "@/lib/api/axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface Category {
  id: number;
  category_name: string;
  slug: string;
  is_active: boolean;
}

// create
export const createCategory = createAsyncThunk<
  Category,
  Partial<Category>,
  { rejectValue: string }
>(
  "categories/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await Axios.post("categories", data);
      toast.success(res.data?.message);
      return res.data.category;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message
      );
      return rejectWithValue(error.message);
    }
  }
);

// update
export const updateCategory = createAsyncThunk(
  "categories/update",
  async (data: any, { rejectWithValue }) => {
    try {
      const res = await Axios.put(`categories?id=${data.id}`, data);
      
      toast.success(res.data?.message);
      return res.data.updated;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message
      );
      return rejectWithValue(error.message);
    }
  }
);

// fetch
export const getCategories = createAsyncThunk<
  Category[],
  void,
  { rejectValue: string }
>(
  "categories/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await Axios.get("categories");
      return res.data;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message
      );
      return rejectWithValue(error.message);
    }
  }
);

// delete
export const deleteCategory = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>(
  "categories/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await Axios.delete(`categories?id=${id}`);

      toast.success(res.data?.message);

      return id;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message
      );

      return rejectWithValue(
        error?.response?.data?.message || error.message
      );
    }
  }
);