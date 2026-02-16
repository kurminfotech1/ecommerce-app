import { createSlice } from "@reduxjs/toolkit";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  Product,
} from "./productsApi";

interface ProductState {
  loading: boolean;
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
  error: string | null;
}

const initialState: ProductState = {
  loading: false,
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

      // GET PRODUCTS
      .addCase(getProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(getProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.data; // ✅ array
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })

      // CREATE
      .addCase(createProduct.fulfilled, (state, action) => {
        state.products.unshift(action.payload);
      })

      // UPDATE
      .addCase(updateProduct.fulfilled, (state, action) => {
        const i = state.products.findIndex(
          (p) => p.id === action.payload.id
        );
        if (i !== -1) state.products[i] = action.payload;
      })

      // DELETE
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter(
          (p) => p.id !== action.payload
        );
      });
  },
});

export default productsSlice.reducer;
