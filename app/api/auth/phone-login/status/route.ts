import { NextRequest, NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { phoneLoginChallenge } from "@/lib/db/schema"
import { auth } from "@/lib/auth"

// GET /api/auth/phone-login/status?id=... — client-ийн 3с тутмын polling.
// app/api/sms/check (verify.mn callback) status-ыг VERIFIED болгосны дараа
// ЭНД (хэрэглэгчийн browser-т шууд хариулж байгаа хүсэлт дээр) session
// үүсгэж cookie тавина — учир нь зөвхөн энэ хүсэлт нь browser-тэй холбоотой.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "id шаардлагатай" }, { status: 400 })
  }

  const [challenge] = await db
    .select()
    .from(phoneLoginChallenge)
    .where(eq(phoneLoginChallenge.id, id))
    .limit(1)

  if (!challenge) {
    return NextResponse.json({ error: "Олдсонгүй" }, { status: 404 })
  }

  if (challenge.status === "CONSUMED") {
    // Session нь энэ endpoint-ийн өмнөх polling дуудлагаар аль хэдийн үүссэн.
    return NextResponse.json({ status: "VERIFIED" })
  }

  if (challenge.status === "EXPIRED" || challenge.expiresAt < new Date()) {
    if (challenge.status !== "EXPIRED") {
      await db
        .update(phoneLoginChallenge)
        .set({ status: "EXPIRED" })
        .where(eq(phoneLoginChallenge.id, id))
    }
    return NextResponse.json({ status: "EXPIRED" })
  }

  if (challenge.status === "PENDING") {
    return NextResponse.json({ status: "PENDING" })
  }

  // status === "VERIFIED" — атомик VERIFIED→CONSUMED шилжилтээр session-ийг
  // яг нэг л удаа үүсгэнэ (хэрэглэгч давхар tab нээх/хурдан дараалсан
  // polling-оос сэргийлнэ).
  const [claimed] = await db
    .update(phoneLoginChallenge)
    .set({ status: "CONSUMED" })
    .where(and(eq(phoneLoginChallenge.id, id), eq(phoneLoginChallenge.status, "VERIFIED")))
    .returning()

  if (!claimed) {
    // Өөр хүсэлт зэрэг claim хийчихсэн — session бас үүссэн байх ёстой.
    return NextResponse.json({ status: "VERIFIED" })
  }

  try {
    const authRes = await auth.api.completePhoneLogin({
      body: { phone: claimed.phone },
      asResponse: true,
    })

    const nextRes = NextResponse.json({ status: "VERIFIED" })
    for (const cookie of authRes.headers.getSetCookie()) {
      nextRes.headers.append("set-cookie", cookie)
    }
    return nextRes
  } catch (e) {
    console.error("[phone-login/status] session үүсгэхэд алдаа гарлаа", e)
    return NextResponse.json({ error: "Нэвтрэхэд алдаа гарлаа" }, { status: 500 })
  }
}
