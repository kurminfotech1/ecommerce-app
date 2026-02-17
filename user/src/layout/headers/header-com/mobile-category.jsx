"use client";
import Image from "next/image";
import { useRouter } from "next/router";
import ErrorMsg from "@/components/common/error-msg";
import Loader from "@/components/loader/loader";
import { useEffect, useState } from "react";
import { getProductTypeCategory } from "@/redux/features/categoryApi";


const MobileCategory = ({ isCategoryActive, categoryType }) => {
  const [categories, setCategories] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isActiveSubMenu, setIsActiveSubMenu] = useState("");

  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await getProductTypeCategory(categoryType);
        setCategories(result);
      } catch (error) {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [categoryType]);

  // submenu toggle
  const handleOpenSubMenu = (title) => {
    setIsActiveSubMenu((prev) => (prev === title ? "" : title));
  };

  // route handler
  const handleCategoryRoute = (title, route) => {
    if (route === "parent") {
      router.push(
        `/shop?category=${title
          .toLowerCase()
          .replace("&", "")
          .split(" ")
          .join("-")}`
      );
    } else {
      router.push(
        `/shop?subCategory=${title
          .toLowerCase()
          .replace("&", "")
          .split(" ")
          .join("-")}`
      );
    }
  };

  let content = null;

  if (isLoading) {
    content = (
      <div className="py-5">
        <Loader loading={isLoading} />
      </div>
    );
  }

  if (!isLoading && isError) {
    content = <ErrorMsg msg="There was an error" />;
  }

  if (!isLoading && !isError && categories?.result?.length === 0) {
    content = <ErrorMsg msg="No Category found!" />;
  }

  if (!isLoading && !isError && categories?.result?.length > 0) {
    content = categories.result.map((item) => (
      <li className="has-dropdown" key={item._id}>
        <a className="cursor-pointer">
          {item.img && (
            <span>
              <Image src={item.img} alt="cate img" width={50} height={50} />
            </span>
          )}
          {item.parent}

          {item.children && (
            <button
              onClick={() => handleOpenSubMenu(item.parent)}
              className="dropdown-toggle-btn"
            >
              <i className="fa-regular fa-angle-right"></i>
            </button>
          )}
        </a>

        {item.children && (
          <ul
            className={`tp-submenu ${
              isActiveSubMenu === item.parent ? "active" : ""
            }`}
          >
            {item.children.map((child, i) => (
              <li
                key={i}
                onClick={() => handleCategoryRoute(child, "children")}
              >
                <a className="cursor-pointer">{child}</a>
              </li>
            ))}
          </ul>
        )}
      </li>
    ));
  }

  return <ul className={isCategoryActive ? "active" : ""}>{content}</ul>;
};

export default MobileCategory;
