import React,{useEffect, useState} from "react";
import ErrorMsg from "../common/error-msg";
import CouponItem from "./coupon-item";
import { getOfferCoupons } from "@/redux/features/coupon/couponApi";
import CouponLoader from "../loader/coupon-loader";

const CouponArea = () => {
  const [copiedCode, setCopiedCode] = useState("");
  const [copied, setCopied] = useState(false);
 const [couponData,setCouponData]=useState(null);
 const [isLoading,setIsLoading]=useState(true);
 const [isError,setIsError]=useState(false);

  useEffect(() => {
    const loadCoupons = async () => {
      try {
        const data = await getOfferCoupons();
        setCouponData(data || []);
      console.log("dcfsdf",data);
      
      } catch {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadCoupons();
  }, []);

  const handleCopied = (code) => {
    setCopiedCode(code);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

 
  // decide what to render
  let content = null;

  if (isLoading) {
    content = <CouponLoader loading={isLoading}/>;
  }

  if (!isLoading && isError) {
    content = <ErrorMsg msg="There was an error" />;
  }

  if (!isLoading && !isError && couponData?.length === 0) {
    content = <ErrorMsg msg="No Coupons found!" />;
  }

  if (!isLoading && !isError && couponData?.length > 0) {
    const coupon_items = couponData;
    // const coupon_items = offerCoupons.slice(0, 2);
    content = coupon_items.map((coupon) => (
      <div key={coupon._id} className="col-xl-6">
        <CouponItem
          coupon={coupon}
          handleCopied={handleCopied}
          copied={copied}
          copiedCode={copiedCode}
        />
      </div>
    ));
  }
  return (
    <>
      <div className="tp-coupon-area pb-120">
        <div className="container">
          <div className="row">{content}</div>
        </div>
      </div>
    </>
  );
};

export default CouponArea;
