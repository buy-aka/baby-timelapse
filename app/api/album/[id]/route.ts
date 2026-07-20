import { NextRequest, NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { albumPhoto, familyMember } from "@/lib/db/schema"
import { deleteObject } from "@/lib/storage"

// Цомгийн зургийг бүрмөсөн устгана (мөр + storage объект) — квот үнэн
// зөв үлдэж, диск чөлөөлөгдөнө.
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const [photo] = await db
    .select({ id: albumPhoto.id, fileName: albumPhoto.fileName })
    .from(albumPhoto)
    .innerJoin(familyMember, eq(familyMember.familyId, albumPhoto.familyId))
    .where(and(eq(albumPhoto.id, id), eq(familyMember.userId, session.user.id)))
    .limit(1)

  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.delete(albumPhoto).where(eq(albumPhoto.id, id))
  // Storage-ийн алдаа устгалтыг бүхэлд нь унагахгүй — мөр устсан тул
  // квотод тооцогдохоо больсон; объект нь orphan болж үлдэж болно.
  try {
    await deleteObject(photo.fileName)
  } catch (e) {
    console.error("[album] storage delete failed:", photo.fileName, e)
  }

  return NextResponse.json({ success: true })
}
