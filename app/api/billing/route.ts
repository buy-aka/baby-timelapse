import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getUserOwnedFamily } from "@/lib/tenant"
import { getBillingStatus, resolveSubscription } from "@/lib/billing"

// GET /api/billing — нэвтэрсэн хэрэглэгчийн өөрийн гэр бүлийн захиалгын төлөв.
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const familyId = await getUserOwnedFamily(session.user.id)
  if (!familyId) {
    // Урьсан гишүүн (өөрийн family-гүй) — төлбөрийг зөвхөн эзэмшигч удирдана.
    return NextResponse.json({ isOwner: false })
  }

  // resolveSubscription: идэвхжүүлснээс хойш эхний зураг орсон бол
  // periodEndsAt-г эхний зурагны ойгоор автоматаар бөглөнө.
  const sub = await resolveSubscription(familyId)
  const status = getBillingStatus(sub)
  const now = Date.now()
  const trialDaysLeft =
    status === "trial"
      ? Math.max(0, Math.ceil((sub.trialEndsAt.getTime() - now) / (24 * 60 * 60 * 1000)))
      : 0

  return NextResponse.json({
    isOwner: true,
    status,
    plan: sub.plan,
    trialEndsAt: sub.trialEndsAt,
    trialDaysLeft,
    periodEndsAt: sub.periodEndsAt,
  })
}
