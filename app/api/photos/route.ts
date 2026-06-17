import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { babyPhotos } from "@/lib/db/schema"
import { getUserBabyIds, userCanAccessBaby } from "@/lib/tenant"
import { and, desc, eq, inArray, isNull, lte } from "drizzle-orm"
import { headers } from "next/headers"

const photoColumns = {
  id: babyPhotos.id,
  photo_date: babyPhotos.photoDate,
  file_name: babyPhotos.fileName,
  note: babyPhotos.note,
  created_at: babyPhotos.createdAt,
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get("startDate") || new Date().toISOString().split("T")[0]
  const exactDate = searchParams.get("exactDate")
  const offset = parseInt(searchParams.get("offset") || "0")
  const babyIdParam = searchParams.get("babyId")

  // Хандах эрхтэй baby-уудыг тогтооно
  let babyIds: string[]
  if (babyIdParam) {
    const ok = await userCanAccessBaby(session.user.id, babyIdParam)
    if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    babyIds = [babyIdParam]
  } else {
    babyIds = await getUserBabyIds(session.user.id)
  }

  if (babyIds.length === 0) return NextResponse.json([])

  // Яг тодорхой огноогоор хайх (compare / onthisday горим)
  if (exactDate) {
    const rows = await db
      .select(photoColumns)
      .from(babyPhotos)
      .where(and(
        inArray(babyPhotos.babyId, babyIds),
        eq(babyPhotos.photoDate, exactDate),
        isNull(babyPhotos.deletedAt),
      ))
      .orderBy(desc(babyPhotos.createdAt))
    return NextResponse.json(rows)
  }

  // Хэвийн жагсаалт (grid / feed горим, offset дэмждэг)
  const rows = await db
    .select(photoColumns)
    .from(babyPhotos)
    .where(and(
      inArray(babyPhotos.babyId, babyIds),
      lte(babyPhotos.photoDate, startDate),
      isNull(babyPhotos.deletedAt),
    ))
    .orderBy(desc(babyPhotos.photoDate))
    .limit(10)
    .offset(offset)

  return NextResponse.json(rows)
}
