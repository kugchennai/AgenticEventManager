import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/settings/logo?variant=light|dark
 * Serves the stored logo as a real image (not base64).
 * This is a PUBLIC endpoint — no auth required so email clients can fetch the image.
 * Responds with proper Content-Type and caching headers.
 */
export async function GET(req: NextRequest) {
  const variant = req.nextUrl.searchParams.get("variant") ?? "light";
  const key = variant === "dark" ? "logo_dark" : "logo_light";

  const setting = await prisma.appSetting.findUnique({ where: { key } });

  if (!setting?.value) {
    return new NextResponse(null, { status: 404 });
  }

  const dataUri = setting.value;

  // Parse the data URI: data:image/png;base64,iVBOR...
  const match = dataUri.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
  if (!match) {
    return new NextResponse(null, { status: 404 });
  }

  const contentType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, "base64");

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      "Content-Length": buffer.length.toString(),
    },
  });
}
