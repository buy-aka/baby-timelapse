"use client";

import { useState, useRef } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ImagePlus, CalendarIcon, Upload, X } from "lucide-react";
import { format } from "date-fns";

export default function UploadPhoto({ onUploaded }: { onUploaded?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [photoDate, setPhotoDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("image/")) handleFile(f);
  };

  const clear = () => {
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const upload = async () => {
    if (!file) { setError("Зураг сонгоно уу"); return; }
    if (!photoDate) { setError("Огноо оруулна уу"); return; }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("note", note);
    formData.append("photoDate", photoDate);

    const res = await fetch("/api/upload", { method: "POST", body: formData });

    if (!res.ok) {
      setError("Upload амжилтгүй. Дахин оролдоно уу.");
      setIsLoading(false);
      return;
    }

    setFile(null);
    setPreview(null);
    setNote("");
    setPhotoDate("");
    setIsLoading(false);
    if (fileRef.current) fileRef.current.value = "";
    onUploaded?.();
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-5 mb-6 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
        Зураг нэмэх
      </h2>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Зураг сонгох хэсэг */}
        <div
          className="relative flex-shrink-0 w-full sm:w-44 h-44 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center cursor-pointer hover:border-zinc-400 transition-colors overflow-hidden"
          onClick={() => !preview && fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {preview ? (
            <>
              <img src={preview} className="w-full h-full object-cover" alt="preview" />
              <button
                onClick={(e) => { e.stopPropagation(); clear(); }}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
              >
                <X size={12} />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-zinc-400">
              <ImagePlus size={28} />
              <span className="text-xs text-center">Зураг чирэх<br />эсвэл дарах</span>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          />
        </div>

        {/* Мэдээлэл оруулах */}
        <div className="flex flex-col gap-3 flex-1">
          <div className="relative">
            <CalendarIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <Input
              type="date"
              value={photoDate}
              onChange={(e) => setPhotoDate(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          <Textarea
            placeholder="Тэмдэглэл бичих..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="text-sm resize-none"
          />

          {error && <p className="text-xs text-red-500">{error}</p>}

          <Button
            onClick={upload}
            disabled={isLoading || !file}
            className="w-full sm:w-auto self-end"
          >
            <Upload size={15} className="mr-2" />
            {isLoading ? "Хуулж байна..." : "Хуулах"}
          </Button>
        </div>
      </div>
    </div>
  );
}
