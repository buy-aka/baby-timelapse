import { createAuthClient } from "better-auth/react"

// baseURL зориуд өгөхгүй — better-auth нь browser-ийн same-origin
// (window.location.origin)-ийг ашиглана. Ингэснээр NEXT_PUBLIC_APP_URL-ийг
// build үед шигдээх шаардлагагүй бөгөөд http://<ip> ↔ https://domain хооронд
// шилжихэд дахин build хийх ч хэрэггүй.
export const authClient = createAuthClient()
