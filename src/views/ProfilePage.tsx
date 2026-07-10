'use client'

import { Container } from '@/components/atoms'
import { ProfileContent } from '@/features/profile/ProfileContent'

export function ProfilePage() {
  return (
    <Container className="flex min-h-0 w-full max-w-none flex-1 flex-col px-0 py-0">
      <div className="flex min-h-0 flex-1 flex-col">
        <ProfileContent />
      </div>
    </Container>
  )
}
