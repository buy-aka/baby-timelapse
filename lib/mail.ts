// Google Workspace (Gmail) SMTP-ээр мэйл илгээгч.
// info@horom.mn акаунтын App Password ашиглана (ердийн нууц үг биш).
// Google талд: 2FA идэвхжүүлээд https://myaccount.google.com/apppasswords-ээс
// 16 оронтой App Password үүсгэж SMTP_PASSWORD-д тавина.
import nodemailer from "nodemailer"

/** SMTP тохиргоог env-ээс уншина. Дутуу бол чанга алдаа шиднэ (нууц үг лог-д гарахгүй). */
function getConfig() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com"
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD
  // Илгээгчийн харагдах хаяг. Workspace-д user-тэй ижил домэйн байх ёстой,
  // эс тэгвэл Gmail дарж бичдэг эсвэл spam руу ордог.
  const from = process.env.SMTP_FROM || `Horom <${user}>`
  if (!user || !pass) {
    throw new Error("SMTP_USER / SMTP_PASSWORD тохируулаагүй байна")
  }
  return { host, port, user, pass, from }
}

let cached: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (cached) return cached
  const { host, port, user, pass } = getConfig()
  cached = nodemailer.createTransport({
    host,
    port,
    // 465 = implicit TLS, 587 = STARTTLS (secure: false-оор эхэлж дараа нь TLS-рүү шилждэг)
    secure: port === 465,
    auth: { user, pass },
  })
  return cached
}

/** SMTP тохиргоо бүрэн эсэх (route-д зөөлөн шалгахад). */
export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASSWORD)
}

export type SendMailParams = {
  to: string
  subject: string
  html: string
  text?: string
}

/** Нэг мэйл илгээнэ. Алдаа гарвал дуудагч тал шийднэ (throw). */
export async function sendMail(params: SendMailParams): Promise<void> {
  const { from } = getConfig()
  await getTransporter().sendMail({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  })
}
