import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { invitation, family, familyMember, user } from "@/lib/db/schema"
import { getFamilyMemberCount } from "@/lib/tenant"
import { MAX_INVITED_MEMBERS } from "@/lib/plans"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const [inv] = await db
    .select({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      familyId: invitation.familyId,
      familyName: family.name,
      invitedByName: user.name,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
    })
    .from(invitation)
    .innerJoin(family, eq(family.id, invitation.familyId))
    .innerJoin(user, eq(user.id, invitation.invitedBy))
    .where(eq(invitation.token, token))
    .limit(1)

  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (inv.acceptedAt) return NextResponse.json({ error: "Хүлээн зөвшөөрсөн" }, { status: 409 })
  if (inv.expiresAt < new Date()) return NextResponse.json({ error: "Хугацаа дууссан" }, { status: 410 })

  return NextResponse.json(inv)
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { token } = await params

  const [inv] = await db
    .select()
    .from(invitation)
    .where(eq(invitation.token, token))
    .limit(1)

  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (inv.acceptedAt) return NextResponse.json({ error: "Хүлээн зөвшөөрсөн" }, { status: 409 })
  if (inv.expiresAt < new Date()) return NextResponse.json({ error: "Хугацаа дууссан" }, { status: 410 })

  // Аль хэдийн гишүүн байгаа эсэхийг шалгана
  const [existing] = await db
    .select()
    .from(familyMember)
    .where(and(
      eq(familyMember.familyId, inv.familyId),
      eq(familyMember.userId, session.user.id),
    ))
    .limit(1)

  if (!existing) {
    // Урилга үүссэнээс хойш гишүүд нэмэгдсэн байж болзошгүй — эндээс
    // (эрх олгох агшинд) хязгаарыг дахин шалгана.
    const memberCount = await getFamilyMemberCount(inv.familyId)
    if (memberCount >= 1 + MAX_INVITED_MEMBERS) {
      return NextResponse.json(
        { error: `Гэр бүлийн гишүүдийн дээд хязгаарт хүрсэн байна (${MAX_INVITED_MEMBERS} гишүүн)` },
        { status: 403 },
      )
    }
    await db.insert(familyMember).values({
      familyId: inv.familyId,
      userId: session.user.id,
      role: inv.role,
    })
  }

  await db
    .update(invitation)
    .set({ acceptedAt: new Date() })
    .where(eq(invitation.id, inv.id))

  return NextResponse.json({ success: true, familyId: inv.familyId })
}
