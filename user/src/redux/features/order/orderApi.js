// import { apiSlice } from "../../api/apiSlice";
// import { set_client_secret } from "./orderSlice";

// export const authApi = apiSlice.injectEndpoints({
//   overrideExisting: true,
//   endpoints: (builder) => ({
//     // createPaymentIntent
//     createPaymentIntent: builder.mutation({
//       query: (data) => ({
//         url: "https://shofy-backend.vercel.app/api/order/create-payment-intent",
//         method: "POST",
//         body: data,
//       }),

//       async onQueryStarted(arg, { queryFulfilled, dispatch }) {
//         try {
//           const result = await queryFulfilled;
//           dispatch(set_client_secret(result.clientSecret));
//         } catch (err) {
//           // do nothing
//         }
//       },

//     }),
//     // saveOrder
//     saveOrder: builder.mutation({
//       query: (data) => ({
//         url: "https://shofy-backend.vercel.app/api/order/saveOrder",
//         method: "POST",
//         body: data,
//       }),
//       invalidatesTags:['UserOrders'],
//       async onQueryStarted(arg, { queryFulfilled, dispatch }) {
//         try {
//           const result = await queryFulfilled;
//           if (result) {
//             localStorage.removeItem("couponInfo");
//             localStorage.removeItem("cart_products");
//             localStorage.removeItem("shipping_info");
//           }
//         } catch (err) {
//           // do nothing
//         }
//       },

//     }),
//     // getUserOrders
//     getUserOrders: builder.query({
//       query: () => `https://shofy-backend.vercel.app/api/user-order`,
//       providesTags:["UserOrders"],
//       keepUnusedDataFor: 600,
//     }),
//     // getUserOrders
//     getUserOrderById: builder.query({
//       query: (id) => `https://shofy-backend.vercel.app/api/user-order/${id}`,
//       providesTags: (result, error, arg) => [{ type: "UserOrder", id: arg }],
//       keepUnusedDataFor: 600,
//     }),
//   }),
// });

// export const {
//   useCreatePaymentIntentMutation,
//   useSaveOrderMutation,
//   useGetUserOrderByIdQuery,
//   useGetUserOrdersQuery,
// } = authApi;

import axios from "axios";
import { toast } from "react-toastify";

const BASE_URL = "https://shofy-backend.vercel.app/api";

export const useAddReviewMutation = async (data) => {
  try {
    const response = await axios.post(`${BASE_URL}/review/add`, data);
    return response.data;
  } catch (error) {
    console.error("Error adding review:", error);
    throw error;
  }
};

export const useGetUserOrdersQuery = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/user-order`);
    return response.data;
  } catch (error) {
    console.error("Error fetching user orders:", error);
    throw error;
  }
};
