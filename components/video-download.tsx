"use client";

import { useState } from "react";
import { Film } from "lucide-react";
import { Button } from "./ui/button";

// Timelapse бичлэг татах товч. Сервер mp4 үүсгэж өгнө (зургийн тооноос
// хамаараад 1-2 минут) — товчийг түгжиж явцын бичиг харуулна.
export default function VideoDownload({ babyId }: { babyId?: string | null }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const download = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ babyId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setMsg(data?.error || "Бичлэг үүсгэж чадсангүй. Дахин оролдоно уу.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `horom-timelapse-${new Date().toISOString().slice(0, 10)}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Татаж дуустал URL-ийг хүчинтэй үлдээнэ.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setMsg("Сүлжээний алдаа. Дахин оролдоно уу.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" size="sm" onClick={download} disabled={busy}>
        <Film size={15} className="mr-2" />
        {busy ? "Бичлэг бэлдэж байна..." : "Бичлэг татах"}
      </Button>
      {busy && (
        <p className="text-xs text-zinc-400">Зургийн тооноос хамаараад 1-2 минут болно</p>
      )}
      {msg && (
        <p role="alert" className="text-xs text-red-500 text-right max-w-64">{msg}</p>
      )}
    </div>
  );
}
