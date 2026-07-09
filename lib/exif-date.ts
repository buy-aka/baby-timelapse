// JPEG-ийн EXIF-ээс зураг ДАРСАН огноог уншина (dependency-гүй).
// iPhone-ийн зургууд browser-оор оруулахад JPEG болж хөрвөдөг бөгөөд
// DateTimeOriginal (0x9003) тег нь хадгалагддаг. Canvas-аар шахахад EXIF
// устдаг тул энэ функцийг ЗААВАЛ шахахаас өмнө дуудна.
//
// Буцаах утга: "YYYY-MM-DD" эсвэл null (EXIF байхгүй / JPEG биш / эвдэрсэн).

const TAG_DATETIME = 0x0132 // IFD0: файлын өөрчлөлтийн огноо (сүүлийн сонголт)
const TAG_DATETIME_ORIGINAL = 0x9003 // Exif IFD: дарсан огноо (тэргүүн сонголт)
const TAG_DATETIME_DIGITIZED = 0x9004 // Exif IFD: тоон болгосон огноо
const TAG_EXIF_IFD_POINTER = 0x8769

export async function extractExifDate(file: File): Promise<string | null> {
  try {
    // EXIF нь файлын эхэнд байдаг (APP segment бүр ≤64KB) — 512KB хангалттай.
    const buf = await file.slice(0, 512 * 1024).arrayBuffer()
    const view = new DataView(buf)
    if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null // JPEG биш

    let offset = 2
    while (offset + 4 <= view.byteLength) {
      const marker = view.getUint16(offset)
      if ((marker & 0xff00) !== 0xff00) break
      const size = view.getUint16(offset + 2)
      if (size < 2) break

      if (marker === 0xffe1 && offset + 10 <= view.byteLength) {
        // APP1 → "Exif\0\0" дараа нь TIFF header
        if (
          view.getUint32(offset + 4) === 0x45786966 && // "Exif"
          view.getUint16(offset + 8) === 0
        ) {
          return parseTiffDate(view, offset + 10)
        }
      }
      offset += 2 + size
    }
    return null
  } catch {
    return null
  }
}

function parseTiffDate(view: DataView, tiffStart: number): string | null {
  const little = view.getUint16(tiffStart) === 0x4949 // "II" = little-endian
  const g16 = (o: number) => view.getUint16(o, little)
  const g32 = (o: number) => view.getUint32(o, little)
  if (g16(tiffStart + 2) !== 42) return null

  // "YYYY:MM:DD HH:MM:SS" хэлбэрийн ASCII тег уншина.
  const readAscii = (entryOffset: number): string | null => {
    const count = g32(entryOffset + 4)
    if (count < 8 || count > 32) return null
    const valOff = count <= 4 ? entryOffset + 8 : tiffStart + g32(entryOffset + 8)
    let s = ""
    for (let i = 0; i < count - 1; i++) {
      const c = view.getUint8(valOff + i)
      if (c === 0) break
      s += String.fromCharCode(c)
    }
    return s
  }

  const scanIfd = (ifdOff: number, tags: number[]) => {
    const found: Record<number, string> = {}
    let exifPtr = 0
    const n = g16(ifdOff)
    for (let i = 0; i < n; i++) {
      const e = ifdOff + 2 + i * 12
      if (e + 12 > view.byteLength) break
      const tag = g16(e)
      const type = g16(e + 2)
      if (tag === TAG_EXIF_IFD_POINTER) exifPtr = g32(e + 8)
      else if (tags.includes(tag) && type === 2) {
        const s = readAscii(e)
        if (s) found[tag] = s
      }
    }
    return { found, exifPtr }
  }

  const ifd0 = scanIfd(tiffStart + g32(tiffStart + 4), [TAG_DATETIME])

  const candidates: string[] = []
  if (ifd0.exifPtr) {
    const exif = scanIfd(tiffStart + ifd0.exifPtr, [
      TAG_DATETIME_ORIGINAL,
      TAG_DATETIME_DIGITIZED,
    ])
    if (exif.found[TAG_DATETIME_ORIGINAL]) candidates.push(exif.found[TAG_DATETIME_ORIGINAL])
    if (exif.found[TAG_DATETIME_DIGITIZED]) candidates.push(exif.found[TAG_DATETIME_DIGITIZED])
  }
  if (ifd0.found[TAG_DATETIME]) candidates.push(ifd0.found[TAG_DATETIME])

  for (const c of candidates) {
    const m = c.match(/^(\d{4}):(\d{2}):(\d{2})/)
    if (m && m[1] !== "0000") return `${m[1]}-${m[2]}-${m[3]}`
  }
  return null
}

// EXIF олдоогүй үеийн нөөц: файлын өөрчлөгдсөн огноо (локал цагаар).
// iPhone-ийн зургийн санд энэ нь ихэвчлэн дарсан огноотой ойролцоо байдаг.
export function fileDateFallback(file: File): string {
  const d = file.lastModified ? new Date(file.lastModified) : new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
