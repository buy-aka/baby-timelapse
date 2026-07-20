import { createHmac, randomUUID, timingSafeEqual } from "crypto"

// wire.mn төлбөрийн gateway-ийн client (docs.wire.mn).
// Урсгал: PaymentIntent үүсгэх → Checkout session үүсгэх → хэрэглэгчийг
// session-ий url руу үсэргэх → төлөгдмөгц payment_intent.succeeded webhook.
// АНХААР: amount нь БҮТЭН ТӨГРӨГӨӨР (10000 = 10 000₮) — live интентээр
// баталгаажуулсан (10,000₮ payment link → amount: 10000).

const WIRE_API = "https://api.wire.mn"

export type WirePaymentIntent = {
  id: string
  object: "payment_intent"
  amount: number
  currency: string
  status: string // "new" | ... | "succeeded"
  metadata?: Record<string, string>
}

function apiKey(): string {
  const key = process.env.WIRE_API_KEY
  if (!key) throw new Error("WIRE_API_KEY тохируулагдаагүй байна")
  return key
}

// API нь JSON body шаарддаг (form-encoded илгээвэл invalid_json буцаадаг —
// live-аар шалгасан).
async function wireRequest<T>(path: string, body?: object): Promise<T> {
  const res = await fetch(`${WIRE_API}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      ...(body
        ? { "Content-Type": "application/json", "Idempotency-Key": randomUUID() }
        : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const detail = JSON.stringify(data?.error ?? data)?.slice(0, 300)
    throw new Error(`wire ${path} → ${res.status}: ${detail}`)
  }
  return data as T
}

export async function wireCreatePaymentIntent(params: {
  amountMnt: number
  description: string
  metadata?: Record<string, string>
}): Promise<WirePaymentIntent> {
  return wireRequest<WirePaymentIntent>("/v1/payment_intents", {
    amount: params.amountMnt,
    currency: "MNT",
    description: params.description,
    metadata: params.metadata ?? {},
  })
}

export async function wireCreateCheckoutSession(params: {
  paymentIntentId: string
  successUrl: string
  cancelUrl?: string
}): Promise<{ id: string; url: string }> {
  return wireRequest<{ id: string; url: string }>("/v1/checkout/sessions", {
    payment_intent: params.paymentIntentId,
    success_url: params.successUrl,
    ...(params.cancelUrl ? { cancel_url: params.cancelUrl } : {}),
  })
}

export async function wireGetPaymentIntent(id: string): Promise<WirePaymentIntent> {
  return wireRequest<WirePaymentIntent>(
    `/v1/payment_intents/${encodeURIComponent(id)}`,
  )
}

// "WirePayment-Signature: t=<unix>,v1=<hex>" толгойг шалгана.
// v1 = HMAC_SHA256(secret, `${t}.${rawBody}`) — заавал raw body ашиглана
// (parse хийсний дараа serialize хийвэл байтууд өөрчлөгдөж гарын үсэг эвдэрнэ).
export function verifyWireSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  toleranceSec = 300,
): boolean {
  if (!header) return false

  let t: string | null = null
  const v1s: string[] = []
  for (const part of header.split(",")) {
    const [k, v] = part.trim().split("=", 2)
    if (k === "t") t = v
    else if (k === "v1" && v) v1s.push(v)
  }
  if (!t || v1s.length === 0) return false

  const ts = parseInt(t, 10)
  if (!Number.isFinite(ts)) return false
  if (Math.abs(Date.now() / 1000 - ts) > toleranceSec) return false

  const expected = createHmac("sha256", secret)
    .update(`${t}.${rawBody}`)
    .digest("hex")
  const expectedBuf = Buffer.from(expected)

  return v1s.some((v1) => {
    const buf = Buffer.from(v1)
    return buf.length === expectedBuf.length && timingSafeEqual(buf, expectedBuf)
  })
}
