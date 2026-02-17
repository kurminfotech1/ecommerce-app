// import Cookies from 'js-cookie';
// import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// export const apiSlice = createApi({
//   reducerPath: 'api',
//   baseQuery: fetchBaseQuery({
//     baseUrl: '/api',
//     prepareHeaders: async (headers) => {
//       try {
//         const userInfo = Cookies.get('userInfo');
//         if (userInfo) {
//           const user = JSON.parse(userInfo);
//           if (user?.accessToken) {
//             headers.set('Authorization', `Bearer ${user.accessToken}`);
//           }
//         }
//       } catch (error) {
//         console.error('Error parsing user info:', error);
//       }
//       return headers;
//     },
//   }),
//   endpoints: (builder) => ({}),
//   tagTypes: [
//     'Products',
//     'Coupon',
//     'Product',
//     'RelatedProducts',
//     'UserOrder',
//     'UserOrders',
//     'ProductType',
//     'OfferProducts',
//     'PopularProducts',
//     'TopRatedProducts',
//     'Address',
//   ],
// });

import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: "/api",
});

// Attach token automatically
api.interceptors.request.use(
  (config) => {
    try {
      const userInfo = Cookies.get("userInfo");

      if (userInfo) {
        const user = JSON.parse(userInfo);
        if (user?.accessToken) {
          config.headers.Authorization = `Bearer ${user.accessToken}`;
        }
      }
    } catch (error) {
      console.error("Token parsing error:", error);
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default api;
