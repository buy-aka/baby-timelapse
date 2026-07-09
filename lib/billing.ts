import { and, asc, eq, isNull } from "drizzle-orm"
import { db } from "@/lib/db"
import { baby, babyPhotos, subscription, type Subscription } from "@/lib/db/schema"
import { TRIAL_DAYS, type Plan } from "@/lib/plans"

// ТӨЛБӨРИЙН ОДООГИЙН ГОРИМ: төлбөрийн gateway-тэй гэрээ хийгдээгүй тул багц
// ТӨЛБӨРГҮЙ ШУУД идэвхжинэ. Гэрээ хийгдмэгц энэ модульд төлбөрийн алхам
// нэмэгдэнэ (schema-ийн requestedPlan/requestedAmountMnt/paymentReference
// багануудыг түүнд зориулж үлдээсэн).
//
// Багцын жилийн тооллого: ГЭР БҮЛИЙН ЭХНИЙ ЗУРАГ ОРУУЛСАН ӨДРӨӨС эхэлнэ.
// Жишээ: өнөөдөр бүртгүүлээд 3 сарын 3-нд эхний зургаа оруулбал багц дараа
// жилийн 3 сарын 3-нд дуусна. Идэвхжүүлэх үед зураг байхгүй бол
// periodEndsAt = null (цаг эхлээгүй) — эхний зураг ормогц дараагийн
// billing уншилтад автоматаар бөглөгдөнө (resolveSubscription).

// Захиалгын төлөв огноонуудаас гарна (schema.ts-ийн тайлбарыг үз).
export type BillingStatus = "trial" | "active" | "expired"

export function getBillingStatus(sub: Subscription, now = new Date()): BillingStatus {
  // plan тавигдсан ба (цаг эхлээгүй ЭСВЭЛ хугацаа дуусаагүй) → идэвхтэй
  if (sub.plan && (!sub.periodEndsAt || sub.periodEndsAt > now)) return "active"
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

// Захиалгыг уншиж, шаардлагатай бол periodEndsAt-г нөхөж бөглөнө:
// идэвхжүүлснээс ХОЙШ эхний зураг орсон бол цагийг тэр өдрөөс эхлүүлнэ.
export async function resolveSubscription(familyId: string): Promise<Subscription> {
  let sub = await getOrCreateSubscription(familyId)
  if (sub.plan && !sub.periodEndsAt) {
    const firstPhotoAt = await getFirstPhotoAt(familyId)
    if (firstPhotoAt) {
      const [updated] = await db
        .update(subscription)
        .set({ periodEndsAt: nextAnniversary(firstPhotoAt), updatedAt: new Date() })
        .where(and(eq(subscription.id, sub.id), isNull(subscription.periodEndsAt)))
        .returning()
      if (updated) sub = updated
    }
  }
  return sub
}

// Багц идэвхжүүлэх / ахиулах / сунгах. Төлбөргүй горимд шууд идэвхжинэ.
export async function activatePlan(familyId: string, plan: Plan): Promise<Subscription> {
  const sub = await getOrCreateSubscription(familyId)
  const now = new Date()
  const status = getBillingStatus(sub, now)

  let periodEndsAt: Date | null
  if (status === "active" && sub.plan === plan.id && sub.periodEndsAt) {
    // Сунгалт: ой тогтсон өдрөө хадгалж 1 жил нэмнэ.
    periodEndsAt = addYears(sub.periodEndsAt, 1)
  } else if (status === "active" && sub.plan && sub.periodEndsAt) {
    // Идэвхтэй хугацаандаа өөр багц руу шилжих (Basic→Plus):
    // дуусах өдөр хэвээрээ, зөвхөн багц солигдоно.
    periodEndsAt = sub.periodEndsAt
  } else {
    // Шинэ идэвхжүүлэлт (туршилт/дууссан): эхний зурагны ойгоор тоолно.
    // Зураг байхгүй бол null — эхний зураг ормогц цаг эхэлнэ.
    const firstPhotoAt = await getFirstPhotoAt(familyId)
    periodEndsAt = firstPhotoAt ? nextAnniversary(firstPhotoAt, now) : null
  }

  const [updated] = await db
    .update(subscription)
    .set({
      plan: plan.id,
      periodEndsAt,
      // Хуучин төлбөрийн-хүсэлт горимын үлдэгдлийг цэвэрлэнэ.
      requestedPlan: null,
      requestedAmountMnt: null,
      paymentReference: null,
      updatedAt: new Date(),
    })
    .where(eq(subscription.id, sub.id))
    .returning()
  return updated
}

// Гэр бүлийн хамгийн анхны (устгаагүй) зурагны оруулсан огноо.
async function getFirstPhotoAt(familyId: string): Promise<Date | null> {
  const [row] = await db
    .select({ createdAt: babyPhotos.createdAt })
    .from(babyPhotos)
    .innerJoin(baby, eq(babyPhotos.babyId, baby.id))
    .where(and(eq(baby.familyId, familyId), isNull(babyPhotos.deletedAt)))
    .orderBy(asc(babyPhotos.createdAt))
    .limit(1)
  return row ? new Date(row.createdAt) : null
}

function addYears(d: Date, n: number): Date {
  const r = new Date(d)
  r.setFullYear(r.getFullYear() + n)
  return r
}

// anchor-ийн дараагийн (ирээдүйн) ой. Шинэхэн зурагны хувьд anchor + 1 жил;
// олон сарын өмнөх зурагтай бол одоогоос хойших хамгийн ойрын ой —
// "жил бүр эхний зурагны өдрөөр дуусна" гэсэн зарчим хадгалагдана.
function nextAnniversary(anchor: Date, now = new Date()): Date {
  let end = addYears(anchor, 1)
  while (end <= now) end = addYears(end, 1)
  return end
}
