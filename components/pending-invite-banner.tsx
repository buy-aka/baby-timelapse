"use client"

import { useEffect, useState } from "react"
import { Users, Check } from "lucide-react"
import { Button } from "./ui/button"

type PendingInvite = {
  token: string
  role: string
  familyId: string
  familyName: string
  invitedByName: string
}

const ROLE_LABEL: Record<string, string> = {
  parent: "Эцэг/Эх",
  member: "Гишүүн",
  viewer: "Үзэгч",
}

// Хэрэглэгчийн утсаар нь хүлээж буй гэр бүлийн урилга байвал дээр нь
// «Нэгдэх» санал харуулна. (Хүүхэдгүй хэрэглэгчийг chat layout шууд
// урилгын хуудас руу чиглүүлдэг тул энэ banner голдуу аль хэдийн
// гишүүн/зурагтай хэрэглэгчид зориулагдана.)
export function PendingInviteBanner() {
  const [invites, setInvites] = useState<PendingInvite[]>([])
  const [joining, setJoining] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/invites/pending")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => Array.isArray(data) && setInvites(data))
      .catch(() => {})
  }, [])

  const join = async (token: string) => {
    setJoining(token)
    const res = await fetch(`/api/invites/${token}`, { method: "POST" })
    if (res.ok) {
      // Гэр бүл/хүүхэд шинэчлэгдэхийн тулд хуудсыг дахин ачаална.
      window.location.reload()
    } else {
      setJoining(null)
    }
  }

  if (invites.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {invites.map((inv) => (
        <div
          key={inv.token}
          className="flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Users size={17} />
          </span>
          <p className="flex-1 min-w-0 text-sm text-emerald-900 dark:text-emerald-200">
            <strong>{inv.invitedByName}</strong> таныг{" "}
            <strong>{inv.familyName}</strong> гэр бүлд{" "}
            <strong>{ROLE_LABEL[inv.role] ?? inv.role}</strong> болгон урьжээ.
          </p>
          <Button size="sm" onClick={() => join(inv.token)} disabled={joining === inv.token}>
            <Check size={14} className="mr-1" />
            {joining === inv.token ? "Нэгдэж байна..." : "Нэгдэх"}
          </Button>
        </div>
      ))}
    </div>
  )
}
