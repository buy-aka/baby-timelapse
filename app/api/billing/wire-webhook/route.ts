import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { activatePlan } from "@/lib/billing"
import { db } from "@/lib/db"
import { subscription } from "@/lib/db/schema"
import { getPlan } from "@/lib/plans"
import { verifyWireSignature, wireGetPaymentIntent } from "@/lib/wire"

// wire.mn-ий webhook (dashboard → Webhook → энэ URL-ийг бүртгэнэ).
// Гурван давхар хамгаалалт:
//   1. IP — wire зөвхөн доорх хаягаас илгээдэг (dashboard-д зарласан)
//   2. HMAC — WirePayment-Signature толгойг signing secret-ээр шалгана
//   3. Дахин унших — event-ийн payload-д итгэхгүй, intent-ийг wire API-ээс
//      өөрөөс нь татаж status/amount-ийг тулгана
// Идэвхжүүлэлт paymentReference-ийг атомоор цэвэрлэж "эзэмшдэг" тул нэг
// төлбөр давхар илгээгдсэн ч (retry) нэг л удаа идэвхжинэ.

const WIRE_WEBHOOK_IPS = ["65.109.117.186"]

function getClientIp(req: NextRequest): string | null {
  // nginx: X-Real-IP-г үргэлж жинхэнэ холбогдсон IP-ээр дарж бичдэг
  // (app/api/sms/check-тэй ижил зарчим).
  const realIp = req.headers.get("x-real-ip")
  if (realIp) return realIp.trim()
  const forwardedFor = req.headers.get("x-forwarded-for")
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? null
  return null
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  if (!ip || !WIRE_WEBHOOK_IPS.includes(ip)) {
    console.error(`[wire-webhook] Зөвшөөрөгдөөгүй IP: ${ip}`)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Гарын үсэг raw body дээр тооцогддог — заавал text-ээр уншина.
  const rawBody = await req.text()

  const secret = process.env.WIRE_WEBHOOK_SECRET
  if (!secret) {
    // Endpoint-ийг dashboard-д бүртгэх үеийн баталгаажуулалт secret
    // тохируулахаас ӨМНӨ ирдэг тул 200 буцаана, гэхдээ юу ч идэвхжүүлэхгүй.
    console.warn("[wire-webhook] WIRE_WEBHOOK_SECRET тохируулагдаагүй — event-ийг боловсруулсангүй")
    return NextResponse.json({ received: true })
  }

  if (!verifyWireSignature(rawBody, req.headers.get("wirepayment-signature"), secret)) {
    console.error("[wire-webhook] Гарын үсэг буруу")
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  let event: { type?: string; data?: { object?: { id?: unknown }; id?: unknown } }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (event.type !== "payment_intent.succeeded") {
    return NextResponse.json({ received: true })
  }

  const intentId = event.data?.object?.id ?? event.data?.id
  if (typeof intentId !== "string" || !intentId) {
    console.error("[wire-webhook] Event-ээс intent id олдсонгүй")
    return NextResponse.json({ received: true })
  }

  // Итгэхээсээ өмнө шалга: intent-ийг wire-ээс өөрөөс нь дахин уншина.
  const intent = await wireGetPaymentIntent(intentId)
  if (intent.status !== "succeeded") {
    console.warn(`[wire-webhook] ${intentId} статус '${intent.status}' — алгаслаа`)
    return NextResponse.json({ received: true })
  }

  // Атом claim: reference таарсан нэг л мөрийг цэвэрлэж авна. Давхар
  // хүргэлт (retry/зэрэгцээ) хоёр дахь удаад юу ч олохгүй.
  const [claimed] = await db
    .update(subscription)
    .set({ paymentReference: null, updatedAt: new Date() })
    .where(eq(subscription.paymentReference, intentId))
    .returning()

  if (!claimed) {
    // Аль хэдийн боловсруулсан эсвэл манайд хамаагүй intent.
    return NextResponse.json({ received: true })
  }

  const plan = claimed.requestedPlan ? getPlan(claimed.requestedPlan) : undefined
  if (!plan || claimed.requestedAmountMnt !== intent.amount) {
    console.error(
      `[wire-webhook] АНХААР: ${intentId} — дүн/багц зөрүүтэй ` +
        `(хүссэн: ${claimed.requestedPlan}/${claimed.requestedAmountMnt}₮, төлсөн: ${intent.amount}₮), ` +
        `family=${claimed.familyId}. Гараар шалгана уу.`,
    )
    return NextResponse.json({ received: true })
  }

  try {
    await activatePlan(claimed.familyId, plan)
    console.log(
      `[wire-webhook] ${plan.id} багц идэвхжлээ: family=${claimed.familyId}, intent=${intentId}, ${intent.amount}₮`,
    )
  } catch (e) {
    // Claim аль хэдийн хийгдсэн тул retry дахин идэвхжүүлэхгүй — заавал логт үлдээнэ.
    console.error(
      `[wire-webhook] АНХААР: төлбөр орсон ч идэвхжүүлж чадсангүй! ` +
        `family=${claimed.familyId}, plan=${plan.id}, intent=${intentId}:`,
      e,
    )
  }

  return NextResponse.json({ received: true })
}
