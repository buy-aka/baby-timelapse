import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { APIError } from "better-auth/api"
import { and, desc, eq, gt } from "drizzle-orm"
import { db } from "@/lib/db"
import * as schema from "@/lib/db/schema"
import { isValidMongolianPhone } from "@/lib/verify"
import { phoneLoginPlugin } from "@/lib/auth-phone-login-plugin"
import { isMailConfigured, sendMail } from "@/lib/mail"

/** Нууц үг сэргээх мэйлийн энгийн, найдвартай (inline-style) HTML. */
function resetPasswordHtml(url: string): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111">
  <h2 style="margin:0 0 12px">Нууц үг сэргээх</h2>
  <p style="margin:0 0 16px;line-height:1.5">Та Horom дээрх нууц үгээ сэргээхийг хүссэн байна. Доорх товчоор шинэ нууц үг тавина уу.</p>
  <a href="${url}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">Нууц үг сэргээх</a>
  <p style="margin:16px 0 0;font-size:13px;color:#666;line-height:1.5">Товч ажиллахгүй бол энэ холбоосыг хуулна уу:<br>${url}</p>
  <p style="margin:12px 0 0;font-size:12px;color:#999">Хэрэв та энэ хүсэлтийг гаргаагүй бол мэйлийг үл тоомсорлоно уу.</p>
</div>`
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  plugins: [phoneLoginPlugin()],
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      // SMTP тохируулаагүй бол лог-д хэвлээд өнгөрнө (dev/staging).
      if (!isMailConfigured()) {
        console.log(`[Auth] Reset password for ${user.email}: ${url}`)
        return
      }
      await sendMail({
        to: user.email,
        subject: "Horom — нууц үг сэргээх",
        text: `Нууц үгээ сэргээхийг хүссэн байна.\n\nЭнэ холбоосоор шинэ нууц үг тавина уу:\n${url}\n\nХэрэв та хүсээгүй бол энэ мэйлийг үл тоомсорлоно уу.`,
        html: resetPasswordHtml(url),
      })
    },
  },
  user: {
    additionalFields: {
      // Бүртгэлийн үед client-ээс дамжина, before hook-д баталгаажуулна.
      phone: { type: "string", required: false, input: true },
      // Client өөрөө тавьж чадахгүй (input:false) — зөвхөн before hook true болгоно.
      phoneVerified: { type: "boolean", required: false, input: false, defaultValue: false },
      // Үйлчилгээний нөхцөл (/terms) зөвшөөрсөн эсэх — before hook-д шаардана.
      termsAccepted: { type: "boolean", required: false, input: true, defaultValue: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 хоног
  },
  databaseHooks: {
    user: {
      create: {
        // Бүртгэл үүсгэхийн ӨМНӨ утас баталгаажсан эсэхийг сервер талд шалгана.
        // Энэ hook нь БҮХ user үүсгэх замд ажилладаг тул client шууд
        // /api/auth/sign-up/email руу хандаж ч тойрч гарах боломжгүй.
        before: async (userData) => {
          // Үйлчилгээний нөхцөлийг зөвшөөрөөгүй бол бүртгэхгүй — checkbox-ийг
          // client-д шалгадаг ч энд сервер талд давхар шаардана.
          if ((userData as { termsAccepted?: boolean }).termsAccepted !== true) {
            throw new APIError("BAD_REQUEST", {
              message: "Үйлчилгээний нөхцөлийг зөвшөөрнө үү.",
            })
          }

          const phone = (userData as { phone?: string }).phone
          if (!phone || !isValidMongolianPhone(phone)) {
            throw new APIError("BAD_REQUEST", {
              message: "Утасны дугаараа баталгаажуулна уу.",
            })
          }

          // Тухайн дугаарт VERIFIED, хугацаа дуусаагүй, ашиглагдаагүй session
          // байгаа эсэх. status-ыг зөвхөн GET /api/verify/status verify.mn-ээс
          // баталгаажуулж VERIFIED болгодог тул энэ нь найдвартай.
          const [vs] = await db
            .select()
            .from(schema.verifySession)
            .where(
              and(
                eq(schema.verifySession.phone, phone),
                eq(schema.verifySession.status, "VERIFIED"),
                eq(schema.verifySession.consumed, false),
                gt(schema.verifySession.expiresAt, new Date()),
              ),
            )
            .orderBy(desc(schema.verifySession.createdAt))
            .limit(1)

          if (!vs) {
            throw new APIError("BAD_REQUEST", {
              message: "Утас баталгаажаагүй байна. Дахин баталгаажуулна уу.",
            })
          }

          // Нэг баталгаажуулалтыг зөвхөн нэг бүртгэлд ашиглана (replay хамгаалалт).
          await db
            .update(schema.verifySession)
            .set({ consumed: true })
            .where(eq(schema.verifySession.sessionId, vs.sessionId))

          return { data: { phoneVerified: true } }
        },
        after: async (newUser) => {
          // Шинэ хэрэглэгчийн хувьд анхдагч family үүсгэнэ.
          // Baby-г onboarding wizard-аас үүсгэнэ.
          const [createdFamily] = await db
            .insert(schema.family)
            .values({
              name: `${newUser.name}-н гэр бүл`,
              ownerId: newUser.id,
            })
            .returning()

          await db.insert(schema.familyMember).values({
            familyId: createdFamily.id,
            userId: newUser.id,
            role: "owner",
          })
        },
      },
    },
  },
})
