import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { babyPhotos } from "@/lib/db/schema"
import { getUserBabyIds } from "@/lib/tenant"
import { and, eq, inArray, isNull, ne } from "drizzle-orm"
import { headers } from "next/headers"

async function userOwnsPhoto(userId: string, photoId: string): Promise<boolean> {
  const babyIds = await getUserBabyIds(userId)
  if (babyIds.length === 0) return false

  const [row] = await db
    .select({ id: babyPhotos.id })
    .from(babyPhotos)
    .where(and(eq(babyPhotos.id, photoId), inArray(babyPhotos.babyId, babyIds)))
    .limit(1)
  return !!row
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  if (!(await userOwnsPhoto(session.user.id, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await db
    .update(babyPhotos)
    .set({ deletedAt: new Date() })
    .where(eq(babyPhotos.id, id))

  return NextResponse.json({ success: true })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  if (!(await userOwnsPhoto(session.user.id, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { note, photo_date } = await request.json()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(photo_date)) {
    return NextResponse.json({ error: "Огнооны формат буруу (YYYY-MM-DD)" }, { status: 400 })
  }

  // Өдөрт 1 зургийн дүрэм огноо солиход ч үйлчилнэ: шинэ огноонд нь
  // өөр (устгаагүй) зураг байвал татгалзана.
  const [photo] = await db
    .select({ babyId: babyPhotos.babyId })
    .from(babyPhotos)
    .where(eq(babyPhotos.id, id))
    .limit(1)
  if (photo) {
    const [conflict] = await db
      .select({ id: babyPhotos.id })
      .from(babyPhotos)
      .where(and(
        eq(babyPhotos.babyId, photo.babyId),
        eq(babyPhotos.photoDate, photo_date),
        ne(babyPhotos.id, id),
        isNull(babyPhotos.deletedAt),
      ))
      .limit(1)
    if (conflict) {
      return NextResponse.json(
        { error: `${photo_date} өдөрт өөр зураг аль хэдийн байна` },
        { status: 409 },
      )
    }
  }

  await db
    .update(babyPhotos)
    .set({ note, photoDate: photo_date })
    .where(eq(babyPhotos.id, id))

  return NextResponse.json({ success: true })
}
