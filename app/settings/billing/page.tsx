"use client"

import { useCallback, useEffect, useState } from "react"
import { Check, Copy, CreditCard, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PLANS, formatMnt, type PlanId } from "@/lib/plans"
import { cn } from "@/lib/utils"

interface BillingState {
  isOwner: boolean
  status?: "trial" | "active" | "expired"
  plan?: PlanId | null
  requestedPlan?: PlanId | null
  requestedAmountMnt?: number | null
  paymentReference?: string | null
  trialDaysLeft?: number
  periodEndsAt?: string | null
  bank?: { bank: string; account: string; holder: string } | null
}

// Дуусахаас өмнө хэдэн хоногт "Сунгах" товч идэвхжихийг заана.
const RENEW_WINDOW_DAYS = 30

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingState | null>(null)
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState<PlanId | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

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

  const activate = async (plan: PlanId) => {
    setActivating(plan)
    setError(null)
    try {
      const res = await fetch("/api/billing/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Алдаа гарлаа")
        return
      }
      await load()
    } catch {
      setError("Сүлжээний алдаа")
    } finally {
      setActivating(null)
    }
  }

  const cancelRequest = async () => {
    setError(null)
    try {
      const res = await fetch("/api/billing/activate", { method: "DELETE" })
      if (!res.ok) {
        setError("Цуцлахад алдаа гарлаа")
        return
      }
      await load()
    } catch {
      setError("Сүлжээний алдаа")
    }
  }

  const copyReference = async (ref: string) => {
    try {
      await navigator.clipboard.writeText(ref)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard байхгүй орчин — код харагдаж байгаа тул гараар хуулж болно
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

  const requestedPlanDef = PLANS.find((p) => p.id === billing.requestedPlan)
  const daysToExpiry = billing.periodEndsAt
    ? Math.ceil((new Date(billing.periodEndsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Багц</h2>
        <p className="text-sm text-zinc-500">
          Багцаа идэвхжүүлж хүүхдийнхээ дурсамжийг тасралтгүй хадгалаарай.
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
          {billing.status === "active" && billing.periodEndsAt && (
            <p className="text-zinc-500">
              Дуусах: {new Date(billing.periodEndsAt).toLocaleDateString("mn-MN")}
            </p>
          )}
        </div>
      </div>

      {/* Төлбөр хүлээгдэж буй хүсэлт */}
      {billing.requestedPlan && billing.paymentReference && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-4 text-sm flex flex-col gap-3">
          <p className="font-medium">
            {requestedPlanDef?.name} багцын төлбөр хүлээгдэж байна
          </p>
          {billing.bank ? (
            <div className="grid gap-1.5">
              <Row label="Банк" value={billing.bank.bank} />
              <Row label="Данс" value={billing.bank.account} />
              <Row label="Хүлээн авагч" value={billing.bank.holder} />
              <Row
                label="Дүн"
                value={
                  billing.requestedAmountMnt
                    ? formatMnt(billing.requestedAmountMnt)
                    : requestedPlanDef
                      ? formatMnt(requestedPlanDef.introPriceMnt)
                      : "—"
                }
              />
            </div>
          ) : (
            <p className="text-zinc-600 dark:text-zinc-400">
              Дансны мэдээлэл тун удахгүй байршина — түр хүлээнэ үү.
            </p>
          )}
          <div className="flex items-center gap-2">
            <span className="text-zinc-600 dark:text-zinc-400">Гүйлгээний утга:</span>
            <code className="font-mono font-semibold">{billing.paymentReference}</code>
            <button
              type="button"
              onClick={() => copyReference(billing.paymentReference!)}
              className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              aria-label="Гүйлгээний утгыг хуулах"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            Шилжүүлгийн гүйлгээний утгад дээрх кодыг заавал бичээрэй — төлбөрийг
            ажлын 1 өдөрт багтаан баталгаажуулж, багцыг идэвхжүүлнэ. Өөр багц
            сонговол шинэ код үүсэх тул өмнө нь шилжүүлэг хийсэн бол багцаа бүү
            солиорой.
          </p>
          <button
            type="button"
            onClick={cancelRequest}
            className="self-start text-xs text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            Хүсэлт цуцлах
          </button>
        </div>
      )}

      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}

      {/* Багцууд */}
      <div className="grid gap-4 sm:grid-cols-2">
        {PLANS.map((plan) => {
          const isCurrent = billing.status === "active" && billing.plan === plan.id
          const isRequested = billing.requestedPlan === plan.id
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
                disabled={
                  (isCurrent && !canRenew) || isDowngrade || isRequested || activating !== null
                }
                onClick={() => activate(plan.id)}
              >
                {isRequested
                  ? "Төлбөр хүлээгдэж байна"
                  : activating === plan.id
                    ? "Түр хүлээнэ үү..."
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
        Бүх багц жилээр төлөгдөнө. Асуулт байвал{" "}
        <a href="mailto:info@horom.mn" className="underline">
          info@horom.mn
        </a>{" "}
        хаягаар холбогдоорой.
      </p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
