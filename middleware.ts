import { NextResponse, type NextRequest } from "next/server";

import {
  SESSION_COOKIE_NAME,
  SESSION_ROLE_COOKIE_NAME,
} from "@/lib/session";

const PLAYER_PREFIXES = [
  "/dashboard",
  "/catalog",
  "/stocks",
  "/orders",
  "/treasury",
  "/alerts",
  "/simulation",
  "/profile",
] as const;

function startsWithAny(pathname: string, prefixes: readonly string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const role = request.cookies.get(SESSION_ROLE_COOKIE_NAME)?.value;

  const isLogin = pathname === "/login" || pathname.startsWith("/login/");
  const isAdminArea = pathname === "/admin" || pathname.startsWith("/admin/");
  const isPlayerArea = startsWithAny(pathname, PLAYER_PREFIXES);

  if (isLogin) {
    if (token && role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (token && role === "user") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (isAdminArea) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (isPlayerArea) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (role && role !== "user") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/login/:path*",
    "/admin",
    "/admin/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/catalog",
    "/catalog/:path*",
    "/stocks",
    "/stocks/:path*",
    "/orders",
    "/orders/:path*",
    "/treasury",
    "/treasury/:path*",
    "/alerts",
    "/alerts/:path*",
    "/simulation",
    "/simulation/:path*",
    "/profile",
    "/profile/:path*",
  ],
};
