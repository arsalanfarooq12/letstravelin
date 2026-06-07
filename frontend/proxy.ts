import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/destinations",
  "/hotels",
  "/packages",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic =
    PUBLIC_PATHS.some((p) => pathname === p) ||
    pathname.startsWith("/destinations/") ||
    pathname.startsWith("/hotels/") ||
    pathname.startsWith("/packages/");

  const hasSession = request.cookies.has("lt_access");

  // Redirect logged-in users away from auth pages
  if ((pathname === "/login" || pathname === "/register") && hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect unauthenticated users away from protected pages
  if (!isPublic && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin role check — read profile cookie
  if (pathname.startsWith("/admin")) {
    const profileRaw = request.cookies.get("lt_profile")?.value;
    if (!profileRaw) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    try {
      const profile = JSON.parse(profileRaw);
      if (profile.role !== "ADMIN" && profile.role !== "AGENT") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)",
  ],
};
