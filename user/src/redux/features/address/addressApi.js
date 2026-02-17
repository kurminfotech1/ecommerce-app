
import { toast } from "react-toastify";
import api from "@/redux/api/apiSlice";

// GET addresses
export const getAddresses = async (userId) => {
  try {
    const res = await api.get(`/userAuth/address?userId=${userId}`);
    return res.data;
  } catch (error) {
    toast.error(
      error?.response?.data?.error 
    );
    throw error;
  }
};

// CREATE address
export const createAddress = async (data) => {
  try {
    const res = await api.post("/userAuth/address", data);
    toast.success(res?.data?.message);
    return res.data;
  } catch (error) {
    toast.error(
      error?.response?.data?.error  
    );
    throw error;
  }
};

// UPDATE address
export const updateAddress = async (data) => {
  try {
    const res = await api.put("/userAuth/address", data);
    toast.success(res?.data?.message);
    return res.data;
  } catch (error) {
    toast.error(
      error?.response?.data?.error
    );
    throw error;
  }
};
