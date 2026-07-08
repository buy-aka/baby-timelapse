import { randomBytes } from "crypto"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { subscription, type Subscription } from "@/lib/db/schema"
import { TRIAL_DAYS, type Plan } from "@/lib/plans"

// Захиалгын төлөв огноонуудаас гарна (schema.ts-ийн тайлбарыг үз).
export type BillingStatus = "trial" | "active" | "expired"

export function getBillingStatus(sub: Subscription, now = new Date()): BillingStatus {
  if (sub.plan && sub.periodEndsAt && sub.periodEndsAt > now) return "active"
  if (sub.trialEndsAt > now) return "trial"
  return "expired"
}

// Гэр бүлийн захиалгыг буцаана; байхгүй бол одооноос TRIAL_DAYS хоногийн
// туршилттайгаар үүсгэнэ. Ингэснээр хуучин бүртгэлтэй гэр бүлүүд ч анх
// хандахдаа бүрэн туршилтын хугацаа авна (migration/backfill шаардахгүй).
export async function getOrCreateSubscription(familyId: string): Promise<Subscription> {
  const [existing] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.familyId, familyId))
    .limit(1)
  if (existing) return existing

  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000)
  const [created] = await db
    .insert(subscription)
    .values({ familyId, trialEndsAt })
    .onConflictDoNothing({ target: subscription.familyId })
    .returning()
  if (created) return created

  // Зэрэгцээ хүсэлт түрүүлж үүсгэсэн байна — дахин уншина.
  const [raced] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.familyId, familyId))
    .limit(1)
  return raced
}

// Багц идэвхжүүлэх/ахиулах хүсэлт: шилжүүлгийн гүйлгээний утга болох
// давтагдашгүй код үүсгэж requestedPlan + дүнг тэмдэглэнэ. Төлбөр
// баталгаажмагц (гараар, DEPLOY.md-ийн SQL) plan руу шилжүүлнэ.
//
// Аюулгүй байдлын гол дүрмүүд:
//  - Дүнг хүсэлтийн агшинд БААЗАД тогтооно — админ банкны хуулгын дүнг
//    үүнтэй тулгадаг тул "Basic-ийн дүн төлөөд Plus авах" боломжгүй.
//  - Багц ӨӨРЧЛӨГДВӨЛ reference ШИНЭЧЛЭГДЭНЭ — хуучин кодтой шилжүүлэг
//    шинэ хүсэлттэй хэзээ ч таарахгүй.
//  - Transaction + FOR UPDATE — зэрэгцээ хүсэлтүүд нэг кодод нийлнэ.
export async function requestPlan(familyId: string, plan: Plan): Promise<Subscription> {
  await getOrCreateSubscription(familyId)
  return db.transaction(async (tx) => {
    const [sub] = await tx
      .select()
      .from(subscription)
      .where(eq(subscription.familyId, familyId))
      .for("update")
      .limit(1)

    // Ижил багцын давтан хүсэлт кодоо хадгална (idempotent);
    // өөр багц эсвэл шинэ хүсэлт — шинэ код.
    const reference =
      sub.requestedPlan === plan.id && sub.paymentReference
        ? sub.paymentReference
        : generateReference()

    const [updated] = await tx
      .update(subscription)
      .set({
        requestedPlan: plan.id,
        requestedAmountMnt: plan.introPriceMnt,
        paymentReference: reference,
        updatedAt: new Date(),
      })
      .where(eq(subscription.id, sub.id))
      .returning()
    return updated
  })
}

// Хүлээгдэж буй хүсэлтийг цуцална (төлбөр хийгдээгүй үед л утга учиртай).
export async function cancelPlanRequest(familyId: string): Promise<void> {
  await db
    .update(subscription)
    .set({
      requestedPlan: null,
      requestedAmountMnt: null,
      paymentReference: null,
      updatedAt: new Date(),
    })
    .where(eq(subscription.familyId, familyId))
}

function generateReference(): string {
  // Ойлгомжтой, залхуугүй бичигдэх код: HRM-XXXXXX (0/O, 1/I андуурагдахгүй)
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const bytes = randomBytes(6)
  let code = ""
  for (const b of bytes) code += alphabet[b % alphabet.length]
  return `HRM-${code}`
}

// Дансны мэдээлэл — env-ээс. Тавигдаагүй бол UI "тун удахгүй" гэж харуулна.
export function getBankDetails() {
  const bank = process.env.BILLING_BANK_NAME
  const account = process.env.BILLING_BANK_ACCOUNT
  const holder = process.env.BILLING_BANK_HOLDER
  if (!bank || !account || !holder) return null
  return { bank, account, holder }
}
