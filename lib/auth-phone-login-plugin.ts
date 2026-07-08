// Утасны дугаараар, нууц үггүй нэвтрэх custom better-auth plugin.
// verify.mn-ий "login" RULE-ээр (144773 руу PREFIX:CODE илгээх) хэрэглэгчийн
// утас хэдийнээ баталгаажсан эсэхийг app/api/sms/check шалгаж, энд зөвхөн
// session үүсгэнэ. better-auth-ийн phone-number plugin ашиглаагүй шалтгаан:
// тэр нь user.phoneNumber/phoneNumberVerified багана шаарддаг бөгөөд манай
// схем аль хэдийн user.phone/phoneVerified нэртэй (verify.mn SESSION-based
// бүртгэлийн баталгаажуулалтад ашиглагдаж байгаа, lib/auth.ts-г үз).
import type { Session } from "better-auth"
import { APIError, createAuthEndpoint } from "better-auth/api"
import { setSessionCookie } from "better-auth/cookies"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/lib/db"
import { user as userTable } from "@/lib/db/schema"

export function phoneLoginPlugin() {
  return {
    id: "phone-login",
    endpoints: {
      // POST /phone-login/complete — зөвхөн сервер дотроос (auth.api.completePhoneLogin)
      // дуудагдана: app/api/auth/phone-login/status аль хэдийн verify.mn-ээр
      // баталгаажсан challenge-г CONSUMED болгож дуудна. Client шууд хандахгүй.
      completePhoneLogin: createAuthEndpoint(
        "/phone-login/complete",
        {
          method: "POST",
          body: z.object({ phone: z.string() }),
        },
        async (ctx) => {
          const [foundUser] = await db
            .select()
            .from(userTable)
            .where(eq(userTable.phone, ctx.body.phone))
            .limit(1)

          if (!foundUser || !foundUser.phoneVerified) {
            throw new APIError("UNAUTHORIZED", { message: "Хэрэглэгч олдсонгүй" })
          }

          // internalAdapter нь plugin-ий public type-д ороогүй ч, phone-number
          // зэрэг built-in plugin-үүд яг үүгээр session үүсгэдэг — эндээс
          // тэдгээртэй ижил дотоод API-г зориудаар ашиглаж байна.
          const internalAdapter = (ctx.context as { internalAdapter: {
            createSession: (userId: string) => Promise<Session | null>
          } }).internalAdapter

          const session = await internalAdapter.createSession(foundUser.id)
          if (!session) {
            throw new APIError("INTERNAL_SERVER_ERROR", { message: "Session үүсгэж чадсангүй" })
          }

          await setSessionCookie(ctx, { session, user: foundUser })

          return ctx.json({ token: session.token })
        },
      ),
    },
  }
}
