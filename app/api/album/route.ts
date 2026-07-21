import { randomBytes } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { desc, eq, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { canUseAlbum, resolveSubscription } from "@/lib/billing"
import { db } from "@/lib/db"
import { albumPhoto } from "@/lib/db/schema"
import { ALBUM_LIMIT_BYTES } from "@/lib/plans"
import { uploadObject } from "@/lib/storage"
import { getUserPrimaryFamily } from "@/lib/tenant"

const PAGE_SIZE = 30

async function getUsedBytes(familyId: string): Promise<number> {
  const [row] = await db
    .select({ used: sql<string>`coalesce(sum(${albumPhoto.size}), 0)` })
    .from(albumPhoto)
    .where(eq(albumPhoto.familyId, familyId))
  return Number(row?.used ?? 0)
}

// Цомгийн жагсаалт + ашиглалт. Зургууд нь гишүүн бүрд харагдана (багц
// дууссан ч үзэх эрх хаагдахгүй); харин enabled=false үед шинээр нэмж
// чадахгүй.
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const familyId = await getUserPrimaryFamily(session.user.id)
  if (!familyId) {
    return NextResponse.json({ enabled: false, usedBytes: 0, limitBytes: ALBUM_LIMIT_BYTES, photos: [], hasMore: false })
  }

  const offset = parseInt(new URL(request.url).searchParams.get("offset") || "0") || 0

  const sub = await resolveSubscription(familyId)
  const enabled = canUseAlbum(sub)
  const usedBytes = await getUsedBytes(familyId)

  const rows = await db
    .select({
      id: albumPhoto.id,
      file_name: albumPhoto.fileName,
      note: albumPhoto.note,
      size: albumPhoto.size,
      created_at: albumPhoto.createdAt,
    })
    .from(albumPhoto)
    .where(eq(albumPhoto.familyId, familyId))
    .orderBy(desc(albumPhoto.createdAt))
    .limit(PAGE_SIZE + 1)
    .offset(offset)

  return NextResponse.json({
    enabled,
    plan: sub.plan,
    usedBytes,
    limitBytes: ALBUM_LIMIT_BYTES,
    photos: rows.slice(0, PAGE_SIZE),
    hasMore: rows.length > PAGE_SIZE,
  })
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const familyId = await getUserPrimaryFamily(session.user.id)
  if (!familyId) return NextResponse.json({ error: "Гэр бүл олдсонгүй" }, { status: 400 })

  const sub = await resolveSubscription(familyId)
  if (!canUseAlbum(sub)) {
    return NextResponse.json(
      { error: "Цомог нь Plus багцын боломж. Тохиргоо → Багц хэсгээс идэвхжүүлнэ үү." },
      { status: 403 },
    )
  }

  const formData = await request.formData()
  const file = formData.get("file") as File
  const note = (formData.get("note") as string) || ""
  if (!file) return NextResponse.json({ error: "file шаардлагатай" }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())

  const usedBytes = await getUsedBytes(familyId)
  if (usedBytes + buffer.byteLength > ALBUM_LIMIT_BYTES) {
    return NextResponse.json(
      { error: "Цомгийн 20GB багтаамж дүүрсэн байна. Зарим зургаа устгаад дахин оролдоно уу." },
      { status: 403 },
    )
  }

  const ext =
    (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) ||
    "jpg"
  const key = `album-${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`

  await uploadObject(key, buffer, file.type || "image/jpeg")

  const [created] = await db
    .insert(albumPhoto)
    .values({
      familyId,
      uploadedBy: session.user.id,
      fileName: key,
      size: buffer.byteLength,
      note: note || null,
    })
    .returning({ id: albumPhoto.id, file_name: albumPhoto.fileName })

  return NextResponse.json({ success: true, ...created })
}
