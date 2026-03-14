'use client'

import Timeline from '@/components/timeline'
import UploadPhoto from '@/components/upload-photo'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function Page() {
  const [notes, setNotes] = useState<any[] | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data } = await supabase.from('baby_photos').select()
      setNotes(data)
    }
    getData()
  }, [])

  return <>
    <Timeline/>
    <UploadPhoto/>
  </>
}