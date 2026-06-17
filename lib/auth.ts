import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/lib/db"
import * as schema from "@/lib/db/schema"

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
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      // TODO: production-д имэйл провайдер (Resend, etc.) холбоно
      console.log(`[Auth] Reset password for ${user.email}: ${url}`)
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 хоног
  },
  databaseHooks: {
    user: {
      create: {
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
