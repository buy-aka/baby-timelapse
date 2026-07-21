import { redirect } from "next/navigation"
import Link from "next/link"
import { headers } from "next/headers"
import { Settings } from "lucide-react"
import { auth } from "@/lib/auth"
import { getBillingStatus, resolveSubscription } from "@/lib/billing"
import { getUserBabyIds, getUserPrimaryFamily } from "@/lib/tenant"
import { Logo } from "@/components/logo"
import { LogoutButton } from "@/components/logout-button"
import { ThemeSwitcher } from "@/components/theme-switcher"

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/auth/login")

  const babyIds = await getUserBabyIds(session.user.id)
  if (babyIds.length === 0) redirect("/onboarding")

  // Багцын хугацаа дууссан бол зөвхөн сануулга — үзэх эрх хэвээрээ,
  // харин зураг нэмэхийг API тал хориглоно.
  const familyId = await getUserPrimaryFamily(session.user.id)
  const expired = familyId
    ? getBillingStatus(await resolveSubscription(familyId)) === "expired"
    : false

  return (
    <div className="min-h-svh">
      <header className="border-b border-zinc-100 dark:border-zinc-800 sticky top-0 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo href="/chat" size={24} />
            <nav className="flex items-center gap-3 text-sm text-zinc-500">
              <Link href="/chat" className="hover:text-zinc-900 dark:hover:text-zinc-100">Түүх</Link>
              <Link href="/chat/album" className="hover:text-zinc-900 dark:hover:text-zinc-100">Цомог</Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 hidden sm:inline">{session.user.email}</span>
            <Link
              href="/settings"
              className="w-9 h-9 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400"
              title="Тохиргоо"
            >
              <Settings size={16} />
            </Link>
            <ThemeSwitcher />
            <LogoutButton />
          </div>
        </div>
      </header>
      {expired && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900">
          <div className="max-w-6xl mx-auto px-4 py-2 text-sm text-amber-800 dark:text-amber-300">
            Багцын хугацаа дууссан тул шинэ зураг нэмэх боломжгүй байна.{" "}
            <Link href="/settings/billing" className="underline font-medium">
              Багц идэвхжүүлэх
            </Link>
          </div>
        </div>
      )}
      {children}
    </div>
  )
}
