import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
// internal
import ErrorMsg from "@/components/common/error-msg";
import { getProductTypeCategory } from "@/redux/features/categoryApi";
import CategoryListLoader from "@/components/loader/home/category-list-loader";

const PrdCategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getProductTypeCategory("electronics");
        setCategories(data?.result || []);
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
    content = <CategoryListLoader loading={isLoading} />;
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
      <li key={item._id}>
        <a
          onClick={() => handleCategoryRoute(item.parent)}
          className="cursor-pointer"
        >
          {item.parent}
        </a>
      </li>
    ));
  }
  return <ul>{content}</ul>;
};

export default PrdCategoryList;
