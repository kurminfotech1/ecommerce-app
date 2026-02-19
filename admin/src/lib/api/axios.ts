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

      if (isFormData) {
        // ⚠️ Do NOT set Content-Type manually for FormData.
        // Browser must set it automatically so it includes the
        // correct multipart boundary. Without boundary, the server
        // cannot parse the form fields/files.
        delete config.headers["Content-Type"];
      } else {
        config.headers["Content-Type"] = "application/json";
      }

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
      error.response?.data?.error || error.message || "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

export default Axios;
