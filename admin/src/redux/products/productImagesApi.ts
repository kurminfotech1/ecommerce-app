import Axios from "@/lib/api/axios";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const uploadImage = createAsyncThunk(
  "products/upload",
  async (file: File, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await Axios.post("upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return res.data.url;
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);
