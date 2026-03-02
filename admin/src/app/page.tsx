import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";
import Image from "next/image";
import React from "react";


export const metadata: Metadata = {
  title: "Avshdh Organic - Premium Organic Products",
  description: "Avshdh Organic Admin Panel",
};
  
export default function SignIn() {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col dark:bg-gray-900 sm:p-0">
        <SignInForm />
        <div className="lg:w-1/2 w-full h-full hidden lg:block relative">
          <Image
             src="/images/logo/login-page-bg.png"
            alt="Login Background"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </div>
  );
}
