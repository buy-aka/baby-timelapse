import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params
  const { searchParams } = new URL(request.url)
  const width = Math.min(parseInt(searchParams.get("w") || "800"), 1600)

  const url = `${process.env.UPLOAD_SERVER_URL}/uploads/${filename}`
  const res = await fetch(url)
  if (!res.ok) return new NextResponse("Not found", { status: 404 })

  const buffer = Buffer.from(await res.arrayBuffer())

  const optimized = await sharp(buffer)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer()

  return new NextResponse(new Uint8Array(optimized), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
