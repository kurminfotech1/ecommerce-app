import Axios from "@/lib/api/axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export type ReviewStatus = "Pending" | "Approved" | "Rejected";

export interface Review {
  id: string;
  customer: {
    name: string;
    email: string;
  };
  product: {
    name: string;
    image: string | null;
    category: string;
  };
  rating: number; // 1–5
  title: string;
  body: string;
  status: ReviewStatus;
  date: string;
}

export interface GetReviewsResponse {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  data: Review[];
}

export interface ReviewsQueryParams {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  rating?: string;
}

export const getReviews = createAsyncThunk<GetReviewsResponse, ReviewsQueryParams | void, { rejectValue: string }>(
  "reviews/getAll",
  async (params, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.set("search", params.search);
      if (params?.page) query.set("page", String(params.page));
      if (params?.limit) query.set("limit", String(params.limit));
      if (params?.status && params.status !== "All") query.set("status", params.status);
      if (params?.rating && params.rating !== "All") query.set("rating", params.rating);

      const res = await Axios.get(`reviews?${query.toString()}`);
      return res.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to fetch reviews");
      return rejectWithValue(error.message);
    }
  }
);

export const updateReviewStatus = createAsyncThunk<
  { updated: Review; message: string },
  { id: string; status: ReviewStatus },
  { rejectValue: string }
>(
  "reviews/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await Axios.patch(`reviews?id=${id}`, { status });
      toast.success(res.data?.message || `Review ${status.toLowerCase()} successfully`);
      return res.data;
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to update review status");
      return rejectWithValue(error.message);
    }
  }
);

export const deleteReview = createAsyncThunk<string, string, { rejectValue: string }>(
  "reviews/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await Axios.delete(`reviews?id=${id}`);
      toast.success(res.data?.message || "Review deleted successfully");
      return id;
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Delete failed");
      return rejectWithValue(error.message);
    }
  }
);
