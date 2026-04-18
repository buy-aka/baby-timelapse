'use client'

import Timeline from '@/components/timeline'
import UploadPhoto from '@/components/upload-photo'
import { Suspense } from 'react'

export default function Page() {
  return <>
    <Suspense>
      <Timeline />
    </Suspense>
    <UploadPhoto />
  </>
}
