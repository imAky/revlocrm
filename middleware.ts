import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "revlo-super-secure-production-ready-secret-key-32chars"
);

const SESSION_COOKIE_NAME = "revlo_session";

// Protected workspace route prefixes
const PROTECTED_ROUTES = [
  "/dashboard",
  "/prospects",
  "/pipeline",
  "/research",
  "/team",
  "/tasks",
  "/activities",
  "/contacts",
  "/custom-fields",
  "/import-export",
  "/audit-logs",
];

// Auth route prefixes
const AUTH_ROUTES = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (sessionToken) {
    try {
      await jwtVerify(sessionToken, JWT_SECRET);
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  // 1. If accessing auth routes (login/signup) while already authenticated, redirect to /dashboard
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 2. If accessing protected routes while not authenticated, redirect to /login
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  if (isProtectedRoute && !isAuthenticated) {
    const returnUrl = encodeURIComponent(pathname + search);
    const loginUrl = new URL(`/login?returnUrl=${returnUrl}`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints like google oauth callback)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
