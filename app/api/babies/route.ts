import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { baby, familyMember } from "@/lib/db/schema"
import { getUserOwnedFamily, getUserFamilyRole } from "@/lib/tenant"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await db
    .select({
      id: baby.id,
      name: baby.name,
      birthDate: baby.birthDate,
      gender: baby.gender,
      avatar: baby.avatar,
      familyId: baby.familyId,
      createdAt: baby.createdAt,
    })
    .from(baby)
    .innerJoin(familyMember, eq(familyMember.familyId, baby.familyId))
    .where(eq(familyMember.userId, session.user.id))
    .orderBy(baby.createdAt)

  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, birthDate, gender, familyId } = await request.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: "Нэр шаардлагатай" }, { status: 400 })
  }

  // Гэр бүлийг сонгох: client өөрөө өгөх эсвэл өөрийн гэр бүл рүү үүсгэх
  let targetFamilyId: string | null = familyId ?? null
  if (targetFamilyId) {
    const role = await getUserFamilyRole(session.user.id, targetFamilyId)
    if (role !== "owner" && role !== "parent") {
      return NextResponse.json({ error: "Хүүхэд нэмэх эрхгүй" }, { status: 403 })
    }
  } else {
    targetFamilyId = await getUserOwnedFamily(session.user.id)
    if (!targetFamilyId) {
      return NextResponse.json({ error: "Гэр бүл олдсонгүй" }, { status: 400 })
    }
  }

  const [created] = await db
    .insert(baby)
    .values({
      familyId: targetFamilyId,
      name: name.trim(),
      birthDate: birthDate || null,
      gender: gender || null,
    })
    .returning()

  return NextResponse.json(created)
}
