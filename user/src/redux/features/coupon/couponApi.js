import axios from "axios";

const BASE_URL = "https://shofy-backend.vercel.app/api";

// ✅ Get offer coupons
export const getOfferCoupons = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/coupon`);
    return res.data;
  } catch (error) {
    console.error("Error fetching coupons:", error);
    throw error;
  }
};
