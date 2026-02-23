import { createSlice } from "@reduxjs/toolkit";
import { getProducts, getProduct } from "./productsApi";

const initialState = {
  loading: false,
  products: [],
  product: null,
  totalRecords: 0,
  currentPage: 1,
  totalPages: 1,
  pageSize: 10,
  error: null,
};

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder

      // ── GET ALL PRODUCTS ───────────────────────
      .addCase(getProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.data;
        state.totalRecords = action.payload.totalRecords;
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.pageSize = action.payload.pageSize;
      })
      .addCase(getProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed";
      })

      // ── GET SINGLE PRODUCT ─────────────────────
      .addCase(getProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.product = action.payload;
      })
      .addCase(getProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed";
        state.product = null;
      });
  },
});

export default productsSlice.reducer;