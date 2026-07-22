"use client"

import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { Phone, X, Send, Copy, Check, Share2, Link2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface Family {
  id: string
  name: string
  ownerId: string
  role: string
}

interface Member {
  id: string
  userId: string
  name: string
  email: string
  image: string | null
  role: string
  joinedAt: string
}

interface PendingInvite {
  id: string
  phone: string | null
  role: string
  token?: string | null
  createdAt: string
  expiresAt: string
}

const ROLE_LABEL: Record<string, string> = {
  owner: "Эзэмшигч",
  parent: "Эцэг/Эх",
  member: "Гишүүн",
  viewer: "Үзэгч",
}

// Урилгын холбоос + QR + хуулах/хуваалцах — шинэ ба хүлээгдэж буй урилгад хоёуланд.
function InviteLinkBox({ url }: { url: string }) {
  const [qr, setQr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    QRCode.toDataURL(url, { width: 220, margin: 1, color: { dark: "#123f31", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(null))
  }, [url])

  const copy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Гэр бүлийн урилга",
          text: "Horom дээр хүүхдийн өсөлтийн дурсамжид нэгдээрэй:",
          url,
        })
      } catch {
        /* хэрэглэгч болих */
      }
    } else {
      copy()
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
      <p className="text-xs text-zinc-500 text-center">
        Доорх QR эсвэл холбоосыг урьж буй хүндээ илгээгээрэй
      </p>
      {qr && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qr} alt="Урилгын QR код" width={180} height={180} className="rounded-lg" />
      )}
      <div className="flex items-center gap-2 w-full">
        <code className="flex-1 text-xs truncate text-zinc-600 dark:text-zinc-300 px-2 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800">
          {url}
        </code>
        <button
          onClick={copy}
          className="w-8 h-8 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0"
          aria-label="Холбоос хуулах"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <Button size="sm" variant="outline" className="w-full" onClick={share}>
        <Share2 size={13} className="mr-1.5" />
        Хуваалцах
      </Button>
    </div>
  )
}

export default function FamilyPage() {
  const [families, setFamilies] = useState<Family[]>([])
  const [activeFamily, setActiveFamily] = useState<Family | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [pending, setPending] = useState<PendingInvite[]>([])
  const [invitePhone, setInvitePhone] = useState("")
  const [inviteRole, setInviteRole] = useState<"parent" | "member" | "viewer">("member")
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null)
  const [openInviteId, setOpenInviteId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/families").then(r => r.json()).then((data: Family[]) => {
      setFamilies(data)
      if (data.length > 0) setActiveFamily(data[0])
    })
  }, [])

  useEffect(() => {
    if (!activeFamily) return
    fetch(`/api/families/${activeFamily.id}/members`).then(r => r.json()).then((data) => {
      setMembers(data.members || [])
      setPending(data.pending || [])
    })
  }, [activeFamily])

  const sendInvite = async () => {
    if (!activeFamily || !invitePhone.trim()) return
    setError(null)
    const res = await fetch(`/api/families/${activeFamily.id}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: invitePhone, role: inviteRole }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || "Алдаа гарлаа")
      return
    }
    const data = await res.json()
    setLastInviteUrl(data.inviteUrl)
    setInvitePhone("")
    const m = await fetch(`/api/families/${activeFamily.id}/members`).then(r => r.json())
    setPending(m.pending || [])
  }

  const removeMember = async (memberId: string) => {
    if (!activeFamily) return
    if (!confirm("Гишүүнийг хасах уу?")) return
    const res = await fetch(`/api/families/${activeFamily.id}/members/${memberId}`, { method: "DELETE" })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error || "Алдаа гарлаа")
      return
    }
    const m = await fetch(`/api/families/${activeFamily.id}/members`).then(r => r.json())
    setMembers(m.members || [])
  }

  // Урилгын token-оос бүтэн холбоос үүсгэнэ (одоогийн домэйнээр).
  const inviteUrlFor = (token: string) =>
    `${window.location.origin}/invite/${token}`

  if (!activeFamily) {
    return <p className="text-sm text-zinc-500">Гэр бүл олдсонгүй</p>
  }

  const canInvite = activeFamily.role === "owner" || activeFamily.role === "parent"
  const canRemove = activeFamily.role === "owner"

  return (
    <div className="flex flex-col gap-6">
      {families.length > 1 && (
        <div className="grid gap-1.5">
          <Label className="text-xs">Гэр бүл</Label>
          <select
            value={activeFamily.id}
            onChange={(e) => setActiveFamily(families.find(f => f.id === e.target.value) || null)}
            className="h-9 rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 text-sm"
          >
            {families.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-1">{activeFamily.name}</h2>
        <p className="text-xs text-zinc-500">Таны үүрэг: <strong>{ROLE_LABEL[activeFamily.role]}</strong></p>
      </div>

      {/* Members */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Гишүүд</h3>
        <div className="flex flex-col gap-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-semibold text-zinc-600">
                {m.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.name}</p>
                <p className="text-xs text-zinc-500 truncate">{m.email}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800">{ROLE_LABEL[m.role]}</span>
              {canRemove && m.role !== "owner" && (
                <button
                  onClick={() => removeMember(m.id)}
                  className="w-8 h-8 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 flex items-center justify-center text-zinc-400"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Pending invites */}
      {pending.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Урилга хүлээж буй</h3>
          <div className="flex flex-col gap-2">
            {pending.map(p => (
              <div key={p.id} className="flex flex-col gap-3 p-3 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-zinc-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{p.phone || "Дугааргүй"}</p>
                    <p className="text-xs text-zinc-500">
                      {ROLE_LABEL[p.role]} · {new Date(p.expiresAt).toLocaleDateString("mn-MN")}-нд дуусна
                    </p>
                  </div>
                  {canInvite && p.token && (
                    <button
                      onClick={() => setOpenInviteId(openInviteId === p.id ? null : p.id)}
                      className="flex items-center gap-1.5 text-xs font-medium text-brand hover:underline shrink-0"
                    >
                      <Link2 size={13} />
                      {openInviteId === p.id ? "Хаах" : "Холбоос"}
                    </button>
                  )}
                </div>
                {canInvite && p.token && openInviteId === p.id && (
                  <InviteLinkBox url={inviteUrlFor(p.token)} />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Invite form */}
      {canInvite && (
        <section className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold mb-3">Урих</h3>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">Утасны дугаар</Label>
              <Input
                type="tel"
                inputMode="numeric"
                placeholder="99xxxxxx"
                value={invitePhone}
                onChange={(e) => setInvitePhone(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Үүрэг</Label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "parent" | "member" | "viewer")}
                className="h-9 rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 text-sm"
              >
                <option value="parent">Эцэг/Эх (засах, нэмэх)</option>
                <option value="member">Гишүүн (нэмэх)</option>
                <option value="viewer">Үзэгч (зөвхөн харах)</option>
              </select>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button size="sm" onClick={sendInvite}>
              <Send size={13} className="mr-1" />
              Урилга үүсгэх
            </Button>

            {lastInviteUrl && <InviteLinkBox url={lastInviteUrl} />}
          </div>
        </section>
      )}
    </div>
  )
}
