import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { AUTH_COOKIE_NAME } from "./lib/auth/constants";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "7-forge-inc-secret-key-1234567890-a-very-long-and-secure-one"
);

export async function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

  const isLoginPage = nextUrl.pathname === "/login";
  const isDashboardPage = nextUrl.pathname === "/" || nextUrl.pathname.startsWith("/") && !nextUrl.pathname.startsWith("/api") && !nextUrl.pathname.startsWith("/_next") && !nextUrl.pathname.startsWith("/favicon.ico");

  // Development mode bypass: Skip authentication if in dev mode or DEVELOPER_MODE is enabled
  const isDevBypass = process.env.NODE_ENV === "development" || process.env.DEVELOPER_MODE === "true";

  if (isDevBypass) {
    return NextResponse.next();
  }

  if (isDashboardPage && !isLoginPage) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    try {
      await jwtVerify(token, secret);
    } catch {
      // Token expired or invalid
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.delete(AUTH_COOKIE_NAME);
      return response;
    }
  }

  if (isLoginPage && token) {
    try {
      await jwtVerify(token, secret);
      return NextResponse.redirect(new URL("/", req.url));
    } catch {
      // Ignore if token is invalid on login page
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
