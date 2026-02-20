import Axios from "@/lib/api/axios";
import { Admin } from "@/types/auth";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { encryptData } from "@/lib/crypto";

// register
export const register = createAsyncThunk<
  Admin,          // return type
  Partial<Admin>, // payload type
  { rejectValue: string }
>(
  "admin/register",
  async (data, { rejectWithValue }) => {
    try {
      const res = await Axios.post("auth/register", data);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error);
    }
  }
);

// fetch
export const fetchUsers = createAsyncThunk<
  Admin[],
  void,
  { rejectValue: string }
>(
  "admin/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await Axios.get("auth/register");
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error);
    }
  }
);



// login
export const login = createAsyncThunk(
  "auth/login",
  async (
    data: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await Axios.post("auth/login", data);

      // Cookies.set("token", res.data.token, { expires: 1 });
      //     Cookies.set("userId", res.data.admin.id, { expires: 1 });
      //     Cookies.set("role", res.data.admin.role, { expires: 1 });
      Cookies.set("token", encryptData(res.data.token));
      Cookies.set("userId", encryptData(res.data.admin.id));

      Cookies.set("role", encryptData(res.data.admin.role));

      toast.success(res?.data?.message);

      return res.data;
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong";

      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// get one admin
export const fetchAdminById = createAsyncThunk<
  Admin,
  string,
  { rejectValue: string }
>(
  "admin/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await Axios.get(`auth/getone/${id}`);
      return res.data.admin;
    } catch (error: any) {
      return rejectWithValue(error);
    }
  }
);

export const updateAdmin = createAsyncThunk<
  Admin,
  { id: string; data: Partial<Admin> },
  { rejectValue: string }
>(
  "admin/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await Axios.put(`auth/update/${id}`, data);
      toast.success(
        res?.data?.success
      );
      return res.data.admin;
    } catch (error: any) {
      const message =
        error;

      toast.error(message);
      return rejectWithValue(message);
    }
  }
)