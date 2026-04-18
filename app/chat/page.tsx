'use client'

import { useState } from 'react'
import Timeline from '@/components/timeline'
import UploadPhoto from '@/components/upload-photo'

export default function Page() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <UploadPhoto onUploaded={() => setRefreshKey(k => k + 1)} />
      <Timeline key={refreshKey} />
    </div>
  )
}
