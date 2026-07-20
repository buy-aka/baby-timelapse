// Багцын нэгдсэн тодорхойлолт — landing үнийн хэсэг болон settings-ийн
// багц идэвхжүүлэлт хоёулаа эндээс уншина. Үнэ өөрчлөгдвөл зөвхөн энд засна.

export const TRIAL_DAYS = 7

/* ── Бодитоор мөрддөг хязгаарууд (API талд шалгагдана) ── */

// Эзэмшигчээс гадна урьж болох гишүүдийн тоо (бүх багцад ижил)
export const MAX_INVITED_MEMBERS = 6
// Timelapse: нэг хүүхдэд өдөрт 1 зураг (бүх багцад ижил — бүтээгдэхүүний үндэс)
export const PHOTOS_PER_DAY = 1
// Plus багцын тусдаа цомгийн нийт багтаамж
export const ALBUM_LIMIT_BYTES = 20 * 1024 * 1024 * 1024 // 20GB

export type PlanId = "basic" | "plus"

export type Plan = {
  id: PlanId
  name: string
  tagline: string
  /** 2026 оны эрт дэмжигчийн үнэ (₮/жил) */
  introPriceMnt: number
  /** Хожмын энгийн үнэ (₮/жил) — танилцуулгад харуулна */
  standardPriceMnt: number
  features: string[]
  highlighted: boolean
}

export const PLANS: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    tagline: "Өсөлтийн түүхээ хадгалж эхлэхэд",
    introPriceMnt: 10000,
    standardPriceMnt: 50000,
    features: [
      "Нэг хүүхдийн timelapse — өдөрт 1 зураг",
      "6 хүртэл гэр бүлийн гишүүн урих",
      "7 хоногт 1 удаа бичлэг татах",
      "Зураг найдвартай хадгалалт",
    ],
    highlighted: false,
  },
  {
    id: "plus",
    name: "Plus",
    tagline: "Бүх дурсамжаа нэг дор цуглуулахад",
    introPriceMnt: 20000,
    standardPriceMnt: 100000,
    features: [
      "Basic багцын бүх боломж",
      "Тусдаа цомог — 20GB хүртэл зураг",
      "Өдөрт 1 удаа бичлэг татах",
    ],
    highlighted: true,
  },
]

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id)
}

export function formatMnt(n: number): string {
  return n.toLocaleString("mn-MN").replace(/,/g, " ") + "₮"
}
