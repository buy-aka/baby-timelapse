"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Trash2, Pencil, Check, X, ImageOff, LayoutGrid, AlignJustify, CalendarClock, GitCompare } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

interface BabyPhoto {
  id: string
  photo_date: string
  file_name: string
  note?: string
}

interface EditState {
  note: string
  photo_date: string
}

type ViewMode = "grid" | "feed" | "onthisday" | "compare"

/* ─── Зургийн карт ─────────────────────────────────── */
function PhotoCard({
  photo,
  onDelete,
  onSave,
  large = false,
}: {
  photo: BabyPhoto
  onDelete: (id: string) => void
  onSave: (id: string, state: EditState) => Promise<void>
  large?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [editState, setEditState] = useState<EditState>({
    note: photo.note || "",
    photo_date: photo.photo_date.slice(0, 10),
  })
  const [imgError, setImgError] = useState(false)

  const save = async () => {
    await onSave(photo.id, editState)
    setEditing(false)
  }

  const date = new Date(photo.photo_date).toLocaleDateString("mn-MN", {
    year: "numeric", month: "long", day: "numeric",
  })

  return (
    <div className={`group bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-zinc-100 dark:border-zinc-800 ${large ? "max-w-lg w-full" : ""}`}>
      <div className={`relative ${large ? "aspect-[4/3]" : "aspect-square"} bg-zinc-100 dark:bg-zinc-800 overflow-hidden`}>
        {imgError ? (
          <div className="w-full h-full flex items-center justify-center text-zinc-400">
            <ImageOff size={32} />
          </div>
        ) : (
          <img
            src={photo.file_name}
            alt={photo.note || date}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        {!editing && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200">
            <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button onClick={() => setEditing(true)} className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-zinc-700 flex items-center justify-center shadow transition-colors">
                <Pencil size={13} />
              </button>
              <button onClick={() => onDelete(photo.id)} className="w-8 h-8 rounded-full bg-white/90 hover:bg-red-500 hover:text-white text-zinc-700 flex items-center justify-center shadow transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-3">
        {editing ? (
          <div className="flex flex-col gap-2">
            <Input type="date" value={editState.photo_date} onChange={(e) => setEditState(s => ({ ...s, photo_date: e.target.value }))} className="text-sm h-8" />
            <Textarea value={editState.note} onChange={(e) => setEditState(s => ({ ...s, note: e.target.value }))} placeholder="Тэмдэглэл..." rows={2} className="text-sm resize-none" />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 h-7 text-xs" onClick={save}><Check size={12} className="mr-1" />Хадгалах</Button>
              <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => setEditing(false)}><X size={12} className="mr-1" />Болих</Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{date}</p>
            {photo.note && <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1 leading-snug">{photo.note}</p>}
          </>
        )}
      </div>
    </div>
  )
}

/* ─── Grid горим ────────────────────────────────────── */
function GridView({ onDelete, onSave }: { onDelete: (id: string) => void; onSave: (id: string, s: EditState) => Promise<void> }) {
  const [photos, setPhotos] = useState<BabyPhoto[]>([])
  const [startDate, setStartDate] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!startDate) { setStartDate(new Date().toISOString().split("T")[0]); return }
    setLoading(true)
    fetch(`/api/photos?startDate=${startDate}`)
      .then(r => r.json()).then(setPhotos).finally(() => setLoading(false))
  }, [startDate])

  const handleDelete = (id: string) => { onDelete(id); setPhotos(p => p.filter(x => x.id !== id)) }
  const handleSave = async (id: string, s: EditState) => { await onSave(id, s); setPhotos(p => p.map(x => x.id === id ? { ...x, ...s } : x)) }

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-zinc-500 whitespace-nowrap">Хүртэлх огноо</label>
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-44 h-8 text-sm" />
      </div>
      {loading ? <Skeleton /> : photos.length === 0 ? <Empty /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {photos.map(p => <PhotoCard key={p.id} photo={p} onDelete={handleDelete} onSave={handleSave} />)}
        </div>
      )}
    </>
  )
}

/* ─── Feed горим ────────────────────────────────────── */
function FeedView({ onDelete, onSave }: { onDelete: (id: string) => void; onSave: (id: string, s: EditState) => Promise<void> }) {
  const [photos, setPhotos] = useState<BabyPhoto[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [today] = useState(() => typeof window !== "undefined" ? new Date().toISOString().split("T")[0] : "")
  const loaderRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !today) return
    setLoading(true)
    const res = await fetch(`/api/photos?startDate=${today}&offset=${offset}`)
    const data: BabyPhoto[] = await res.json()
    setPhotos(p => [...p, ...data])
    setOffset(o => o + data.length)
    if (data.length < 10) setHasMore(false)
    setLoading(false)
  }, [loading, hasMore, offset])

  useEffect(() => { loadMore() }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) loadMore() }, { threshold: 0.1 })
    if (loaderRef.current) obs.observe(loaderRef.current)
    return () => obs.disconnect()
  }, [loadMore])

  const handleDelete = (id: string) => { onDelete(id); setPhotos(p => p.filter(x => x.id !== id)) }
  const handleSave = async (id: string, s: EditState) => { await onSave(id, s); setPhotos(p => p.map(x => x.id === id ? { ...x, ...s } : x)) }

  return (
    <div className="flex flex-col items-center gap-4">
      {photos.map(p => <PhotoCard key={p.id} photo={p} onDelete={handleDelete} onSave={handleSave} large />)}
      <div ref={loaderRef} className="py-4">
        {loading && <div className="w-48 h-64 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />}
        {!hasMore && photos.length > 0 && <p className="text-sm text-zinc-400 text-center">Бүгд уншигдлаа</p>}
        {!hasMore && photos.length === 0 && <Empty />}
      </div>
    </div>
  )
}

/* ─── On This Day горим ─────────────────────────────── */
function OnThisDayView({ onDelete, onSave }: { onDelete: (id: string) => void; onSave: (id: string, s: EditState) => Promise<void> }) {
  const [sections, setSections] = useState<{ label: string; date: string; photos: BabyPhoto[] }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date()
    const targets = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(today)
      d.setMonth(d.getMonth() - i)
      return {
        label: i === 0 ? "Өнөөдөр" : `${i} сарын өмнө`,
        date: d.toISOString().split("T")[0],
      }
    })

    Promise.all(
      targets.map(async t => {
        const res = await fetch(`/api/photos?exactDate=${t.date}`)
        const photos: BabyPhoto[] = await res.json()
        return { ...t, photos }
      })
    ).then(results => {
      setSections(results.filter(s => s.photos.length > 0))
      setLoading(false)
    })
  }, [])

  if (loading) return <Skeleton />
  if (sections.length === 0) return <Empty />

  return (
    <div className="flex flex-col gap-8">
      {sections.map(s => (
        <div key={s.date}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{s.label}</span>
            <span className="text-xs text-zinc-400">{new Date(s.date).toLocaleDateString("mn-MN", { year: "numeric", month: "long", day: "numeric" })}</span>
            <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {s.photos.map(p => (
              <PhotoCard key={p.id} photo={p}
                onDelete={(id) => { onDelete(id); setSections(prev => prev.map(sec => ({ ...sec, photos: sec.photos.filter(x => x.id !== id) }))) }}
                onSave={async (id, st) => { await onSave(id, st); setSections(prev => prev.map(sec => ({ ...sec, photos: sec.photos.map(x => x.id === id ? { ...x, ...st } : x) }))) }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Compare горим ─────────────────────────────────── */
function CompareView() {
  const [dateA, setDateA] = useState("")
  const [dateB, setDateB] = useState("")

  useEffect(() => {
    const today = new Date()
    setDateA(today.toISOString().split("T")[0])
    const prev = new Date(today); prev.setMonth(prev.getMonth() - 1)
    setDateB(prev.toISOString().split("T")[0])
  }, [])
  const [photosA, setPhotosA] = useState<BabyPhoto[]>([])
  const [photosB, setPhotosB] = useState<BabyPhoto[]>([])

  useEffect(() => {
    fetch(`/api/photos?exactDate=${dateA}`).then(r => r.json()).then(setPhotosA)
  }, [dateA])

  useEffect(() => {
    fetch(`/api/photos?exactDate=${dateB}`).then(r => r.json()).then(setPhotosB)
  }, [dateB])

  const col = (photos: BabyPhoto[], date: string, setDate: (d: string) => void) => (
    <div className="flex-1 min-w-0">
      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mb-3 text-sm h-8" />
      {photos.length === 0
        ? <div className="flex flex-col items-center justify-center py-16 text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl"><ImageOff size={28} className="mb-2" /><p className="text-xs">Зураг байхгүй</p></div>
        : <div className="flex flex-col gap-3">{photos.map(p => <PhotoCard key={p.id} photo={p} onDelete={() => {}} onSave={async () => {}} />)}</div>
      }
    </div>
  )

  return (
    <div className="flex gap-4">
      {col(photosA, dateA, setDateA)}
      <div className="w-px bg-zinc-200 dark:bg-zinc-700 self-stretch" />
      {col(photosB, dateB, setDateB)}
    </div>
  )
}

/* ─── Туслах компонентууд ───────────────────────────── */
function Skeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {Array.from({ length: 10 }).map((_, i) => <div key={i} className="aspect-square rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}
    </div>
  )
}

function Empty() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
      <ImageOff size={40} className="mb-3" />
      <p className="text-sm">Зураг олдсонгүй</p>
    </div>
  )
}

/* ─── Үндсэн Timeline ───────────────────────────────── */
const MODES: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: "grid",      label: "Grid",      icon: <LayoutGrid size={15} /> },
  { id: "feed",      label: "Feed",      icon: <AlignJustify size={15} /> },
  { id: "onthisday", label: "Өнөөдөр",  icon: <CalendarClock size={15} /> },
  { id: "compare",   label: "Харьцуулах", icon: <GitCompare size={15} /> },
]

export default function Timeline({ refreshKey }: { refreshKey?: number }) {
  const [mode, setMode] = useState<ViewMode>("grid")

  const deletePhoto = async (id: string) => {
    await fetch(`/api/photos/${id}`, { method: "DELETE" })
  }

  const savePhoto = async (id: string, state: EditState) => {
    await fetch(`/api/photos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    })
  }

  return (
    <div className="w-full">
      {/* Mode tabs */}
      <div className="flex gap-1 mb-6 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 w-fit">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              mode === m.id
                ? "bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {m.icon}
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {mode === "grid"      && <GridView      key={refreshKey} onDelete={deletePhoto} onSave={savePhoto} />}
      {mode === "feed"      && <FeedView      key={refreshKey} onDelete={deletePhoto} onSave={savePhoto} />}
      {mode === "onthisday" && <OnThisDayView key={refreshKey} onDelete={deletePhoto} onSave={savePhoto} />}
      {mode === "compare"   && <CompareView />}
    </div>
  )
}
