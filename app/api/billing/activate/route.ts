import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getUserOwnedFamily } from "@/lib/tenant"
import { activatePlan, getBillingStatus, getOrCreateSubscription } from "@/lib/billing"
import { getPlan } from "@/lib/plans"

// POST /api/billing/activate — { plan } → багц идэвхжүүлэх/ахиулах/сунгах.
// Төлбөрийн gateway хараахан холбогдоогүй тул шууд идэвхжинэ (lib/billing.ts).
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const familyId = await getUserOwnedFamily(session.user.id)
  if (!familyId) {
    return NextResponse.json(
      { error: "Багцыг зөвхөн гэр бүлийн эзэмшигч удирдана." },
      { status: 403 },
    )
  }

  let body: { plan?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Буруу хүсэлт" }, { status: 400 })
  }

  const plan = getPlan(String(body.plan ?? ""))
  if (!plan) {
    return NextResponse.json({ error: "Багц олдсонгүй" }, { status: 400 })
  }

  const current = await getOrCreateSubscription(familyId)
  const status = getBillingStatus(current)

  if (status === "active" && current.plan === "plus" && plan.id === "basic") {
    return NextResponse.json(
      { error: "Plus багцаас Basic руу буулгах бол бидэнтэй холбогдоно уу." },
      { status: 400 },
    )
  }

  const sub = await activatePlan(familyId, plan)

  return NextResponse.json({
    plan: sub.plan,
    periodEndsAt: sub.periodEndsAt,
  })
}
