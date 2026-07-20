import { NextRequest, NextResponse } from "next/server"
import { and, eq, isNull } from "drizzle-orm"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { albumPhoto, baby, babyPhotos, familyMember } from "@/lib/db/schema"
import { getObject } from "@/lib/storage"

// Файл нь тухайн хэрэглэгчийн гэр бүлийн зураг мөн эсэхийг шалгана —
// timelapse (baby_photos) эсвэл цомог (album_photo). Устгагдсан timelapse
// зураг гишүүдэд ч харагдахгүй.
async function userCanViewFile(userId: string, filename: string): Promise<boolean> {
  const [photo] = await db
    .select({ id: babyPhotos.id })
    .from(babyPhotos)
    .innerJoin(baby, eq(babyPhotos.babyId, baby.id))
    .innerJoin(familyMember, eq(familyMember.familyId, baby.familyId))
    .where(and(
      eq(babyPhotos.fileName, filename),
      eq(familyMember.userId, userId),
      isNull(babyPhotos.deletedAt),
    ))
    .limit(1)
  if (photo) return true

  const [album] = await db
    .select({ id: albumPhoto.id })
    .from(albumPhoto)
    .innerJoin(familyMember, eq(familyMember.familyId, albumPhoto.familyId))
    .where(and(
      eq(albumPhoto.fileName, filename),
      eq(familyMember.userId, userId),
    ))
    .limit(1)
  return !!album
}

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const { filename } = await params

  // Эрхгүй ч, байхгүй ч адилхан 404 — файл байгаа эсэхийг задруулахгүй.
  if (!(await userCanViewFile(session.user.id, filename))) {
    return new NextResponse("Not found", { status: 404 })
  }

  try {
    const res = await getObject(filename)
    if (!res.Body) return new NextResponse("Not found", { status: 404 })

    const buffer = Buffer.from(await res.Body.transformToByteArray())
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": res.ContentType || "image/jpeg",
        // private — нэвтрэлт шаарддаг тул зөвхөн тухайн хэрэглэгчийн
        // browser кэшлэнэ, дундын кэш (proxy/CDN) хадгалахгүй.
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    })
  } catch {
    return new NextResponse("Not found", { status: 404 })
  }
}
