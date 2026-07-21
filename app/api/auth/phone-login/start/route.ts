import { NextRequest, NextResponse } from "next/server"
import { randomInt } from "crypto"
import { and, desc, eq, gt } from "drizzle-orm"
import { db } from "@/lib/db"
import { user, phoneLoginChallenge } from "@/lib/db/schema"
import { isValidMongolianPhone } from "@/lib/verify"

// verify.mn "login" RULE-ийн тогтмол утгууд. Одоогоор нэг л shortcode
// байдаг (docs). PREFIX нь RULE үүсгэхэд verify.mn санамсаргүй үүсгэдэг тул
// орчин бүрд өөр байж болно — env-ээр тохируулна.
const SHORTCODE = "144773"
const PREFIX = process.env.VERIFY_MN_LOGIN_PREFIX
const CHALLENGE_TTL_MS = 5 * 60 * 1000

// POST /api/auth/phone-login/start — { phone } → өмнө нь бүртгэлдээ
// баталгаажуулсан утастай хэрэглэгчид 144773 руу илгээх код/зааврыг буцаана.
export async function POST(req: NextRequest) {
  if (!PREFIX) {
    console.error("[phone-login/start] VERIFY_MN_LOGIN_PREFIX тохируулаагүй байна")
    return NextResponse.json({ error: "Дотоод алдаа" }, { status: 500 })
  }

  let body: { phone?: unknown }
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

  // Зөвхөн бүртгэлдээ утсаа баталгаажуулсан хэрэглэгч л утсаараа нэвтэрч чадна.
  const [existingUser] = await db
    .select({ id: user.id, phoneVerified: user.phoneVerified })
    .from(user)
    .where(eq(user.phone, phone))
    .limit(1)

  if (!existingUser || !existingUser.phoneVerified) {
    return NextResponse.json(
      { error: "Энэ дугаараар бүртгэл олдсонгүй. Эхлээд бүртгүүлнэ үү." },
      { status: 404 },
    )
  }

  // Идэвхтэй (PENDING, дуусаагүй) код байвал шинээр үүсгэхгүй, хуучныг ашиглана
  // — дэмий олон код зэрэг хүчинтэй байхаас сэргийлнэ.
  const [existing] = await db
    .select()
    .from(phoneLoginChallenge)
    .where(
      and(
        eq(phoneLoginChallenge.phone, phone),
        eq(phoneLoginChallenge.status, "PENDING"),
        gt(phoneLoginChallenge.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(phoneLoginChallenge.createdAt))
    .limit(1)

  const challenge =
    existing ??
    (
      await db
        .insert(phoneLoginChallenge)
        .values({
          phone,
          code: String(randomInt(100000, 1000000)),
          expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
        })
        .returning()
    )[0]

  const smsText = `${PREFIX}:${challenge.code}`
  return NextResponse.json({
    id: challenge.id,
    shortcode: SHORTCODE,
    text: smsText,
    smsUri: `sms:${SHORTCODE}?body=${encodeURIComponent(smsText)}`,
    displayInstruction: `${SHORTCODE} дугаарт "${smsText}" гэж SMS илгээнэ үү`,
    expiresAt: challenge.expiresAt,
  })
}
