import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import VideosExample from "@/components/ui/video/VideosExample";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Videos | Avshdh Organic - Premium Organic & Herbal Products",
  description:
    "This is Next.js Videos page for Avshdh Organic - Next.js Tailwind CSS Admin Dashboard Template",
};

export default function VideoPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Videos" />

      <VideosExample />
    </div>
  );
}
