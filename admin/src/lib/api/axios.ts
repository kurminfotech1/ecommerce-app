import axios from "axios";
import Cookies from "js-cookie";

const Axios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

Axios.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = Cookies.get("token");

      const isFormData = config.data instanceof FormData;

      config.headers["Content-Type"] = isFormData
        ? "multipart/form-data"
        : "application/json";

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

Axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error || "Something went wrong";
    return Promise.reject(message);
  }
);

export default Axios;
