import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getUserOwnedFamily } from "@/lib/tenant"
import {
  cancelPlanRequest,
  getBankDetails,
  getBillingStatus,
  getOrCreateSubscription,
  requestPlan,
} from "@/lib/billing"
import { getPlan } from "@/lib/plans"

// POST /api/billing/activate — { plan } → багц идэвхжүүлэх/ахиулах хүсэлт.
// Төлбөрийн gateway хараахан холбогдоогүй тул шилжүүлгийн заавар + гүйлгээний
// утга буцаана; төлбөр баталгаажмагц гараар идэвхжинэ.
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

  // Идэвхтэй Plus-тай бол ахиулах юм алга; ижил багц руу "ахиулах" нь сунгалт
  // тул зөвшөөрнө (дараагийн жилийн төлбөр).
  if (status === "active" && current.plan === "plus" && plan.id === "basic") {
    return NextResponse.json(
      { error: "Plus багцаас Basic руу буулгах бол бидэнтэй холбогдоно уу." },
      { status: 400 },
    )
  }

  const sub = await requestPlan(familyId, plan)

  return NextResponse.json({
    requestedPlan: sub.requestedPlan,
    paymentReference: sub.paymentReference,
    amountMnt: sub.requestedAmountMnt,
    bank: getBankDetails(),
  })
}

// DELETE /api/billing/activate — хүлээгдэж буй хүсэлтийг цуцлана.
export async function DELETE() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const familyId = await getUserOwnedFamily(session.user.id)
  if (!familyId) {
    return NextResponse.json(
      { error: "Багцыг зөвхөн гэр бүлийн эзэмшигч удирдана." },
      { status: 403 },
    )
  }

  await cancelPlanRequest(familyId)
  return NextResponse.json({ ok: true })
}
