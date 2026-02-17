import axios from "axios";
import { toast } from "react-toastify";

// Add category
const BASE_URL = "https://shofy-backend.vercel.app/api";

export const addCategory = async (data) => {
  try {
    const res = await axios.post(`${BASE_URL}/category/add`, data);

    toast.success(res.data?.message || "Category added successfully");
    return res.data;
  } catch (error) {
    toast.error(error?.response?.data?.error || "Failed to add category");
    throw error;
  }
};

// Get all categories
export const getShowCategory = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/category/show`);
    return res.data;
  } catch (error) {
    toast.error(error?.response?.data?.error || "Failed to fetch categories");
    throw error;
  }
};

// Get category by product type
export const getProductTypeCategory = async (type) => {
  try {
    const res = await axios.get(`${BASE_URL}/category/show/${type}`);
    return res.data;
  } catch (error) {
    toast.error(error?.response?.data?.error || "Failed to fetch category");
    throw error;
  }
};
