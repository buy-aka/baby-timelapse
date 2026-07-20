import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { invitation, FAMILY_ROLES, FamilyRole } from "@/lib/db/schema"
import { getFamilyMemberCount, getUserFamilyRole } from "@/lib/tenant"
import { MAX_INVITED_MEMBERS } from "@/lib/plans"
import { isMailConfigured, sendMail } from "@/lib/mail"
import { randomBytes } from "crypto"
import { headers } from "next/headers"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const role = await getUserFamilyRole(session.user.id, id)
  if (role !== "owner" && role !== "parent") {
    return NextResponse.json({ error: "Урих эрхгүй" }, { status: 403 })
  }

  const { email, role: invitedRole } = await request.json()
  if (!email?.trim()) {
    return NextResponse.json({ error: "Email шаардлагатай" }, { status: 400 })
  }
  if (!FAMILY_ROLES.includes(invitedRole)) {
    return NextResponse.json({ error: "Үүрэг буруу" }, { status: 400 })
  }
  if (invitedRole === "owner") {
    return NextResponse.json({ error: "Эзэмшигч урих боломжгүй" }, { status: 400 })
  }

  // Багцын хязгаар: эзэмшигчээс гадна MAX_INVITED_MEMBERS гишүүн.
  const memberCount = await getFamilyMemberCount(id)
  if (memberCount >= 1 + MAX_INVITED_MEMBERS) {
    return NextResponse.json(
      { error: `Гишүүдийн дээд хязгаарт хүрсэн (${MAX_INVITED_MEMBERS} гишүүн урих боломжтой)` },
      { status: 403 },
    )
  }

  const token = randomBytes(24).toString("hex")
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 хоног

  const [created] = await db
    .insert(invitation)
    .values({
      familyId: id,
      email: email.trim().toLowerCase(),
      role: invitedRole as FamilyRole,
      token,
      invitedBy: session.user.id,
      expiresAt,
    })
    .returning()

  // Invite URL-ийг runtime-д тодорхойлно: эхлээд BETTER_AUTH_URL (runtime env),
  // байхгүй бол nginx-ээс ирэх Host/Proto-оос. NEXT_PUBLIC_APP_URL нь build үед
  // шигддэг тул ашиглахгүй — ингэснээр IP↔domain шилжихэд rebuild шаардахгүй.
  const reqHeaders = await headers()
  const origin =
    process.env.BETTER_AUTH_URL ||
    `${reqHeaders.get("x-forwarded-proto") ?? "http"}://${reqHeaders.get("host")}`
  const inviteUrl = `${origin}/invite/${token}`

  // SMTP тохируулсан бол мэйл илгээнэ. Мэйл амжилтгүй болсон ч урилга үүссэн
  // хэвээр — inviteUrl-ийг буцаадаг тул гараар хуулж илгээх боломжтой.
  let emailSent = false
  if (isMailConfigured()) {
    try {
      await sendMail({
        to: created.email,
        subject: "Horom — гэр бүлийн урилга",
        text: `Танийг Horom дээр хүүхдийн өсөлтийн timelapse-д нэгдэхийг урьж байна.\n\nЭнэ холбоосоор нэгдэнэ үү (7 хоног хүчинтэй):\n${inviteUrl}`,
        html: inviteEmailHtml(inviteUrl),
      })
      emailSent = true
    } catch (err) {
      // Урилга үүссэн тул алдааг зөвхөн лог-д тэмдэглээд үргэлжлүүлнэ.
      console.error(`[Invite] Мэйл илгээж чадсангүй (${created.email}):`, err)
    }
  } else {
    console.log(`[Invite] SMTP тохируулаагүй. To: ${email}, URL: ${inviteUrl}`)
  }

  return NextResponse.json({ ...created, inviteUrl, emailSent })
}

/** Урилгын мэйлийн энгийн, найдвартай (inline-style) HTML. */
function inviteEmailHtml(inviteUrl: string): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111">
  <h2 style="margin:0 0 12px">Horom-д тавтай морил 👶</h2>
  <p style="margin:0 0 16px;line-height:1.5">Танийг гэр бүлийн хүүхдийн өсөлтийн timelapse-д нэгдэхийг урьж байна.</p>
  <a href="${inviteUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">Урилгыг хүлээн авах</a>
  <p style="margin:16px 0 0;font-size:13px;color:#666;line-height:1.5">Товч ажиллахгүй бол энэ холбоосыг хуулна уу:<br>${inviteUrl}</p>
  <p style="margin:12px 0 0;font-size:12px;color:#999">Энэ урилга 7 хоногийн дараа хүчингүй болно.</p>
</div>`
}
