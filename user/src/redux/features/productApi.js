import axios from "axios";

const BASE_URL = "https://shofy-backend.vercel.app/api/product";

// ✅ Get all products
export const getAllProducts = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/all`);
    return res.data;
  } catch (error) {
    console.error("Error fetching all products:", error);
    throw error;
  }
};

// ✅ Get product by type
export const getProductType = async ({ type, query = {} }) => {
  try {
    // Convert query object to URL params
    const queryString = new URLSearchParams(query).toString();

    const res = await axios.get(`${BASE_URL}/${type}?${queryString}`);

    console.log("res", res.data);
    return res.data;
  } catch (error) {
    console.error("Error fetching product type:", error);
    throw error;
  }
};

// ✅ Offer products
export const getOfferProducts = async (type) => {
  try {
    const res = await axios.get(`${BASE_URL}/offer?type=${type}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching offer products:", error);
    throw error;
  }
};

// ✅ Popular products
export const getPopularProductByType = async (type) => {
  try {
    const res = await axios.get(`${BASE_URL}/popular/${type}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching popular products:", error);
    throw error;
  }
};

// ✅ Top rated
export const getTopRatedProducts = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/top-rated`);
    return res.data;
  } catch (error) {
    console.error("Error fetching top rated:", error);
    throw error;
  }
};

// ✅ Single product
export const getProduct = async (id) => {
  try {
    const res = await axios.get(`${BASE_URL}/single-product/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching product:", error);
    throw error;
  }
};

// ✅ Related products
export const getRelatedProducts = async (id) => {
  try {
    const res = await axios.get(`${BASE_URL}/related-product/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching related products:", error);
    throw error;
  }
};
