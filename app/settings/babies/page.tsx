"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Check, X, Baby as BabyIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface Baby {
  id: string
  name: string
  birthDate: string | null
  gender: string | null
  avatar: string | null
  familyId: string
}

export default function BabiesPage() {
  const [babies, setBabies] = useState<Baby[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch("/api/babies")
    setBabies(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const remove = async (id: string) => {
    if (!confirm("Энэ хүүхдийг устгах уу? (Зурагтай бол боломжгүй)")) return
    const res = await fetch(`/api/babies/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error || "Алдаа гарлаа")
      return
    }
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Хүүхдүүд</h2>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus size={14} className="mr-1" />
            Нэмэх
          </Button>
        )}
      </div>

      {adding && (
        <BabyForm
          onCancel={() => setAdding(false)}
          onSaved={() => { setAdding(false); load() }}
        />
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Уншиж байна...</p>
      ) : babies.length === 0 && !adding ? (
        <div className="text-center py-12 text-zinc-500">
          <BabyIcon size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Хүүхэд бүртгэгдээгүй байна</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {babies.map((b) => editingId === b.id ? (
            <BabyForm
              key={b.id}
              initial={b}
              onCancel={() => setEditingId(null)}
              onSaved={() => { setEditingId(null); load() }}
            />
          ) : (
            <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <BabyIcon size={18} className="text-zinc-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{b.name}</p>
                <p className="text-xs text-zinc-500">
                  {b.birthDate ? new Date(b.birthDate).toLocaleDateString("mn-MN") : "Огноо ороогүй"}
                  {b.gender && <> · {b.gender === "male" ? "Хүү" : "Охин"}</>}
                </p>
              </div>
              <button
                onClick={() => setEditingId(b.id)}
                className="w-8 h-8 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-500"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => remove(b.id)}
                className="w-8 h-8 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 flex items-center justify-center text-zinc-500"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BabyForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: Baby
  onSaved: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name || "")
  const [birthDate, setBirthDate] = useState(initial?.birthDate || "")
  const [gender, setGender] = useState(initial?.gender || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    if (!name.trim()) { setError("Нэр шаардлагатай"); return }
    setSaving(true)
    setError(null)

    const url = initial ? `/api/babies/${initial.id}` : "/api/babies"
    const method = initial ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, birthDate: birthDate || null, gender: gender || null }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || "Алдаа гарлаа")
      setSaving(false)
      return
    }

    onSaved()
  }

  return (
    <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 mb-3">
      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <Label className="text-xs">Нэр</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Хүүхдийн нэр" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs">Төрсөн өдөр</Label>
            <Input type="date" value={birthDate || ""} onChange={(e) => setBirthDate(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Хүйс</Label>
            <div className="flex gap-1.5 h-9">
              <button
                type="button"
                onClick={() => setGender(gender === "male" ? "" : "male")}
                className={`flex-1 rounded-md border text-xs ${gender === "male" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-zinc-200 dark:border-zinc-700"}`}
              >Хүү</button>
              <button
                type="button"
                onClick={() => setGender(gender === "female" ? "" : "female")}
                className={`flex-1 rounded-md border text-xs ${gender === "female" ? "border-pink-500 bg-pink-50 dark:bg-pink-900/20" : "border-zinc-200 dark:border-zinc-700"}`}
              >Охин</button>
            </div>
          </div>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={saving} className="flex-1">
            <Check size={13} className="mr-1" />
            {saving ? "Хадгалж байна..." : "Хадгалах"}
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel} className="flex-1">
            <X size={13} className="mr-1" />
            Болих
          </Button>
        </div>
      </div>
    </div>
  )
}
