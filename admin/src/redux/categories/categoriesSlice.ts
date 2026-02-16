import { createSlice } from "@reduxjs/toolkit";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  Category,
} from "./categoriesApi";

interface CategoryState {
  loading: boolean;
  categories: Category[];
  error: string | null;
}

const initialState: CategoryState = {
  loading: false,
  categories: [],
  error: null,
};

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder

      // ================= FETCH =================
      .addCase(getCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(getCategories.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch categories";
      })

      // ================= CREATE =================
      .addCase(createCategory.pending, (state) => {
        state.loading = true;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories.unshift(action.payload);
      })
      .addCase(createCategory.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Create failed";
      })

      // ================= UPDATE =================
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false;

        const index = state.categories.findIndex(
          (c) => c.id === action.payload.id
        );

        if (index !== -1) {
          state.categories[index] = action.payload;
        }
      })
      .addCase(updateCategory.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Update failed";
      })

      // ================= DELETE =================
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = state.categories.filter(
          (c) => c.id !== action.payload
        );
      })
      .addCase(deleteCategory.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || "Delete failed";
      });
  },
});

export default categoriesSlice.reducer;
