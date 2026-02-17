import Axios from "@/lib/api/axios";
import { Admin } from "@/types/auth";
import { createAsyncThunk } from "@reduxjs/toolkit";


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
  async (data: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await Axios.post("auth/login", data);
      // save token
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.admin.id);
      localStorage.setItem("role", res.data.admin.role);

      return res.data;
    } catch (error: any) {
      return rejectWithValue(error);
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
    try {      const res = await Axios.put(`auth/update/${id}`, data);
      return res.data.admin;
    } catch (error: any) {
      return rejectWithValue(error);
    }
  }
)