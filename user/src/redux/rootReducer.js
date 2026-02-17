// import { combineReducers } from '@reduxjs/toolkit';
// import { apiSlice } from './api/apiSlice';
// import authSlice from './features/auth/authSlice';
// import cartSlice from './features/cartSlice';
// import compareSlice from './features/compareSlice';
// import productModalSlice from './features/productModalSlice';
// import shopFilterSlice from './features/shop-filter-slice';
// import wishlistSlice from './features/wishlist-slice';
// import couponSlice from './features/coupon/couponSlice';
// import orderSlice from './features/order/orderSlice';

// const rootReducer = combineReducers({
//   [apiSlice.reducerPath]: apiSlice.reducer,
//   auth: authSlice,
//   productModal: productModalSlice,
//   shopFilter: shopFilterSlice,
//   cart: cartSlice,
//   wishlist: wishlistSlice,
//   compare: compareSlice,
//   coupon: couponSlice,
//   order: orderSlice,
// });

// export default rootReducer;

import { combineReducers } from "@reduxjs/toolkit";
import authSlice from "./features/auth/authSlice";
import cartSlice from "./features/cartSlice";
import compareSlice from "./features/compareSlice";
import productModalSlice from "./features/productModalSlice";
import shopFilterSlice from "./features/shop-filter-slice";
import wishlistSlice from "./features/wishlist-slice";
import couponSlice from "./features/coupon/couponSlice";
import orderSlice from "./features/order/orderSlice";

const rootReducer = combineReducers({
  auth: authSlice,
  productModal: productModalSlice,
  shopFilter: shopFilterSlice,
  cart: cartSlice,
  wishlist: wishlistSlice,
  compare: compareSlice,
  coupon: couponSlice,
  order: orderSlice,
});

export default rootReducer;
