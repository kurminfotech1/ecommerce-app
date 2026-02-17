// import { apiSlice } from "../api/apiSlice";

// export const brandApi = apiSlice.injectEndpoints({
//   overrideExisting:true,
//   endpoints: (builder) => ({
//     getActiveBrands: builder.query({
//       query: () => `https://shofy-backend.vercel.app/api/brand/active`
//     }),
//   }),
// });

// export const {
//  useGetActiveBrandsQuery
// } = brandApi;

import axios from "axios";
import { toast } from "react-toastify";

// Add category
const BASE_URL = "https://shofy-backend.vercel.app/api";

export const getActiveBrands = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/brand/active`);
    return response.data;
  } catch (error) {
    console.error("Error fetching brands:", error);
    throw error;
  }
};
