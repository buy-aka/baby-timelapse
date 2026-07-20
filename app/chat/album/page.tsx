"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ImagePlus, ImageOff, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressImage } from "@/lib/compress-image";

type AlbumPhoto = {
  id: string;
  file_name: string;
  note: string | null;
  size: number;
  created_at: string;
};

type AlbumData = {
  enabled: boolean;
  plan: string | null;
  usedBytes: number;
  limitBytes: number;
  photos: AlbumPhoto[];
  hasMore: boolean;
};

function formatBytes(n: number): string {
  if (n >= 1024 * 1024 * 1024) return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1) } MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}

export default function AlbumPage() {
  const [data, setData] = useState<AlbumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/album");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const loadMore = async () => {
    if (!data) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/album?offset=${data.photos.length}`);
      if (res.ok) {
        const next: AlbumData = await res.json();
        setData((d) => d && {
          ...next,
          photos: [...d.photos, ...next.photos],
        });
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const upload = async (files: FileList) => {
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;
    setError(null);

    let failed = 0;
    let lastError = "";
    for (let i = 0; i < images.length; i++) {
      setProgress(`${i + 1}/${images.length} хуулж байна...`);
      try {
        const compressed = await compressImage(images[i]);
        const formData = new FormData();
        formData.append("file", compressed);
        const res = await fetch("/api/album", { method: "POST", body: formData });
        if (!res.ok) {
          failed++;
          const body = await res.json().catch(() => null);
          lastError = body?.error || "Хуулж чадсангүй";
          // Квот дүүрсэн бол үлдсэнийг оролдоод нэмэргүй.
          if (res.status === 403) break;
        }
      } catch {
        failed++;
        lastError = "Сүлжээний алдаа";
      }
    }
    setProgress(null);
    if (failed > 0) setError(`${failed} зураг хуулагдсангүй: ${lastError}`);
    await load();
  };

  const remove = async (photo: AlbumPhoto) => {
    if (!confirm("Энэ зургийг цомгоос бүрмөсөн устгах уу?")) return;
    const res = await fetch(`/api/album/${photo.id}`, { method: "DELETE" });
    if (res.ok) {
      setData((d) => d && {
        ...d,
        photos: d.photos.filter((p) => p.id !== photo.id),
        usedBytes: Math.max(0, d.usedBytes - photo.size),
      });
    }
  };

  if (loading && !data) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const pct = Math.min(100, Math.round((data.usedBytes / data.limitBytes) * 100));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-bold">Цомог</h1>
        {data.enabled && (
          <span className="text-xs text-zinc-500">
            {formatBytes(data.usedBytes)} / {formatBytes(data.limitBytes)}
          </span>
        )}
      </div>
      <p className="text-sm text-zinc-500 mb-4">
        Timelapse-ээс тусдаа — өдрийн хязгааргүй, дурсамжаа чөлөөтэй хадгална.
      </p>

      {data.enabled ? (
        <>
          {/* Ашиглалтын хэмжүүр */}
          <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4 overflow-hidden">
            <div
              className={`h-full rounded-full ${pct > 90 ? "bg-red-500" : "bg-emerald-500"}`}
              style={{ width: `${Math.max(pct, 1)}%` }}
            />
          </div>

          <div
            className="relative w-full rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center cursor-pointer hover:border-zinc-400 transition-colors py-6 mb-4"
            onClick={() => fileRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files); }}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="flex flex-col items-center gap-1.5 text-zinc-400">
              <ImagePlus size={26} />
              <span className="text-xs text-center">
                {progress ?? "Зураг чирэх эсвэл дарж сонгох — олныг зэрэг сонгож болно"}
              </span>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => { if (e.target.files?.length) upload(e.target.files); e.target.value = ""; }}
            />
          </div>

          {error && <p role="alert" className="text-xs text-red-500 mb-4">{error}</p>}
        </>
      ) : (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-5 mb-5">
          <div className="flex items-start gap-3">
            <Sparkles size={18} className="text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                Цомог нь Plus багцын боломж
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                Plus багцаар timelapse-ээс гадна 20GB хүртэлх тусдаа цомогт дурсамжаа
                хязгааргүй хадгална.
              </p>
              <Button asChild size="sm" className="mt-3">
                <Link href="/settings/billing">Plus багц идэвхжүүлэх</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {data.photos.length === 0 ? (
        data.enabled && (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
            <ImageOff size={40} className="mb-3" />
            <p className="text-sm">Цомог хоосон байна</p>
          </div>
        )
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {data.photos.map((p) => (
              <div
                key={p.id}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/image/${p.file_name}`}
                  alt={p.note || ""}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => remove(p)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-red-500 hover:text-white text-zinc-700 hidden group-hover:flex items-center justify-center shadow transition-colors"
                  aria-label="Зураг устгах"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          {data.hasMore && (
            <div className="flex justify-center mt-6">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? "Уншиж байна..." : "Цааш үзэх"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
