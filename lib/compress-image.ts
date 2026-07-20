// Browser талд canvas-аар JPEG болгож шахна. АНХААР: canvas нь EXIF-г
// устгадаг тул огноо унших (lib/exif-date.ts) ажлыг ЭХЛЭЭД хийнэ.
export function compressImage(f: File): Promise<File> {
  return new Promise((resolve) => {
    const TARGET = 4 * 1024 * 1024 // 4MB — nginx-ийн 10M хязгаараас хол доор
    const img = new Image()
    const url = URL.createObjectURL(f)

    img.onload = async () => {
      URL.revokeObjectURL(url)

      // Файл аль хэдийн хангалттай жижиг бол шахахгүй
      if (f.size <= TARGET) { resolve(f); return }

      const toBlob = (w: number, h: number, q: number): Promise<Blob> =>
        new Promise((res) => {
          const canvas = document.createElement("canvas")
          canvas.width = w; canvas.height = h
          canvas.getContext("2d")!.drawImage(img, 0, 0, w, h)
          canvas.toBlob((b) => res(b!), "image/jpeg", q)
        })

      // Эхний таамаглал: файлын хэмжээний харьцаагаар scale тооцно
      let scale = Math.sqrt(TARGET / f.size)
      let quality = 0.92
      let w = Math.round(img.width * scale)
      let h = Math.round(img.height * scale)

      let blob = await toBlob(w, h, quality)

      // Хэтэрсэн бол чанар болон хэмжээг ижил дарааллаар бууруулна
      while (blob.size > TARGET && quality > 0.3) {
        quality -= 0.08
        blob = await toBlob(w, h, quality)

        // Чанар хангалтгүй болвол хэмжээг ч бас багасгана
        if (blob.size > TARGET && quality <= 0.5) {
          scale *= 0.8
          w = Math.round(img.width * scale)
          h = Math.round(img.height * scale)
        }
      }

      resolve(new File([blob], f.name, { type: "image/jpeg" }))
    }

    img.onerror = () => { URL.revokeObjectURL(url); resolve(f) }
    img.src = url
  })
}
