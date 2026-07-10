import Link from 'next/link'
import { TwoMbWordmark } from '@/components/brand/TwoMbWordmark'
import { cn } from '@/lib/cn'

type AppBrandMarkLinkProps = {
  href?: string
  className?: string
}

/** CRM chrome wordmark — brand ink #151515 on light surfaces. */
export function AppBrandMarkLink({ href = '/', className }: AppBrandMarkLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex shrink-0 items-center rounded-sm transition-opacity hover:opacity-80',
        className,
      )}
      aria-label="2mb CRM"
    >
      <span className="inline-flex aspect-[175/18] h-[20px] w-auto">
        <TwoMbWordmark className="h-full w-full text-[#151515] dark:text-[#E8E8E8]" title="" />
      </span>
    </Link>
  )
}
