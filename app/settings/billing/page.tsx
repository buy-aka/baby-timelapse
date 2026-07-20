"use client"

import { useCallback, useEffect, useState } from "react"
import { Check, CreditCard, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PLANS, formatMnt, type PlanId } from "@/lib/plans"
import { cn } from "@/lib/utils"

interface BillingState {
  isOwner: boolean
  status?: "trial" | "active" | "expired"
  plan?: PlanId | null
  trialDaysLeft?: number
  periodEndsAt?: string | null
}

// Дуусахаас өмнө хэдэн хоногт "Сунгах" товч идэвхжихийг заана.
const RENEW_WINDOW_DAYS = 30

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingState | null>(null)
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState<PlanId | null>(null)
  const [justPaid, setJustPaid] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/billing")
      if (res.ok) setBilling(await res.json())
      else setError("Мэдээлэл ачаалахад алдаа гарлаа")
    } catch {
      setError("Сүлжээний алдаа")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // wire.mn-ээс ?paid=1-тэй буцаж ирэхэд webhook хэдхэн секунд хоцорч
  // болзошгүй тул төлөв шинэчлэгдэхийг хэсэг хугацаанд давтан шалгана.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("paid") !== "1") return
    setJustPaid(true)
    window.history.replaceState(null, "", "/settings/billing")
    let n = 0
    const timer = setInterval(() => {
      n++
      load()
      if (n >= 10) clearInterval(timer)
    }, 2000)
    return () => clearInterval(timer)
  }, [load])

  // Багц идэвхжүүлэх = wire.mn-ий төлбөрийн хуудас руу шилжинэ.
  const activate = async (plan: PlanId) => {
    setActivating(plan)
    setError(null)
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Алдаа гарлаа")
        setActivating(null)
        return
      }
      window.location.href = data.url
    } catch {
      setError("Сүлжээний алдаа")
      setActivating(null)
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Ачаалж байна...</p>
  }

  if (!billing) {
    return <p role="alert" className="text-sm text-red-500">{error ?? "Алдаа гарлаа"}</p>
  }

  if (!billing.isOwner) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-2">Багц</h2>
        <p className="text-sm text-zinc-500">
          Багцын тохиргоог зөвхөн гэр бүлийн эзэмшигч удирдана. Гэр бүлийнхээ
          эзэмшигчээс лавлана уу.
        </p>
      </div>
    )
  }

  const statusLabel =
    billing.status === "active"
      ? `${billing.plan === "plus" ? "Plus" : "Basic"} багц идэвхтэй`
      : billing.status === "trial"
        ? `Үнэгүй туршилт — ${billing.trialDaysLeft} хоног үлдсэн`
        : billing.plan
          ? "Багцын хугацаа дууссан — сунгаарай"
          : "Туршилтын хугацаа дууссан"

  const daysToExpiry = billing.periodEndsAt
    ? Math.ceil((new Date(billing.periodEndsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Багц</h2>
        <p className="text-sm text-zinc-500">
          Багцаа идэвхжүүлж хүүхдийнхээ дурсамжийг тасралтгүй хадгалаарай.
          Багцын хугацаа хүүхдийн эхний зураг оруулсан өдрөөс эхлэн жилээр
          тоологдоно.
        </p>
      </div>

      {/* Одоогийн төлөв */}
      <div
        className={cn(
          "rounded-xl border p-4 flex items-center gap-3",
          billing.status === "expired"
            ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
            : "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
        )}
      >
        <CreditCard size={18} className="shrink-0" />
        <div className="text-sm">
          <p className="font-medium">{statusLabel}</p>
          {billing.status === "active" &&
            (billing.periodEndsAt ? (
              <p className="text-zinc-500">
                Дуусах: {new Date(billing.periodEndsAt).toLocaleDateString("mn-MN")}
              </p>
            ) : (
              <p className="text-zinc-500">
                Хугацаа эхний зураг оруулсан өдрөөс эхэлж 1 жил үргэлжилнэ.
              </p>
            ))}
        </div>
      </div>

      {justPaid && (
        <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">
          {billing.status === "active"
            ? "Төлбөр амжилттай — багц идэвхжлээ ✓"
            : "Төлбөр амжилттай хийгдлээ ✓ Багц хэдхэн секундэд идэвхжинэ..."}
        </p>
      )}
      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}

      {/* Багцууд */}
      <div className="grid gap-4 sm:grid-cols-2">
        {PLANS.map((plan) => {
          const isCurrent = billing.status === "active" && billing.plan === plan.id
          const isUpgrade =
            billing.status === "active" && billing.plan === "basic" && plan.id === "plus"
          // Plus идэвхтэй үед Basic руу буулгахыг UI-аас хориглоно (API ч хориглодог).
          const isDowngrade =
            billing.status === "active" && billing.plan === "plus" && plan.id === "basic"
          // Дуусахад ойртсон идэвхтэй багцаа сунгаж болно.
          const canRenew =
            isCurrent && daysToExpiry !== null && daysToExpiry <= RENEW_WINDOW_DAYS
          return (
            <div
              key={plan.id}
              className={cn(
                "rounded-2xl border p-5 flex flex-col gap-4",
                plan.highlighted
                  ? "border-emerald-600 dark:border-emerald-500"
                  : "border-zinc-200 dark:border-zinc-800"
              )}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{plan.name}</h3>
                  {plan.highlighted && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      <Sparkles size={11} />
                      Санал болгож буй
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-500 mt-0.5">{plan.tagline}</p>
              </div>

              <div>
                <span className="text-2xl font-bold">{formatMnt(plan.introPriceMnt)}</span>
                <span className="text-sm text-zinc-500"> /жил</span>
                <p className="text-xs text-zinc-500 mt-0.5">
                  2026 оны эрт дэмжигчийн үнэ · энгийн үнэ{" "}
                  {formatMnt(plan.standardPriceMnt)}
                </p>
              </div>

              <ul className="flex flex-col gap-1.5 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full mt-auto"
                variant={plan.highlighted ? "default" : "outline"}
                disabled={(isCurrent && !canRenew) || isDowngrade || activating !== null}
                onClick={() => activate(plan.id)}
              >
                {activating === plan.id
                  ? "Төлбөрийн хуудас руу шилжиж байна..."
                  : canRenew
                    ? "Сунгах"
                    : isCurrent
                      ? "Одоогийн багц"
                      : isDowngrade
                        ? "Plus идэвхтэй"
                        : isUpgrade
                          ? "Plus руу ахиулах"
                          : "Идэвхжүүлэх"}
              </Button>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-zinc-500">
        Төлбөр wire.mn-ээр аюулгүй хийгдэнэ — QR код эсвэл банкныхаа аппаар
        төлнө. Асуулт байвал{" "}
        <a href="mailto:info@horom.mn" className="underline">
          info@horom.mn
        </a>{" "}
        хаягаар холбогдоорой.
      </p>
    </div>
  )
}
