import { createAuthClient } from "better-auth/react"
import { inferAdditionalFields } from "better-auth/client/plugins"

// baseURL зориуд өгөхгүй — better-auth нь browser-ийн same-origin
// (window.location.origin)-ийг ашиглана. Ингэснээр NEXT_PUBLIC_APP_URL-ийг
// build үед шигдээх шаардлагагүй бөгөөд http://<ip> ↔ https://domain хооронд
// шилжихэд дахин build хийх ч хэрэггүй.
//
// inferAdditionalFields — signUp.email-д `phone` талбарыг type-safe болгоно.
// (Сервер талын auth-г import хийхгүй тул client bundle-д server код орохгүй.)
export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields({
      user: {
        phone: { type: "string" },
        termsAccepted: { type: "boolean" },
      },
    }),
  ],
})
