import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  // Check if user has valid JWT token (from cookie or Authorization header)
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET!,
  });

  // If no valid token, redirect to unauthorized page
  if (!token && req.nextUrl.pathname !== "/") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|unauthorized).*)",
  ],
};
