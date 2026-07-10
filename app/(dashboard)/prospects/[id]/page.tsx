'use client'

import { useParams } from 'next/navigation'
import { ProspectDetailPage } from '@/views/ProspectDetailPage'

export default function ProspectDetailRoute() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : 'unknown'
  return <ProspectDetailPage key={id} />
}
