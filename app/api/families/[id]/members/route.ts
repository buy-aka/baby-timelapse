import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { familyMember, user, invitation } from "@/lib/db/schema"
import { getUserFamilyRole } from "@/lib/tenant"
import { and, eq, isNull } from "drizzle-orm"
import { headers } from "next/headers"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const role = await getUserFamilyRole(session.user.id, id)
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const members = await db
    .select({
      id: familyMember.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: familyMember.role,
      joinedAt: familyMember.createdAt,
    })
    .from(familyMember)
    .innerJoin(user, eq(user.id, familyMember.userId))
    .where(eq(familyMember.familyId, id))
    .orderBy(familyMember.createdAt)

  const pendingRows = await db
    .select({
      id: invitation.id,
      phone: invitation.phone,
      role: invitation.role,
      token: invitation.token,
      createdAt: invitation.createdAt,
      expiresAt: invitation.expiresAt,
    })
    .from(invitation)
    .where(and(eq(invitation.familyId, id), isNull(invitation.acceptedAt)))
    .orderBy(invitation.createdAt)

  // Урилгын token нь нэгдэх нууц түлхүүр — зөвхөн урих эрхтэй хүнд буцаана
  // (тэд линкийг дахин авч дахин илгээх боломжтой). Бусад гишүүнд нуулт.
  const canInvite = role === "owner" || role === "parent"
  const pending = pendingRows.map((p) => (canInvite ? p : { ...p, token: undefined }))

  return NextResponse.json({ members, pending })
}
