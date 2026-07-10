import { Suspense } from 'react'
import { RegisterPage } from '@/features/auth/RegisterPage'

export const dynamic = 'force-dynamic'

export default function RegisterRoutePage() {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col items-stretch">
      <Suspense fallback={null}>
        <RegisterPage />
      </Suspense>
    </div>
  )
}
