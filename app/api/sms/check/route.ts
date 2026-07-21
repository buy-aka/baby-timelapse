import { NextRequest, NextResponse } from "next/server"
import { and, eq, gt } from "drizzle-orm"
import { db } from "@/lib/db"
import { phoneLoginChallenge } from "@/lib/db/schema"

// verify.mn-ий "login" RULE-ийн callback. Хэрэглэгч 144773 руу
// "<PREFIX>:<CODE>" илгээх бүрд GET хүсэлт эндрүү ирнэ. Body байхгүй,
// 3 секундэд багтаан 2xx буцаах ёстой (docs). Зөвхөн мэдэгдэл — жинхэнэ
// session-ийг browser-ийн polling (app/api/auth/phone-login/status) үүсгэнэ,
// учир нь энэ хүсэлт нь verify.mn-ий сервер рүү ирж байгаа бөгөөд
// хэрэглэгчийн browser-тэй ямар ч холбоогүй (cookie тавьж чадахгүй).

// Callback зөвхөн эдгээр 2 IP-ээс дуудагдана (verify.mn docs). Бусад эх
// үүсвэрээс ирвэл 403 буцаана — хуурамч дуудлагаас хамгаалах цорын ганц далд.
const ALLOWED_CALLBACK_IPS = ["3.34.8.248", "13.124.219.192"]

function getClientIp(req: NextRequest): string | null {
  // nginx: `proxy_set_header X-Real-IP $remote_addr` — үргэлж жинхэнэ холбогдсон
  // IP-ээр дарж бичдэг тул client спуф хийж чадахгүй (deploy/nginx/conf.d/app.conf).
  const realIp = req.headers.get("x-real-ip")
  if (realIp) return realIp.trim()
  const forwardedFor = req.headers.get("x-forwarded-for")
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? null
  return null
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req)
  if (!ip || !ALLOWED_CALLBACK_IPS.includes(ip)) {
    console.error(`[sms/check] Зөвшөөрөгдөөгүй эх үүсвэрээс хүсэлт ирлээ: ${ip}`)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = req.nextUrl
  const phone = searchParams.get("phone")
  const text = searchParams.get("text")
  const requestId = searchParams.get("requestId")

  if (!phone || !text) {
    return NextResponse.json({ error: "Буруу хүсэлт" }, { status: 400 })
  }

  // "<PREFIX>:<CODE>" форматаас кодыг салгана. ":" байхгүй бол манай формат биш.
  const separatorIdx = text.indexOf(":")
  if (separatorIdx === -1) {
    return NextResponse.json({ ok: true })
  }
  const code = text.slice(separatorIdx + 1).trim()

  // Зөвхөн PENDING, хугацаа дуусаагүй challenge-тэй таарвал VERIFIED болгоно.
  // Таараагүй ч 200 буцаана — verify.mn-д дахин оролдуулах шаардлагагүй
  // (алдаа биш, зүгээр манай систем хүлээж байсан код биш гэсэн үг).
  await db
    .update(phoneLoginChallenge)
    .set({ status: "VERIFIED", verifiedAt: new Date(), requestId })
    .where(
      and(
        eq(phoneLoginChallenge.phone, phone),
        eq(phoneLoginChallenge.code, code),
        eq(phoneLoginChallenge.status, "PENDING"),
        gt(phoneLoginChallenge.expiresAt, new Date()),
      ),
    )

  return NextResponse.json({ ok: true })
}
