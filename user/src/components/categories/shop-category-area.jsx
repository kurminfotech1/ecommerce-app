import React, { useEffect, useState } from "react";
import ErrorMsg from "../common/error-msg";
import { getShowCategory } from "@/redux/features/categoryApi";
import { useRouter } from "next/router";
import ShopCategoryLoader from "../loader/shop/shop-category-loader";
import { getCategories } from "@/redux/features/categories/categoriesApi";
import { useDispatch } from "react-redux";

const ShopCategoryArea = () => {
  // const { data: categories, isLoading, isError } = useGetShowCategoryQuery();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const res = await dispatch(getCategories());
        setCategories(res?.payload?.data);
      } catch (error) {
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
      `/shop?category=${title
        .toLowerCase()
        .replace("&", "")
        .split(" ")
        .join("-")}`,
    );
  };

  // decide what to render
  let content = null;

  if (isLoading) {
    content = <ShopCategoryLoader loading={isLoading} />;
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
      <div key={item._id} className="col-lg-3 col-sm-6">
        <div
          className="tp-category-main-box mb-25 p-relative fix"
          style={{ backgroundColor: "#F3F5F7" }}
        >
          <div className="tp-category-main-content">
            <h3
              className="tp-category-main-title pb-1"
              onClick={() => handleCategoryRoute(item.name)}
            >
              <a className="cursor-pointer">{item.name}</a>
            </h3>
            {/* <span className="tp-category-main-item">
              {item.products.length} Products
            </span> */}
          </div>
        </div>
      </div>
    ));
  }
  return (
    <>
      <section className="tp-category-area pb-120">
        <div className="container">
          <div className="row">{content}</div>
        </div>
      </section>
    </>
  );
};

export default ShopCategoryArea;
