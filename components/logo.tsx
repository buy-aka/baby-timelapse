import Link from "next/link"

// Horom-ийн лого — «өсөлтийн шугам»: цаг хугацаагаар өсөх 4 багана.
// Эхний 3 нь брэнд ногоон, хамгийн өндөр (сүүлийн) нь шар — өсөлтийн
// оргил, дулаан «хором» агшин. Брэнд өнгө tailwind.config.ts-тэй нийцнэ
// (ногоон #1b6b53, шар #f5c542, гүн ногоон #123f31, цөцгий #f7f4ec).

export function LogoMark({
  size = 28,
  className = "",
  tone = "brand",
}: {
  size?: number
  className?: string
  // "brand" — ногоон багана (цайвар дэвсгэрт); "light" — цөцгий багана
  // (гүн ногоон/бараан дэвсгэрт). Хамгийн өндөр багана хоёуланд шар.
  tone?: "brand" | "light"
}) {
  const bar = tone === "light" ? "#f7f4ec" : "#1b6b53"
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
      <rect x="2" y="19" width="5" height="8" rx="2" fill={bar} />
      <rect x="10" y="14" width="5" height="13" rx="2" fill={bar} />
      <rect x="18" y="9" width="5" height="18" rx="2" fill={bar} />
      <rect x="26" y="2" width="5" height="25" rx="2" fill="#f5c542" />
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
