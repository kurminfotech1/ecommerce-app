import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Skip Next.js internal and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|css|js|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  const publicRoutes = ["/signin", "/"];

  const isPublic = publicRoutes.some((route) =>
    pathname === route
  );

  if (token && (pathname === "/" || pathname === "/signin")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isPublic && !token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
