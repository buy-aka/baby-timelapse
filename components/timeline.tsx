import { useEffect, useState } from "react";
import { Input } from "./ui/input";

interface BabyPhoto {
  id: string
  photo_date: string
  file_name: string
  note?: string
}

export default function Timeline() {
  const [photos, setPhotos] = useState<BabyPhoto[]>([])
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  )

  useEffect(() => {
    loadPhotos()
  }, [startDate])

  const loadPhotos = async () => {
    const res = await fetch(`/api/photos?startDate=${startDate}`)
    if (!res.ok) return
    const data = await res.json()
    setPhotos(data)
  }

  return (
    <>
      Эхлэх огноо
      <Input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="border p-2"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
        {photos.map(photo => (
          <div key={photo.id} className="border p-2 rounded">
            <img
              src={photo.file_name}
              className="w-full h-auto rounded"
            />
            <div className="text-sm mt-2">
              {new Date(photo.photo_date).toLocaleDateString()}
            </div>
            {photo.note && (
              <div className="text-xs text-gray-500">{photo.note}</div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
