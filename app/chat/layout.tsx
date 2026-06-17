import { redirect } from "next/navigation"
import Link from "next/link"
import { headers } from "next/headers"
import { Settings } from "lucide-react"
import { auth } from "@/lib/auth"
import { getUserBabyIds } from "@/lib/tenant"
import { LogoutButton } from "@/components/logout-button"
import { ThemeSwitcher } from "@/components/theme-switcher"

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/auth/login")

  const babyIds = await getUserBabyIds(session.user.id)
  if (babyIds.length === 0) redirect("/onboarding")

  return (
    <div className="min-h-svh">
      <header className="border-b border-zinc-100 dark:border-zinc-800 sticky top-0 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/chat" className="font-bold text-sm">Baby Timelapse</Link>
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
      {children}
    </div>
  )
}
