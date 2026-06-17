import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getUserBabyIds } from "@/lib/tenant"

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/auth/login")

  const babyIds = await getUserBabyIds(session.user.id)
  if (babyIds.length > 0) redirect("/chat")

  return <>{children}</>
}
