import { createSlice } from "@reduxjs/toolkit";
import { getCategories } from "./categoriesApi";

const initialState = {
  loading: false,
  categories: [],
  totalRecords: 0,
  currentPage: 1,
  totalPages: 1,
  pageSize: 10,
  error: null,
};

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder

      // FETCH CATEGORIES
      .addCase(getCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload?.data || [];
        state.totalRecords = action.payload?.totalRecords || 0;
        state.currentPage = action.payload?.currentPage || 1;
        state.totalPages = action.payload?.totalPages || 1;
        state.pageSize = action.payload?.pageSize || 10;
      })

      .addCase(getCategories.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Failed to fetch categories";
      });
  },
});

export default categoriesSlice.reducer;