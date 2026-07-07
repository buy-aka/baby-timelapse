import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { user, verifySession } from "@/lib/db/schema"
import {
  createVerifySession,
  generateSmsCode,
  isValidMongolianPhone,
  VerifyApiError,
} from "@/lib/verify"

// POST /api/verify/start — { phone, email } → verify.mn session үүсгэж,
// хэрэглэгчид 144773 руу илгээх код/зааврыг буцаана.
// Хэрэглэгч SMS-д төлбөр төлөхөөс ӨМНӨ утас/имэйл давхцлыг шалгаж, дэмий
// зардлаас сэргийлнэ.
export async function POST(req: NextRequest) {
  let body: { phone?: unknown; email?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Буруу хүсэлт" }, { status: 400 })
  }

  const phone = String(body.phone ?? "").trim()
  if (!isValidMongolianPhone(phone)) {
    return NextResponse.json(
      { error: "Утасны дугаар буруу байна (8 оронтой)." },
      { status: 400 },
    )
  }

  const email = String(body.email ?? "").trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Имэйл буруу байна." }, { status: 400 })
  }

  // Аль хэдийн бүртгэлтэй дугаар бол шууд мэдэгдэнэ.
  const [existingPhone] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.phone, phone))
    .limit(1)
  if (existingPhone) {
    return NextResponse.json(
      { error: "Энэ дугаар аль хэдийн бүртгэлтэй байна. Нэвтэрнэ үү." },
      { status: 409 },
    )
  }

  // Имэйл давхцлыг эрт шалгана (SMS төлбөр гарахаас өмнө).
  const [existingEmail] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1)
  if (existingEmail) {
    return NextResponse.json(
      { error: "Энэ имэйл аль хэдийн бүртгэлтэй байна. Нэвтэрнэ үү." },
      { status: 409 },
    )
  }

  const code = generateSmsCode()
  try {
    const session = await createVerifySession({ phone, text: code })
    await db.insert(verifySession).values({
      sessionId: session.sessionId,
      phone,
      code,
      status: "PENDING",
      expiresAt: new Date(session.expiresAt),
    })
    return NextResponse.json({
      sessionId: session.sessionId,
      smsUri: session.smsUri,
      displayInstruction: session.displayInstruction,
      shortcode: session.shortcode,
      text: session.text,
      expiresAt: session.expiresAt,
    })
  } catch (e) {
    if (e instanceof VerifyApiError) {
      // API key-г лог-д гаргахгүй — зөвхөн статус.
      console.error(`[verify/start] verify.mn error ${e.status}`)
      return NextResponse.json(
        { error: "Баталгаажуулалтын үйлчилгээнд алдаа гарлаа. Дараа дахин оролдоно уу." },
        { status: 502 },
      )
    }
    console.error("[verify/start]", e)
    return NextResponse.json({ error: "Дотоод алдаа" }, { status: 500 })
  }
}
