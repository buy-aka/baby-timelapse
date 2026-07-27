import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getPendingInvitesForUser } from "@/lib/tenant"

// GET /api/invites/pending — нэвтэрсэн хэрэглэгчийн утсаар нь хүлээж буй
// урилгууд (banner-т харуулна). Аль хэдийн гишүүн болсон гэр бүлийг хасна.
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const pending = await getPendingInvitesForUser(session.user.id)
  return NextResponse.json(pending)
}
