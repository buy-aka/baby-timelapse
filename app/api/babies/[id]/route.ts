import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { baby } from "@/lib/db/schema"
import { userCanAccessBaby, getUserFamilyRole } from "@/lib/tenant"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"

async function loadBabyIfAccessible(userId: string, babyId: string) {
  if (!(await userCanAccessBaby(userId, babyId))) return null
  const [row] = await db.select().from(baby).where(eq(baby.id, babyId)).limit(1)
  return row ?? null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const row = await loadBabyIfAccessible(session.user.id, id)
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(row)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const existing = await loadBabyIfAccessible(session.user.id, id)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const role = await getUserFamilyRole(session.user.id, existing.familyId)
  if (role !== "owner" && role !== "parent") {
    return NextResponse.json({ error: "Засах эрхгүй" }, { status: 403 })
  }

  const { name, birthDate, gender, avatar } = await request.json()

  await db
    .update(baby)
    .set({
      ...(name !== undefined && { name: name?.trim() }),
      ...(birthDate !== undefined && { birthDate: birthDate || null }),
      ...(gender !== undefined && { gender: gender || null }),
      ...(avatar !== undefined && { avatar: avatar || null }),
      updatedAt: new Date(),
    })
    .where(eq(baby.id, id))

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const existing = await loadBabyIfAccessible(session.user.id, id)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const role = await getUserFamilyRole(session.user.id, existing.familyId)
  if (role !== "owner") {
    return NextResponse.json({ error: "Зөвхөн эзэмшигч устгана" }, { status: 403 })
  }

  // baby_photos дээр ON DELETE RESTRICT тул зураг байвал устгахгүй
  try {
    await db.delete(baby).where(eq(baby.id, id))
  } catch {
    return NextResponse.json(
      { error: "Энэ хүүхдийн зургуудыг устгасны дараа л устгана" },
      { status: 409 }
    )
  }

  return NextResponse.json({ success: true })
}
