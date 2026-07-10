import { Suspense } from 'react'
import { LoginPage } from '@/features/auth/LoginPage'

export const dynamic = 'force-dynamic'

export default function LoginRoutePage() {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col items-stretch">
      <Suspense fallback={null}>
        <LoginPage />
      </Suspense>
    </div>
  )
}
