import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { invitation, FAMILY_ROLES, FamilyRole } from "@/lib/db/schema"
import { getUserFamilyRole } from "@/lib/tenant"
import { randomBytes } from "crypto"
import { headers } from "next/headers"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const role = await getUserFamilyRole(session.user.id, id)
  if (role !== "owner" && role !== "parent") {
    return NextResponse.json({ error: "Урих эрхгүй" }, { status: 403 })
  }

  const { email, role: invitedRole } = await request.json()
  if (!email?.trim()) {
    return NextResponse.json({ error: "Email шаардлагатай" }, { status: 400 })
  }
  if (!FAMILY_ROLES.includes(invitedRole)) {
    return NextResponse.json({ error: "Үүрэг буруу" }, { status: 400 })
  }
  if (invitedRole === "owner") {
    return NextResponse.json({ error: "Эзэмшигч урих боломжгүй" }, { status: 400 })
  }

  const token = randomBytes(24).toString("hex")
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 хоног

  const [created] = await db
    .insert(invitation)
    .values({
      familyId: id,
      email: email.trim().toLowerCase(),
      role: invitedRole as FamilyRole,
      token,
      invitedBy: session.user.id,
      expiresAt,
    })
    .returning()

  // Invite URL-ийг runtime-д тодорхойлно: эхлээд BETTER_AUTH_URL (runtime env),
  // байхгүй бол nginx-ээс ирэх Host/Proto-оос. NEXT_PUBLIC_APP_URL нь build үед
  // шигддэг тул ашиглахгүй — ингэснээр IP↔domain шилжихэд rebuild шаардахгүй.
  const reqHeaders = await headers()
  const origin =
    process.env.BETTER_AUTH_URL ||
    `${reqHeaders.get("x-forwarded-proto") ?? "http"}://${reqHeaders.get("host")}`
  const inviteUrl = `${origin}/invite/${token}`

  // TODO: production-д email илгээх. Одоогоор console-д харуулна.
  console.log(`[Invite] To: ${email}, URL: ${inviteUrl}`)

  return NextResponse.json({ ...created, inviteUrl })
}
