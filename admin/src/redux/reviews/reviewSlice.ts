import { createSlice } from "@reduxjs/toolkit";
import { getReviews, updateReviewStatus, deleteReview, Review } from "./reviewApi";

interface ReviewState {
  reviews: Review[];
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
}

const initialState: ReviewState = {
  reviews: [],
  totalRecords: 0,
  currentPage: 1,
  totalPages: 1,
  pageSize: 10,
  loading: false,
  error: null,
};

const reviewSlice = createSlice({
  name: "reviews",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // getReviews
      .addCase(getReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload.data;
        state.totalRecords = action.payload.totalRecords;
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.pageSize = action.payload.pageSize;
      })
      .addCase(getReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // updateReviewStatus
      .addCase(updateReviewStatus.fulfilled, (state, action) => {
        const index = state.reviews.findIndex(r => r.id === action.payload.updated.id);
        if (index !== -1) {
          state.reviews[index].status = action.payload.updated.status;
        }
      })
      
      // deleteReview
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.reviews = state.reviews.filter(r => r.id !== action.payload);
        state.totalRecords = Math.max(0, state.totalRecords - 1);
      });
  }
});

export default reviewSlice.reducer;
