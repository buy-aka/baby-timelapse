import { auth } from "@/lib/auth"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // auth болон public route-уудыг алгасна
  if (
    pathname === "/" ||
    pathname === "/terms" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/verify") ||
    pathname.startsWith("/api/sms") ||
    // wire.mn-ий сервер cookie-гүй дууддаг — IP + HMAC-аар өөрөө хамгаалагдана.
    pathname === "/api/billing/wire-webhook" ||
    pathname.startsWith("/uploads") ||
    pathname === "/favicon.ico" ||
    // PWA assets — cookie-гүй татагддаг тул auth шалгалтаас чөлөөлнө.
    // (sw.js-ийн хувьд redirect нь бүртгэлийг шууд унагадаг тул заавал.)
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js" ||
    pathname === "/offline.html"
  ) {
    return NextResponse.next()
  }

  const session = await auth.api.getSession({ headers: request.headers })

  if (!session) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
