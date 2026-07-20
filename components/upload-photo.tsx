"use client";

import { useRef, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ImagePlus, Upload, X } from "lucide-react";
import { extractExifDate, fileDateFallback } from "@/lib/exif-date";
import { compressImage } from "@/lib/compress-image";

// Сонгосон зураг бүр өөрийн огноотой: EXIF (дарсан огноо) → байхгүй бол
// файлын огноо. Хэрэглэгч зураг бүр дээр нь засаж болно.
type Item = {
  id: string;
  file: File; // шахагдсан хувилбар (бэлэн болмогц солигдоно)
  preview: string;
  date: string; // YYYY-MM-DD
  ready: boolean; // EXIF унших + шахалт дууссан эсэх
  failed?: boolean; // сүүлийн batch-д хуулагдаж чадаагүй
  failMsg?: string; // серверийн буцаасан шалтгаан (ж: огноо давхардсан)
};

export default function UploadPhoto({ babyId, onUploaded }: { babyId?: string | null; onUploaded?: () => void }) {
  const [items, setItems] = useState<Item[]>([]);
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

    const failMsgs = new Map<string, string>();
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
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          failMsgs.set(it.id, data?.error || "Хуулж чадсангүй");
        }
      } catch {
        failMsgs.set(it.id, "Сүлжээний алдаа — дахин оролдоно уу");
      }
      done++;
    }

    setProgress(null);
    setIsLoading(false);

    if (failMsgs.size > 0) {
      // Амжилттайг нь жагсаалтаас хасаад, бүтэлгүйтсэнийг шалтгаантай нь үлдээнэ.
      setItems((prev) => {
        prev.filter((it) => !failMsgs.has(it.id)).forEach((it) => URL.revokeObjectURL(it.preview));
        return prev
          .filter((it) => failMsgs.has(it.id))
          .map((it) => ({ ...it, failed: true, failMsg: failMsgs.get(it.id) }));
      });
      setError(`${failMsgs.size} зураг хуулагдсангүй.`);
    } else {
      clearAll();
      setNote("");
    }

    if (done > failMsgs.size) onUploaded?.();
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
                    <div className="absolute bottom-0 inset-x-0 bg-red-600/90 text-center px-1">
                      <span className="text-[10px] text-white">Хуулагдсангүй</span>
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
                {it.failMsg && (
                  <p className="text-[10px] leading-tight text-red-500">{it.failMsg}</p>
                )}
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
