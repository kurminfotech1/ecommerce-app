"use client";

import React, { useEffect } from 'react';
import { Outfit } from 'next/font/google';
import './globals.css';
import "flatpickr/dist/flatpickr.css";
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Provider } from 'react-redux';
import { store } from '@/redux/store';

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    const updateFavicon = () => {
      fetch('/api/logo')
        .then((res) => res.json())
        .then((json) => {
          const faviconUrl = json?.data?.favicon_url || '/icon.png';
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = faviconUrl;
        })
        .catch((err) => console.error("Failed to fetch favicon:", err));
    };

    updateFavicon();
    window.addEventListener("logo-updated", updateFavicon);
    return () => window.removeEventListener("logo-updated", updateFavicon);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <Provider store={store}>
          <ThemeProvider>
            <ToastContainer />
            <SidebarProvider>{children}</SidebarProvider>
          </ThemeProvider>
        </Provider>
      </body>
    </html>
  );
}
