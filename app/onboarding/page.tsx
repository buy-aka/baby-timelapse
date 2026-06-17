"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Baby as BabyIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [gender, setGender] = useState<"" | "male" | "female">("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError("Нэр оруулна уу"); return }

    setLoading(true)
    setError(null)

    const res = await fetch("/api/babies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, birthDate: birthDate || null, gender: gender || null }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || "Алдаа гарлаа")
      setLoading(false)
      return
    }

    router.push("/chat")
  }

  return (
    <div className="min-h-svh flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
              <BabyIcon size={20} className="text-pink-600 dark:text-pink-400" />
            </div>
            <CardTitle className="text-2xl">Хүүхдээ нэмье</CardTitle>
          </div>
          <CardDescription>
            Бид хүүхдийн зургуудыг хадгалж байна. Эхлэхийн тулд хүүхдийнхээ мэдээллийг оруулна уу.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Хүүхдийн нэр <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                placeholder="Жишээ: Бат-Эрдэнэ"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="birthDate">Төрсөн өдөр</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Хүйс</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGender(gender === "male" ? "" : "male")}
                  className={`flex-1 h-10 rounded-md border text-sm transition-colors ${
                    gender === "male"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  Хүү
                </button>
                <button
                  type="button"
                  onClick={() => setGender(gender === "female" ? "" : "female")}
                  className={`flex-1 h-10 rounded-md border text-sm transition-colors ${
                    gender === "female"
                      ? "border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300"
                      : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  Охин
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" disabled={loading} className="mt-2">
              {loading ? "Үүсгэж байна..." : "Үргэлжлүүлэх"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
