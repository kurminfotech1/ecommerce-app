import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
// internal
import SEO from "@/components/seo";
import Wrapper from "@/layout/wrapper";
import HeaderTwo from "@/layout/headers/header-2";
import Footer from "@/layout/footers/footer";
import ProfileArea from "@/components/my-account/profile-area";
import { getUserOrders } from "@/redux/features/order/orderApi";
import Loader from "@/components/loader/loader";

const ProfilePage = () => {
  const router = useRouter();
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const isAuthenticate = Cookies.get("userInfo");
    if (!isAuthenticate) {
      router.push("/login");
    } else {
      const fetchOrders = async () => {
        try {
          const data = await getUserOrders();
          setOrderData(data);
          setIsLoading(false);
        } catch (error) {
          console.error("Error fetching orders:", error);
          setIsError(true);
          setIsLoading(false);
        }
      };
      fetchOrders();
    }
  }, [router]);

  if (isLoading) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ height: "100vh" }}
      >
        <Loader loading={isLoading} />
      </div>
    );
  }

  return (
    <Wrapper>
      <SEO pageTitle="Profile" />
      <HeaderTwo style_2={true} />
      <ProfileArea orderData={orderData} />
      <Footer style_2={true} />
    </Wrapper>
  );
};

export default ProfilePage;
