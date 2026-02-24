import api from "@/redux/api/apiSlice";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export const addReview = createAsyncThunk(
  "reviews/addReview",
  async (reviewData, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/reviews", reviewData);
      toast.success(response.data.message || "Review submitted successfully!");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error || "Failed to submit review. Try again.";
      toast.error(message);
      return rejectWithValue(message);
    }
  },
);
