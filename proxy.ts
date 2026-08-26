import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, isAuthorized } from "@/lib/auth";

export const config = {
  matcher: ["/outils/:path*", "/api/claude"],
};

export async function proxy(req: NextRequest) {
  if (req.nextUrl.pathname === "/outils/login") {
    return NextResponse.next();
  }

  const authorized = await isAuthorized(req.cookies.get(ADMIN_COOKIE)?.value);
  if (authorized) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/outils/login", req.url);
  loginUrl.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}
