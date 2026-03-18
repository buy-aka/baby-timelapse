import { useEffect, useState } from "react";
import { createClient } from '@/lib/supabase/client'
import { sign } from "crypto";
import { Input } from "./ui/input";

interface BabyPhoto {
  id: string
  photo_date: string
  file_name: string
  note?: string
}

interface PhotoWithUrl extends BabyPhoto {
  imageUrl: string
}

export default function Timeline() {
    const supabase = createClient()

  const [photos, setPhotos] = useState<PhotoWithUrl[]>([])
  const [startDate, setStartDate] = useState<string>(new Date().toLocaleDateString()); // YYYY-MM-DD

  useEffect(() => {
    loadPhotos()
  }, [])

  useEffect(() => {
    loadPhotos()
  }, [startDate])

  const loadPhotos = async () => {

    const { data, error } = await supabase
      .from("baby_photos")
      .select("*").filter("photo_date", 'lte', startDate)
      .limit(10)
      .order("photo_date", { ascending:false })


      console.log(data)
    if (error || !data) {
      console.error("err", error)
      return
    }

    const withUrls: PhotoWithUrl[] = []

    for (const p of data) {

      const signed = await supabase.storage
        .from("baby-photos")
        .createSignedUrl(p.file_name, 360)

        console.log("signed1",signed)

      if (signed) {
        console.log("signed",signed)
        withUrls.push({
          ...p,
          imageUrl: signed.data?.signedUrl
        })
      }
    }

    setPhotos(withUrls)
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
    <div className="grid grid-cols-2 gap-4 p-4 md:grid-cols-3">
      
      {photos.map(photo => (

        <div key={photo.id} className="border p-2 rounded">

          <img
            src={photo.imageUrl}
            className="rounded"
          />

          <div className="text-sm mt-2">
            {new Date(photo.photo_date).toLocaleDateString()}
          </div>

          {photo.note && (
            <div className="text-xs text-gray-500">
              {photo.note}
            </div>
          )}

        </div>

      ))}

    </div>
    </>
  )
}