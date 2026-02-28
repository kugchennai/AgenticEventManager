import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  // If no valid session and not on the login page, redirect to unauthorized
  if (!req.auth && req.nextUrl.pathname !== "/") {
    return NextResponse.redirect(new URL("/unauthorized", req.nextUrl.origin));
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|unauthorized).*)",
  ],
};
