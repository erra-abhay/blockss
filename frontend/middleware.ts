import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)", "/api/:path*"],
};

export function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const token = req.cookies.get("token")?.value;
  const isAuthenticated = !!token;

  // Allow public pages
  if (nextUrl.pathname === "/" || nextUrl.pathname.startsWith("/verify") || nextUrl.pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  // Protect all other pages (dashboard etc)
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
}
