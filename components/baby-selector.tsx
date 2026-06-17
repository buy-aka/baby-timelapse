"use client"

import { Baby as BabyIcon, ChevronDown } from "lucide-react"

export interface BabyOption {
  id: string
  name: string
  birthDate: string | null
  gender: string | null
}

export default function BabySelector({
  babies,
  value,
  onChange,
}: {
  babies: BabyOption[]
  value: string | null
  onChange: (id: string) => void
}) {
  if (babies.length === 0) return null

  const active = babies.find((b) => b.id === value) || babies[0]
  const subtitle = active.birthDate ? new Date(active.birthDate).toLocaleDateString("mn-MN") : null

  if (babies.length === 1) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
        <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <BabyIcon size={14} className="text-zinc-500" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-medium">{active.name}</span>
          {subtitle && <span className="text-[10px] text-zinc-400">{subtitle}</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="relative inline-block">
      <select
        value={active.id}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-10 pr-9 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-sm font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        {babies.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
      <BabyIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
    </div>
  )
}
