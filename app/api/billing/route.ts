import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getUserOwnedFamily } from "@/lib/tenant"
import { getBankDetails, getBillingStatus, getOrCreateSubscription } from "@/lib/billing"

// GET /api/billing — нэвтэрсэн хэрэглэгчийн өөрийн гэр бүлийн захиалгын төлөв.
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const familyId = await getUserOwnedFamily(session.user.id)
  if (!familyId) {
    // Урьсан гишүүн (өөрийн family-гүй) — төлбөрийг зөвхөн эзэмшигч удирдана.
    return NextResponse.json({ isOwner: false })
  }

  const sub = await getOrCreateSubscription(familyId)
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
    requestedPlan: sub.requestedPlan,
    requestedAmountMnt: sub.requestedPlan ? sub.requestedAmountMnt : null,
    paymentReference: sub.requestedPlan ? sub.paymentReference : null,
    trialEndsAt: sub.trialEndsAt,
    trialDaysLeft,
    periodEndsAt: sub.periodEndsAt,
    bank: sub.requestedPlan ? getBankDetails() : null,
  })
}
