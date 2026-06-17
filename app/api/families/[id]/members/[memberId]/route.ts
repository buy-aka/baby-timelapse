import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { familyMember } from "@/lib/db/schema"
import { getUserFamilyRole } from "@/lib/tenant"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, memberId } = await params

  const role = await getUserFamilyRole(session.user.id, id)
  if (role !== "owner") {
    return NextResponse.json({ error: "Зөвхөн эзэмшигч хасна" }, { status: 403 })
  }

  // owner-ийг өөрийг нь хасахгүй
  const [target] = await db
    .select()
    .from(familyMember)
    .where(and(eq(familyMember.id, memberId), eq(familyMember.familyId, id)))
    .limit(1)

  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (target.role === "owner") {
    return NextResponse.json({ error: "Эзэмшигчийг хасч болохгүй" }, { status: 400 })
  }

  await db.delete(familyMember).where(eq(familyMember.id, memberId))

  return NextResponse.json({ success: true })
}
