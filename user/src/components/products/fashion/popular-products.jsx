// external
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Scrollbar } from "swiper";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
// internal
import { TextShapeLine } from "@/svg";
import ErrorMsg from "@/components/common/error-msg";

import { add_cart_product } from "@/redux/features/cartSlice";
import { HomeTwoPopularPrdLoader } from "@/components/loader";
import { notifyError } from "@/utils/toast";
import { useEffect, useState } from "react";
import { getPopularProductByType } from "@/redux/features/productApi";

// slider setting
const slider_setting = {
  slidesPerView: 5,
  spaceBetween: 20,
  loop: false,
  centeredSlides: false,
  scrollbar: {
    el: ".swiper-scrollbar",
    draggable: true,
    dragClass: "tp-swiper-scrollbar-drag",
    snapOnRelease: true,
  },
  breakpoints: {
    1200: {
      slidesPerView: 5,
    },
    992: {
      slidesPerView: 4,
    },
    768: {
      slidesPerView: 3,
    },
    576: {
      slidesPerView: 2,
    },
    0: {
      slidesPerView: 1,
    },
  },
};

const PopularProducts = () => {
  const [products, setProducts] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const { cart_products } = useSelector((state) => state.cart);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const res = await getPopularProductByType({type:"fashion",query: { new: true } });
        
        setProducts(res?.data);
      } catch (err) {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPopular();
  }, []);

  const handleAddProduct = (prd) => {
    if (prd.status === "out-of-stock") {
      notifyError("This product is out-of-stock");
    } else {
      dispatch(add_cart_product(prd));
    }
  };

  let content = null;

  if (isLoading) {
    content = <HomeTwoPopularPrdLoader loading={isLoading} />;
  }

  if (!isLoading && isError) {
    content = <ErrorMsg msg="There was an error" />;
  }

  if (!isLoading && !isError && products?.length === 0) {
    content = <ErrorMsg msg="No Products found!" />;
  }

  if (!isLoading && !isError && products?.length > 0) {
    const product_items = products;

    content = (
      <Swiper
        {...slider_setting}
        modules={[Scrollbar]}
        className="tp-category-slider-active-2 swiper-container mb-50"
      >
        {product_items.map((item) => (
          <SwiperSlide
            key={item._id}
            className="tp-category-item-2 p-relative z-index-1 text-center"
          >
            <div className="tp-category-thumb-2">
              <Link href={`/product-details/${item._id}`}>
                <Image src={item.img} alt="product-img" width={224} height={260} />
              </Link>
            </div>

            <div className="tp-category-content-2">
              <span>From ${item.price}</span>
              <h3 className="tp-category-title-2">
                <Link href={`/product-details/${item._id}`}>
                  {item.title.substring(0, 15)}
                </Link>
              </h3>

              <div className="tp-category-btn-2">
                {cart_products.some((prd) => prd._id === item._id) ? (
                  <Link href="/cart" className="tp-btn tp-btn-border">
                    View Cart
                  </Link>
                ) : (
                  <a
                    onClick={() => handleAddProduct(item)}
                    className="tp-btn tp-btn-border"
                  >
                    Add to Cart
                  </a>
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    );
  }

  return (
    <section className="tp-category-area pb-95 pt-95">
      <div className="container">
        <div className="row">
          <div className="col-xl-12">
            <div className="tp-section-title-wrapper-2 text-center mb-50">
              <span className="tp-section-title-pre-2">
                Shop by Popular <TextShapeLine />
              </span>
              <h3 className="tp-section-title-2">
                Popular on the Shofy store.
              </h3>
            </div>
          </div>
        </div>

        <div className="tp-category-slider-2 p-relative">
          {content}
          <div className="swiper-scrollbar tp-swiper-scrollbar"></div>
        </div>
      </div>
    </section>
  );
};


export default PopularProducts;
