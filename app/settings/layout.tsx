import Link from "next/link"
import { Baby, Users, ArrowLeft } from "lucide-react"

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link
        href="/chat"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-6"
      >
        <ArrowLeft size={14} />
        Буцах
      </Link>

      <h1 className="text-2xl font-bold mb-6">Тохиргоо</h1>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
        <nav className="flex md:flex-col gap-1">
          <Link
            href="/settings/babies"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Baby size={15} />
            Хүүхдүүд
          </Link>
          <Link
            href="/settings/family"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Users size={15} />
            Гэр бүл
          </Link>
        </nav>

        <main>{children}</main>
      </div>
    </div>
  )
}
