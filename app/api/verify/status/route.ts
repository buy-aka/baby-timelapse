import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { verifySession } from "@/lib/db/schema"
import { getVerifySession, VerifyApiError } from "@/lib/verify"

// GET /api/verify/status?sessionId=... — verify.mn-ээс статус шалгаж, DB-г
// шинэчилнэ. Зөвхөн энэ route status-ыг VERIFIED болгодог тул бүртгэлийн
// баталгаажуулалт найдвартай (client шууд өөрчилж чадахгүй).
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId")
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId шаардлагатай" }, { status: 400 })
  }

  // Зөвхөн бидний үүсгэсэн session-ыг шалгана (open proxy болгохгүй).
  const [row] = await db
    .select({ status: verifySession.status })
    .from(verifySession)
    .where(eq(verifySession.sessionId, sessionId))
    .limit(1)
  if (!row) {
    return NextResponse.json({ error: "Session олдсонгүй" }, { status: 404 })
  }

  try {
    const status = await getVerifySession(sessionId)

    if (status.sessionStatus === "VERIFIED" && row.status !== "VERIFIED") {
      await db
        .update(verifySession)
        .set({
          status: "VERIFIED",
          verifiedAt: status.verifiedAt ? new Date(status.verifiedAt) : new Date(),
        })
        .where(eq(verifySession.sessionId, sessionId))
    } else if (status.sessionStatus === "EXPIRED" && row.status !== "EXPIRED") {
      await db
        .update(verifySession)
        .set({ status: "EXPIRED" })
        .where(eq(verifySession.sessionId, sessionId))
    }

    return NextResponse.json({
      sessionStatus: status.sessionStatus,
      expiresAt: status.expiresAt,
    })
  } catch (e) {
    if (e instanceof VerifyApiError) {
      if (e.status === 404) {
        return NextResponse.json({ error: "Session олдсонгүй" }, { status: 404 })
      }
      if (e.status === 429) {
        // Хэт ойр polling — client 3с тутам дуудвал тохиолдохгүй.
        return NextResponse.json({ error: "Түр хүлээгээд дахин оролдоно уу." }, { status: 429 })
      }
      console.error(`[verify/status] verify.mn error ${e.status}`)
      return NextResponse.json({ error: "Баталгаажуулалтын алдаа" }, { status: 502 })
    }
    console.error("[verify/status]", e)
    return NextResponse.json({ error: "Дотоод алдаа" }, { status: 500 })
  }
}
