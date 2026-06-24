import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = [
  "/",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = publicRoutes.some((route) => pathname === route);
  const isStaticAsset =
    pathname.startsWith("/_next") || pathname.startsWith("/favicon");

  if (isPublicRoute || isStaticAsset) {
    return NextResponse.next();
  }

  // Check for Better Auth session cookie
  // In production (HTTPS), Better Auth prefixes the cookie with __Secure-
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__Secure-better-auth.session_token");

  if (!sessionCookie) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callback", pathname); // D-05: callback URL pattern
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
