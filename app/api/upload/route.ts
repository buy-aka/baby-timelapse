import { randomBytes } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { and, eq, isNull } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { getBillingStatus, resolveSubscription } from "@/lib/billing"
import { db } from "@/lib/db"
import { babyPhotos } from "@/lib/db/schema"
import { uploadObject } from "@/lib/storage"
import { getBabyFamilyId, getUserDefaultBaby, userCanAccessBaby } from "@/lib/tenant"
import { headers } from "next/headers"

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File
  const note = (formData.get("note") as string) || ""
  const photoDate = formData.get("photoDate") as string
  const babyIdInput = formData.get("babyId") as string | null

  if (!file || !photoDate) {
    return NextResponse.json({ error: "file болон photoDate шаардлагатай" }, { status: 400 })
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(photoDate)) {
    return NextResponse.json({ error: "Огнооны формат буруу (YYYY-MM-DD)" }, { status: 400 })
  }

  // Аль baby-ийн зураг болохыг тогтооно
  let babyId: string | null
  if (babyIdInput) {
    const ok = await userCanAccessBaby(session.user.id, babyIdInput)
    if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    babyId = babyIdInput
  } else {
    babyId = await getUserDefaultBaby(session.user.id)
  }

  if (!babyId) {
    return NextResponse.json({ error: "Baby олдсонгүй" }, { status: 400 })
  }

  // Багцын хугацаа дууссан бол шинэ зураг нэмэхийг хориглоно (үзэх хэвээрээ).
  const familyId = await getBabyFamilyId(babyId)
  if (familyId) {
    const sub = await resolveSubscription(familyId)
    if (getBillingStatus(sub) === "expired") {
      return NextResponse.json(
        { error: "Багцын хугацаа дууссан. Тохиргоо → Багц хэсгээс идэвхжүүлнэ үү." },
        { status: 403 },
      )
    }
  }

  // Timelapse-ийн үндэс: нэг хүүхдэд өдөрт 1 зураг.
  const [existing] = await db
    .select({ id: babyPhotos.id })
    .from(babyPhotos)
    .where(and(
      eq(babyPhotos.babyId, babyId),
      eq(babyPhotos.photoDate, photoDate),
      isNull(babyPhotos.deletedAt),
    ))
    .limit(1)
  if (existing) {
    return NextResponse.json(
      { error: `${photoDate} өдөрт зураг аль хэдийн орсон байна` },
      { status: 409 },
    )
  }

  // Өргөтгөлийг цэвэрлэж, санамсаргүй suffix нэмнэ — batch/зэрэгцээ upload-д
  // Date.now() мөргөлдөхөөс сэргийлэхийн зэрэгцээ URL таагдахааргүй болно.
  const ext =
    (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) ||
    "jpg"
  const key = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())
  await uploadObject(key, buffer, file.type || "image/jpeg")

  await db.insert(babyPhotos).values({
    babyId,
    uploadedBy: session.user.id,
    photoDate,
    fileName: key,
    note,
  })

  return NextResponse.json({ success: true, fileName: key })
}
