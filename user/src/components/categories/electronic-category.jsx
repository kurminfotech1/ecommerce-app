import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
// internal
import ErrorMsg from "../common/error-msg";
import { getProductTypeCategory } from "@/redux/features/categoryApi";
import HomeCateLoader from "../loader/home/home-cate-loader";

const ElectronicCategory = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getProductTypeCategory("electronics");
        setCategories(data?.result || []);
        console.log("data", data?.data);
      } catch (err) {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);
  const router = useRouter();

  // handle category route
  const handleCategoryRoute = (title) => {
    router.push(
      `/shop?category=${title.toLowerCase().replace("&", "").split(" ").join("-")}`,
    );
  };
  // decide what to render
  let content = null;

  if (isLoading) {
    content = <HomeCateLoader loading={isLoading} />;
  }
  if (!isLoading && isError) {
    content = <ErrorMsg msg="There was an error" />;
  }
  if (!isLoading && !isError && categories?.length === 0) {
    content = <ErrorMsg msg="No Category found!" />;
  }
  if (!isLoading && !isError && categories?.length > 0) {
    const category_items = categories;
    content = category_items.map((item) => (
      <div className="col" key={item._id}>
        <div className="tp-product-category-item text-center mb-40">
          <div className="tp-product-category-thumb fix">
            <a
              className="cursor-pointer"
              onClick={() => handleCategoryRoute(item.parent)}
            >
              <Image
                src={item.img}
                alt="product-category"
                width={76}
                height={98}
              />
            </a>
          </div>
          <div className="tp-product-category-content">
            <h3 className="tp-product-category-title">
              <a
                className="cursor-pointer"
                onClick={() => handleCategoryRoute(item.parent)}
              >
                {item.parent}
              </a>
            </h3>
            <p>{item.products.length} Product</p>
          </div>
        </div>
      </div>
    ));
  }
  return (
    <section className="tp-product-category pt-60 pb-15">
      <div className="container">
        <div className="row row-cols-xl-5 row-cols-lg-5 row-cols-md-4">
          {content}
        </div>
      </div>
    </section>
  );
};

export default ElectronicCategory;
