import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./auth/authSlice";
import categoriesReducer from "./categories/categoriesSlice";
import productsReducer from "./products/productsSlice";
import blogReducer from "./blog/blogSlice";
import reviewReducer from "./reviews/reviewSlice";

export const rootReducer = combineReducers({
  auth: authReducer,
  categories: categoriesReducer,
  products: productsReducer,
  blogs: blogReducer,
  reviews: reviewReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
