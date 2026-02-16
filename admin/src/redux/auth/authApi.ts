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

      return res.data;
    } catch (error: any) {
      return rejectWithValue(error);
    }
  }
);