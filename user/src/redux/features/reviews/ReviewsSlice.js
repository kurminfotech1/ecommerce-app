import { createSlice } from "@reduxjs/toolkit";
import { addReview } from "./ReviewsApi";

const initialState = {
  reviews: [],
  loading: false,
  error: null,
};

export const reviewsSlice = createSlice({
  name: "reviews",
  initialState,
  reducers: {
    clearReviewsState: (state) => {
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addReview.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.review) {
          state.reviews.push(action.payload.review);
        }
      })
      .addCase(addReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearReviewsState } = reviewsSlice.actions;

export default reviewsSlice.reducer;
