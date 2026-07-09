"use client";

import { useRef, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ImagePlus, Upload, X } from "lucide-react";
import { extractExifDate, fileDateFallback } from "@/lib/exif-date";

// Сонгосон зураг бүр өөрийн огноотой: EXIF (дарсан огноо) → байхгүй бол
// файлын огноо. Хэрэглэгч зураг бүр дээр нь засаж болно.
type Item = {
  id: string;
  file: File; // шахагдсан хувилбар (бэлэн болмогц солигдоно)
  preview: string;
  date: string; // YYYY-MM-DD
  ready: boolean; // EXIF унших + шахалт дууссан эсэх
  failed?: boolean; // сүүлийн batch-д хуулагдаж чадаагүй
};

export default function UploadPhoto({ babyId, onUploaded }: { babyId?: string | null; onUploaded?: () => void }) {
  const [items, setItems] = useState<Item[]>([]);
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const compressImage = (f: File): Promise<File> =>
    new Promise((resolve) => {
      const TARGET = 4 * 1024 * 1024 // 4MB — Верцелийн 4.5MB хязгаараас доор
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

  const addFiles = (files: FileList | File[]) => {
    setError(null);
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;

    for (const f of images) {
      const id = crypto.randomUUID();
      const preview = URL.createObjectURL(f);
      // Жагсаалтад шууд нэмээд EXIF/шахалтыг ард нь хийнэ (олон том зурагт
      // interface хөлдөхгүй).
      setItems((prev) => [
        ...prev,
        { id, file: f, preview, date: fileDateFallback(f), ready: false },
      ]);

      (async () => {
        // Огноог ЭХЛЭЭД уншина — шахахад EXIF устдаг.
        const exifDate = await extractExifDate(f);
        const compressed = await compressImage(f);
        setItems((prev) =>
          prev.map((it) =>
            it.id === id
              ? { ...it, file: compressed, date: exifDate ?? it.date, ready: true }
              : it,
          ),
        );
      })();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const it = prev.find((x) => x.id === id);
      if (it) URL.revokeObjectURL(it.preview);
      return prev.filter((x) => x.id !== id);
    });
  };

  const setItemDate = (id: string, date: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, date } : it)));
  };

  const clearAll = () => {
    items.forEach((it) => URL.revokeObjectURL(it.preview));
    setItems([]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const upload = async () => {
    if (items.length === 0) { setError("Зураг сонгоно уу"); return; }
    if (items.some((it) => !it.date)) { setError("Зураг бүрийн огноог оруулна уу"); return; }

    setIsLoading(true);
    setError(null);

    const failedIds: string[] = [];
    let done = 0;
    for (const it of items) {
      setProgress(`${done + 1}/${items.length} хуулж байна...`);
      try {
        const formData = new FormData();
        formData.append("file", it.file);
        formData.append("note", note);
        formData.append("photoDate", it.date);
        if (babyId) formData.append("babyId", babyId);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) failedIds.push(it.id);
      } catch {
        failedIds.push(it.id);
      }
      done++;
    }

    setProgress(null);
    setIsLoading(false);

    if (failedIds.length > 0) {
      // Амжилттайг нь жагсаалтаас хасаад, бүтэлгүйтсэнийг үлдээнэ.
      setItems((prev) => {
        prev.filter((it) => !failedIds.includes(it.id)).forEach((it) => URL.revokeObjectURL(it.preview));
        return prev
          .filter((it) => failedIds.includes(it.id))
          .map((it) => ({ ...it, failed: true }));
      });
      setError(`${failedIds.length} зураг хуулагдсангүй — дахин оролдоно уу.`);
    } else {
      clearAll();
      setNote("");
    }

    if (done > failedIds.length) onUploaded?.();
  };

  const allReady = items.every((it) => it.ready);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-5 mb-6 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
        Зураг нэмэх
      </h2>

      <div className="flex flex-col gap-4">
        {/* Зураг сонгох талбар */}
        <div
          className="relative w-full rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center cursor-pointer hover:border-zinc-400 transition-colors py-6"
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="flex flex-col items-center gap-1.5 text-zinc-400">
            <ImagePlus size={26} />
            <span className="text-xs text-center">
              Зураг чирэх эсвэл дарж сонгох — олныг зэрэг сонгож болно
            </span>
            <span className="text-[11px] text-zinc-400/80">
              Огноо нь зургийн мэдээллээс (EXIF) автоматаар бөглөгдөнө
            </span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }}
          />
        </div>

        {/* Сонгосон зургууд — тус бүр өөрийн огноотой */}
        {items.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {items.map((it) => (
              <div
                key={it.id}
                className={`relative w-32 flex flex-col gap-1.5 ${it.failed ? "opacity-90" : ""}`}
              >
                <div className="relative h-24 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.preview} className="w-full h-full object-cover" alt="" />
                  {!it.ready && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-[10px] text-white">Бэлдэж байна...</span>
                    </div>
                  )}
                  {it.failed && (
                    <div className="absolute bottom-0 inset-x-0 bg-red-600/90 text-center">
                      <span className="text-[10px] text-white">Дахин оролдоно уу</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(it.id)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                    aria-label="Зураг хасах"
                  >
                    <X size={11} />
                  </button>
                </div>
                <Input
                  type="date"
                  value={it.date}
                  onChange={(e) => setItemDate(it.id, e.target.value)}
                  className="h-8 px-2 text-xs"
                  aria-label="Зурагны огноо"
                />
              </div>
            ))}
          </div>
        )}

        <Textarea
          placeholder={items.length > 1 ? "Тэмдэглэл (бүх зурагт хамаарна)..." : "Тэмдэглэл бичих..."}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="text-sm resize-none"
        />

        {error && <p role="alert" className="text-xs text-red-500">{error}</p>}

        <div className="flex items-center justify-between gap-3">
          {items.length > 1 ? (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              Бүгдийг арилгах
            </button>
          ) : <span />}

          <Button onClick={upload} disabled={isLoading || items.length === 0 || !allReady}>
            <Upload size={15} className="mr-2" />
            {isLoading
              ? progress ?? "Хуулж байна..."
              : !allReady && items.length > 0
                ? "Бэлдэж байна..."
                : items.length > 1
                  ? `${items.length} зураг хуулах`
                  : "Хуулах"}
          </Button>
        </div>
      </div>
    </div>
  );
}
