import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getBillingStatus, getOrCreateSubscription } from "@/lib/billing"
import { db } from "@/lib/db"
import { subscription } from "@/lib/db/schema"
import { getPlan } from "@/lib/plans"
import { getUserOwnedFamily } from "@/lib/tenant"
import { wireCreateCheckoutSession, wireCreatePaymentIntent } from "@/lib/wire"

// POST /api/billing/checkout — { plan } → wire.mn төлбөрийн хуудасны URL.
// Дүн, багц, intent id-г ХҮСЭЛТИЙН АГШИНД захиалгад бинд хийнэ: webhook
// зөвхөн энэ гурвыг тулгаж идэвхжүүлдэг тул "бага дүн төлөөд өндөр багц
// авах" боломжгүй. Шинэ checkout эхлүүлэх бүрд reference солигдоно —
// хуучин (төлөгдөөгүй) checkout хуудас хүчингүй болно.
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

  const amountMnt = plan.introPriceMnt

  let checkoutUrl: string
  try {
    const intent = await wireCreatePaymentIntent({
      amountMnt,
      description: `Horom ${plan.name} багц — 1 жил`,
      metadata: { familyId, plan: plan.id },
    })

    await db
      .update(subscription)
      .set({
        requestedPlan: plan.id,
        requestedAmountMnt: amountMnt,
        paymentReference: intent.id,
        updatedAt: new Date(),
      })
      .where(eq(subscription.id, current.id))

    // Invite route-той адил: origin-ийг runtime env-ээс, байхгүй бол
    // nginx-ийн дамжуулсан толгойноос гаргана.
    const reqHeaders = await headers()
    const origin =
      process.env.BETTER_AUTH_URL ||
      `${reqHeaders.get("x-forwarded-proto") ?? "https"}://${reqHeaders.get("host")}`

    const checkout = await wireCreateCheckoutSession({
      paymentIntentId: intent.id,
      successUrl: `${origin}/settings/billing?paid=1`,
      cancelUrl: `${origin}/settings/billing`,
    })
    checkoutUrl = checkout.url
  } catch (e) {
    console.error("[billing/checkout] wire алдаа:", e)
    return NextResponse.json(
      { error: "Төлбөрийн систем түр хариу өгсөнгүй. Дахин оролдоно уу." },
      { status: 502 },
    )
  }

  return NextResponse.json({ url: checkoutUrl })
}
