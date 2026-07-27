'use client'

import { useEffect, useState } from 'react'
import Timeline from '@/components/timeline'
import UploadPhoto from '@/components/upload-photo'
import BabySelector, { type BabyOption } from '@/components/baby-selector'
import VideoDownload from '@/components/video-download'
import { PendingInviteBanner } from '@/components/pending-invite-banner'

export default function Page() {
  const [babies, setBabies] = useState<BabyOption[]>([])
  const [selectedBabyId, setSelectedBabyId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    fetch('/api/babies').then(r => r.json()).then((data: BabyOption[]) => {
      setBabies(data)
      if (data.length > 0 && !selectedBabyId) setSelectedBabyId(data[0].id)
    })
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-4">
        <PendingInviteBanner />
      </div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <BabySelector
          babies={babies}
          value={selectedBabyId}
          onChange={setSelectedBabyId}
        />
        <VideoDownload babyId={selectedBabyId} />
      </div>

      <UploadPhoto
        babyId={selectedBabyId}
        onUploaded={() => setRefreshKey(k => k + 1)}
      />
      <Timeline
        key={`${selectedBabyId}-${refreshKey}`}
        babyId={selectedBabyId}
      />
    </div>
  )
}
