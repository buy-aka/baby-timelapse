import Link from "next/link"

// Horom-ийн лого — «томрох цэгүүд»: цаг хугацаагаар жижгээс томрон дээшлэх
// 4 дугуй. Цэг бүр нэг агшин/зураг — хүүхэд өсөж, дурсамж хуримтлагдана.
// Эхний 3 нь брэнд ногоон, хамгийн том (сүүлийн) нь шар. Брэнд өнгө
// tailwind.config.ts-тэй нийцнэ (ногоон #1b6b53, шар #f5c542, цөцгий #f7f4ec).

export function LogoMark({
  size = 28,
  className = "",
  tone = "brand",
}: {
  size?: number
  className?: string
  // "brand" — ногоон цэг (цайвар дэвсгэрт); "light" — цөцгий цэг
  // (гүн ногоон/бараан дэвсгэрт). Хамгийн том цэг хоёуланд шар.
  tone?: "brand" | "light"
}) {
  const dot = tone === "light" ? "#f7f4ec" : "#1b6b53"
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Horom"
    >
      <circle cx="5" cy="26" r="2" fill={dot} />
      <circle cx="12" cy="20.5" r="3" fill={dot} />
      <circle cx="20" cy="14.5" r="4" fill={dot} />
      <circle cx="27" cy="7" r="5" fill="#f5c542" />
    </svg>
  )
}

export function Logo({
  size = 26,
  wordmark = true,
  className = "",
  wordmarkClassName = "text-brand-deep dark:text-brand-cream",
  href = null,
}: {
  size?: number
  wordmark?: boolean
  className?: string
  wordmarkClassName?: string
  href?: string | null
}) {
  const inner = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      {wordmark && (
        <span className={`text-xl font-bold tracking-tight ${wordmarkClassName}`}>
          Horom
        </span>
      )}
    </span>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex" aria-label="Horom">
        {inner}
      </Link>
    )
  }
  return inner
}
