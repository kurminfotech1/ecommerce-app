import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next.js SignUp Page | Avshdh Organic - Premium Organic & Herbal Products",
  description: "This is Next.js SignUp Page Avshdh Organic Dashboard Template",
  // other metadata
};

export default function SignUp() {
  return <SignUpForm />;
}
