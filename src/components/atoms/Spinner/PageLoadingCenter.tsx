import { cn } from '@/lib/cn'
import { PAGE_FRAME_CLASS } from '@/lib/layout/pageFrame'
import { Spinner, PAGE_SPINNER_SIZE } from './Spinner'

type PageLoadingCenterProps = {
  size?: number
  /** Align spinner with page content column (uses `PAGE_FRAME_CLASS`). */
  framed?: boolean
  className?: string
}

/** Full-page loading state — spinner centered below the app header (h-14). */
export function PageLoadingCenter({
  size = PAGE_SPINNER_SIZE,
  framed = false,
  className,
}: PageLoadingCenterProps) {
  return (
    <div
      className={cn(
        'flex min-h-[calc(100dvh-3.5rem)] flex-1 items-center justify-center p-8',
        framed && PAGE_FRAME_CLASS,
        className,
      )}
    >
      <Spinner size={size} />
    </div>
  )
}
