// verify.mn — Монголд зориулсан MO (Mobile-Originated) SMS утас баталгаажуулах API client.
// Хэрэглэгч 144773 руу код SMS илгээснээр утсаа баталгаажуулна.
// Docs: https://api.verify.mn
import { randomInt } from "crypto"

const BASE_URL = "https://api.verify.mn"

// Брэндийн хариу SMS. verify.mn зөвхөн ASCII printable (0x20-0x7E) зөвшөөрдөг
// тул кирилл/emoji ашиглах боломжгүй — латинаар бичнэ. 160 тэмдэгтээс богино.
const RESPONSE_SMS = "Horom: Utsaa amjilttai batalgaajlaa. Tavtai morilno uu!"

/** VERIFY_MN_API_KEY-г env-ээс уншина. Байхгүй бол чанга алдаа шиднэ (лог-д key гарахгүй). */
function getApiKey(): string {
  const key = process.env.VERIFY_MN_API_KEY
  if (!key) throw new Error("VERIFY_MN_API_KEY тохируулаагүй байна")
  return key
}

/** verify.mn API-гаас буцсан алдаа. HTTP статус агуулна (API key лог-д ороохгүй). */
export class VerifyApiError extends Error {
  constructor(public status: number, public body: string) {
    super(`verify.mn API алдаа (${status})`)
    this.name = "VerifyApiError"
  }
}

/** Монголын гар утасны дугаар (8 орон, 6-9-өөр эхэлнэ). */
export function isValidMongolianPhone(phone: string): boolean {
  return /^[6-9]\d{7}$/.test(phone)
}

/** Санамсаргүй 6 оронтой баталгаажуулах код. Session бүрт шинээр үүсгэнэ. */
export function generateSmsCode(): string {
  return String(randomInt(100000, 1000000))
}

export type VerifySessionCreated = {
  sessionId: string
  phone: string
  shortcode: string
  text: string
  smsUri: string
  displayInstruction: string
  expiresAt: string
}

/** POST /sessions — баталгаажуулах session үүсгэнэ (API key шаардлагатай). */
export async function createVerifySession(params: {
  phone: string
  text: string
}): Promise<VerifySessionCreated> {
  const res = await fetch(`${BASE_URL}/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    // callback тохируулахгүй — polling (GET /sessions/:id) ашиглана.
    // Docs: хуурамч callback URL бүү тавь. Polling нь илүү найдвартай.
    body: JSON.stringify({
      phone: params.phone,
      text: params.text,
      responseSms: RESPONSE_SMS,
    }),
  })
  if (!res.ok) {
    throw new VerifyApiError(res.status, await res.text().catch(() => ""))
  }
  return res.json() as Promise<VerifySessionCreated>
}

export type VerifySessionStatus = {
  sessionId: string
  phone: string
  sessionStatus: "PENDING" | "VERIFIED" | "EXPIRED"
  callbackStatus?: "PENDING" | "SENT" | "FAILED"
  verifiedAt?: string
  expiresAt: string
}

/** GET /sessions/:sessionId — статус шалгана (API key шаардахгүй). */
export async function getVerifySession(sessionId: string): Promise<VerifySessionStatus> {
  const res = await fetch(`${BASE_URL}/sessions/${encodeURIComponent(sessionId)}`, {
    cache: "no-store",
  })
  if (!res.ok) {
    throw new VerifyApiError(res.status, await res.text().catch(() => ""))
  }
  return res.json() as Promise<VerifySessionStatus>
}
