"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Users, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"

interface InviteInfo {
  familyName: string
  invitedByName: string
  role: string
}

const ROLE_LABEL: Record<string, string> = {
  parent: "Эцэг/Эх",
  member: "Гишүүн",
  viewer: "Үзэгч",
}

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>()
  const router = useRouter()
  const [info, setInfo] = useState<InviteInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [needsLogin, setNeedsLogin] = useState(false)

  useEffect(() => {
    const init = async () => {
      // Урилгыг шалгана
      const res = await fetch(`/api/invites/${params.token}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "Урилга буруу")
        return
      }
      const data = await res.json()
      setInfo(data)

      // Session шалгана
      const { data: session } = await authClient.getSession()
      if (!session) setNeedsLogin(true)
    }
    init()
  }, [params.token])

  const accept = async () => {
    setAccepting(true)
    const res = await fetch(`/api/invites/${params.token}`, { method: "POST" })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || "Алдаа гарлаа")
      setAccepting(false)
      return
    }
    router.push("/chat")
  }

  return (
    <div className="min-h-svh flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        {error ? (
          <>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={20} className="text-red-500" />
                <CardTitle>Урилга боломжгүй</CardTitle>
              </div>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link href="/chat">Нүүр хуудас руу</Link>
              </Button>
            </CardContent>
          </>
        ) : !info ? (
          <CardContent className="py-8 text-center text-sm text-zinc-500">Уншиж байна...</CardContent>
        ) : (
          <>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-xl">Гэр бүлийн урилга</CardTitle>
              </div>
              <CardDescription>
                <strong>{info.invitedByName}</strong> таныг
                {" "}<strong>{info.familyName}</strong>{" "}
                гэр бүлд <strong>{ROLE_LABEL[info.role]}</strong> үүрэгтэйгээр урьж байна.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {needsLogin ? (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Урилгыг хүлээн авахын тулд эхлээд нэвтэрнэ үү.
                  </p>
                  <Button asChild>
                    <Link href={`/auth/login?redirect=/invite/${params.token}`}>Нэвтрэх</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/auth/sign-up?redirect=/invite/${params.token}`}>Бүртгүүлэх</Link>
                  </Button>
                </div>
              ) : (
                <Button onClick={accept} disabled={accepting} className="w-full">
                  <Check size={14} className="mr-1" />
                  {accepting ? "Хүлээн авч байна..." : "Хүлээн зөвшөөрөх"}
                </Button>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
