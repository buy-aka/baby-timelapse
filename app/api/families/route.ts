import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { family, familyMember } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await db
    .select({
      id: family.id,
      name: family.name,
      ownerId: family.ownerId,
      role: familyMember.role,
      createdAt: family.createdAt,
    })
    .from(family)
    .innerJoin(familyMember, eq(familyMember.familyId, family.id))
    .where(eq(familyMember.userId, session.user.id))
    .orderBy(family.createdAt)

  return NextResponse.json(rows)
}
