import { createSlice } from "@reduxjs/toolkit";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImages,
  Product,
} from "./productsApi";

interface ProductState {
  loading: boolean;
  submitting: boolean;
  uploading: boolean;
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
  error: string | null;
}

const initialState: ProductState = {
  loading: false,
  submitting: false,
  uploading: false,
  products: [],
  total: 0,
  page: 1,
  totalPages: 1,
  error: null,
};

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder

      // ── GET ────────────────────────────────────────────────────
      .addCase(getProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(getProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed";
      })

      // ── CREATE ─────────────────────────────────────────────────
      .addCase(createProduct.pending, (state) => {
        state.submitting = true;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.submitting = false;
        state.products.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createProduct.rejected, (state) => {
        state.submitting = false;
      })

      // ── UPDATE ─────────────────────────────────────────────────
      .addCase(updateProduct.pending, (state) => {
        state.submitting = true;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.submitting = false;
        const i = state.products.findIndex((p) => p.id === action.payload.id);
        if (i !== -1) state.products[i] = action.payload;
      })
      .addCase(updateProduct.rejected, (state) => {
        state.submitting = false;
      })

      // ── DELETE ─────────────────────────────────────────────────
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter((p) => p.id !== action.payload);
        state.total -= 1;
      })

      // ── UPLOAD ─────────────────────────────────────────────────
      .addCase(uploadImages.pending, (state) => {
        state.uploading = true;
      })
      .addCase(uploadImages.fulfilled, (state) => {
        state.uploading = false;
      })
      .addCase(uploadImages.rejected, (state) => {
        state.uploading = false;
      });
  },
});

export default productsSlice.reducer;
