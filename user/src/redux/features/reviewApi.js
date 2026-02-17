// import { apiSlice } from "../api/apiSlice";

// export const reviewApi = apiSlice.injectEndpoints({
//   overrideExisting: true,
//   endpoints: (builder) => ({
//     addReview: builder.mutation({
//       query: (data) => ({
//         url: "https://shofy-backend.vercel.app/api/review/add",
//         method: "POST",
//         body: data,
//       }),
//       invalidatesTags: (result, error, arg) => ["Products",{ type: "Product", id: arg.productId }],
//     }),
//   }),
// });

// export const {useAddReviewMutation} = reviewApi;

import axios from "axios";
import { toast } from "react-toastify";

// Add category
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
