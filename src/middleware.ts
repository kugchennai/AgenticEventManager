import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const isSecure = req.nextUrl.protocol === "https:";

  // Try the secure cookie name first (production), then fallback (dev)
  let token = await getToken({
    req,
    secret: process.env.AUTH_SECRET!,
    cookieName: isSecure
      ? "__Secure-authjs.session-token"
      : "authjs.session-token",
  });

  // Fallback: try the other cookie name in case of mismatch
  if (!token) {
    token = await getToken({
      req,
      secret: process.env.AUTH_SECRET!,
      cookieName: isSecure
        ? "authjs.session-token"
        : "__Secure-authjs.session-token",
    });
  }

  // If no valid token, redirect to unauthorized page
  if (!token && req.nextUrl.pathname !== "/") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|unauthorized|docs).*)",
  ],
};
