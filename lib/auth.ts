import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { APIError } from "better-auth/api"
import { and, desc, eq, gt } from "drizzle-orm"
import { db } from "@/lib/db"
import * as schema from "@/lib/db/schema"
import { isValidMongolianPhone } from "@/lib/verify"
import { phoneLoginPlugin } from "@/lib/auth-phone-login-plugin"

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
      // TODO: production-д имэйл провайдер (Resend, etc.) холбоно
      console.log(`[Auth] Reset password for ${user.email}: ${url}`)
    },
  },
  user: {
    additionalFields: {
      // Бүртгэлийн үед client-ээс дамжина, before hook-д баталгаажуулна.
      phone: { type: "string", required: false, input: true },
      // Client өөрөө тавьж чадахгүй (input:false) — зөвхөн before hook true болгоно.
      phoneVerified: { type: "boolean", required: false, input: false, defaultValue: false },
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
