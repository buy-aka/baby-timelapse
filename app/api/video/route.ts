import { execFile } from "child_process"
import { mkdtemp, readFile, rm, writeFile } from "fs/promises"
import os from "os"
import path from "path"
import { promisify } from "util"
import { NextRequest, NextResponse } from "next/server"
import { and, asc, desc, eq, gt, isNull } from "drizzle-orm"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getBillingStatus, resolveSubscription } from "@/lib/billing"
import { db } from "@/lib/db"
import { babyPhotos, videoDownload } from "@/lib/db/schema"
import { videoIntervalDays } from "@/lib/plans"
import { getObject } from "@/lib/storage"
import { getBabyFamilyId, getUserDefaultBaby, userCanAccessBaby } from "@/lib/tenant"

const execFileAsync = promisify(execFile)

// Нэг зураг дэлгэцэнд үлдэх хугацаа (сек). 100 зураг ≈ 35 секундын бичлэг.
const FRAME_SEC = 0.35
// ffmpeg-ийн дээд ажиллах хугацаа — nginx-ийн /api/video timeout-оос бага.
const FFMPEG_TIMEOUT_MS = 4 * 60 * 1000

// POST /api/video — { babyId? } → зургуудыг он цагийн дарааллаар нийлүүлж
// mp4 болгоно. Хязгаар: Basic/туршилт 7 хоногт 1, Plus өдөрт 1 (family
// түвшинд). Амжилттай үүсгэсний ДАРАА л video_download мөр нэмэгдэнэ —
// алдаа гарвал эрх зарцуулагдахгүй.
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { babyId?: unknown } = {}
  try {
    body = await request.json()
  } catch {
    // body байхгүй бол default baby ашиглана
  }

  let babyId: string | null
  if (typeof body.babyId === "string" && body.babyId) {
    const ok = await userCanAccessBaby(session.user.id, body.babyId)
    if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    babyId = body.babyId
  } else {
    babyId = await getUserDefaultBaby(session.user.id)
  }
  if (!babyId) return NextResponse.json({ error: "Baby олдсонгүй" }, { status: 400 })

  const familyId = await getBabyFamilyId(babyId)
  if (!familyId) return NextResponse.json({ error: "Гэр бүл олдсонгүй" }, { status: 400 })

  const sub = await resolveSubscription(familyId)
  if (getBillingStatus(sub) === "expired") {
    return NextResponse.json(
      { error: "Багцын хугацаа дууссан. Тохиргоо → Багц хэсгээс идэвхжүүлнэ үү." },
      { status: 403 },
    )
  }

  // Rate limit: сүүлийн бичлэгээс хойш интервал өнгөрсөн эсэх.
  const intervalDays = videoIntervalDays(sub.plan)
  const windowStart = new Date(Date.now() - intervalDays * 24 * 60 * 60 * 1000)
  const [recent] = await db
    .select({ createdAt: videoDownload.createdAt })
    .from(videoDownload)
    .where(and(eq(videoDownload.familyId, familyId), gt(videoDownload.createdAt, windowStart)))
    .orderBy(desc(videoDownload.createdAt))
    .limit(1)
  if (recent) {
    const nextAt = new Date(recent.createdAt.getTime() + intervalDays * 24 * 60 * 60 * 1000)
    const nextStr = nextAt.toLocaleDateString("mn-MN", {
      month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
    })
    const hint =
      sub.plan === "plus"
        ? "Plus багц өдөрт 1 удаа татдаг."
        : "Basic багц 7 хоногт 1 удаа татдаг — Plus багц өдөрт 1 удаа."
    return NextResponse.json(
      { error: `Дараагийн бичлэг ${nextStr}-с боломжтой. ${hint}`, nextAvailableAt: nextAt },
      { status: 429 },
    )
  }

  const photos = await db
    .select({ fileName: babyPhotos.fileName, photoDate: babyPhotos.photoDate })
    .from(babyPhotos)
    .where(and(eq(babyPhotos.babyId, babyId), isNull(babyPhotos.deletedAt)))
    .orderBy(asc(babyPhotos.photoDate))
  if (photos.length === 0) {
    return NextResponse.json({ error: "Бичлэг хийх зураг алга байна" }, { status: 400 })
  }

  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "timelapse-"))
  try {
    // Зургуудыг storage-оос темп хавтас руу татна.
    const frames: string[] = []
    for (let i = 0; i < photos.length; i++) {
      const obj = await getObject(photos[i].fileName)
      if (!obj.Body) continue
      const framePath = path.join(tmpDir, `frame-${String(i).padStart(4, "0")}.jpg`)
      await writeFile(framePath, Buffer.from(await obj.Body.transformToByteArray()))
      frames.push(framePath)
    }
    if (frames.length === 0) {
      return NextResponse.json({ error: "Зургууд уншигдсангүй" }, { status: 500 })
    }

    // concat demuxer-ийн жагсаалт: кадр бүр FRAME_SEC, сүүлийн кадрыг
    // demuxer-ийн шаардлагаар давтаж бичнэ (эс бөгөөс duration нь алдагдана).
    const list =
      frames.map((f) => `file '${f}'\nduration ${FRAME_SEC}`).join("\n") +
      `\nfile '${frames[frames.length - 1]}'\n`
    const listPath = path.join(tmpDir, "list.txt")
    await writeFile(listPath, list)

    const outPath = path.join(tmpDir, "out.mp4")
    // 720x960 (3:4 босоо — утасны зурагт тохирно), харьцаа хадгалж pad хийнэ.
    await execFileAsync(
      "ffmpeg",
      [
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", listPath,
        "-vf",
        "scale=720:960:force_original_aspect_ratio=decrease,pad=720:960:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p",
        "-r", "30",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "23",
        "-movflags", "+faststart",
        outPath,
      ],
      { timeout: FFMPEG_TIMEOUT_MS, maxBuffer: 16 * 1024 * 1024 },
    )

    const video = await readFile(outPath)

    await db.insert(videoDownload).values({
      familyId,
      babyId,
      downloadedBy: session.user.id,
      frameCount: frames.length,
    })

    return new NextResponse(video, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="horom-timelapse.mp4"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (e) {
    console.error("[video] бичлэг үүсгэхэд алдаа:", e)
    return NextResponse.json(
      { error: "Бичлэг үүсгэхэд алдаа гарлаа. Дахин оролдоно уу." },
      { status: 500 },
    )
  } finally {
    rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}
