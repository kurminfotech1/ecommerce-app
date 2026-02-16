import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./auth/authSlice";
import categoriesReducer from "./categories/categoriesSlice";
import productsReducer from "./products/productsSlice";

export const rootReducer = combineReducers({
  auth: authReducer,
  categories: categoriesReducer,
  products: productsReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
