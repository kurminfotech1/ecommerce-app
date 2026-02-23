import React, { useEffect, useState } from "react";
// internal
import SEO from "@/components/seo";
import HeaderTwo from "@/layout/headers/header-2";
import Footer from "@/layout/footers/footer";
import Wrapper from "@/layout/wrapper";
import ErrorMsg from "@/components/common/error-msg";
import { getProduct } from "@/redux/features/products/productsApi";
import { useDispatch } from "react-redux";
import ProductDetailsBreadcrumb from "@/components/breadcrumb/product-details-breadcrumb";
import ProductDetailsArea from "@/components/product-details/product-details-area";
import PrdDetailsLoader from "@/components/loader/prd-details-loader";

const ProductDetailsPage = ({ query }) => {
  const dispatch = useDispatch();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await dispatch(getProduct(query.id));

        let data = res?.payload;
        // The API returns an array since it supports pagination/querying.
        if (Array.isArray(data)) {
          data = data.find((item) => item.id === query.id) || data[0];
        }

        if (data) {
          const firstVariant = data.variants?.[0] || {};
          const price = firstVariant.price || 0;
          const comparePrice = firstVariant.compare_price || 0;
          const discount =
            comparePrice > price
              ? Math.round(((comparePrice - price) / comparePrice) * 100)
              : 0;
          const img = firstVariant.images?.[0]?.image_url || "";
          // Collect all images from all variants into an array
          const allImages =
            data.variants?.flatMap(
              (v) =>
                v.images?.map((imgObj) => ({
                  img: imgObj.image_url,
                  color: { name: v.color || "", clrCode: v.color || "" },
                })) || [],
            ) || [];

          const quantity =
            data.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;

          const mappedProduct = {
            ...data,
            _id: data.id,
            title: data.product_name,
            price: price,
            compare_price: comparePrice,
            discount: discount,
            img: img,
            quantity: firstVariant?.stock || quantity || 0,
            description: data.description || data.short_desc || "",
            parent: data.category?.name || "Category",
            children: "sub",
            brand: data.brand || { name: "Brand" },
            tags: [],
            reviews: [],
            status: firstVariant.stock > 0 ? "in-stock" : "out-of-stock",
            imageURLs: allImages,
          };
          setProduct(mappedProduct);
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error("Error fetching or mapping product details:", err);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [query.id]);
  // decide what to render
  let content = null;
  if (isLoading) {
    content = <PrdDetailsLoader loading={isLoading} />;
  }
  if (!isLoading && isError) {
    content = <ErrorMsg msg="There was an error" />;
  }
  if (!isLoading && !isError && product) {
    content = (
      <>
        <ProductDetailsBreadcrumb
          category={product.category.name}
          title={product.title}
        />
        <ProductDetailsArea productItem={product} />
      </>
    );
  }
  return (
    <Wrapper>
      <SEO pageTitle="Product Details" />
      <HeaderTwo style_2={true} />
      {content}
      <Footer primary_style={true} />
    </Wrapper>
  );
};

export default ProductDetailsPage;

export const getServerSideProps = async (context) => {
  const { query } = context;

  return {
    props: {
      query,
    },
  };
};
