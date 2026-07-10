'use client'

import { useId } from 'react'
import type { SVGProps } from 'react'
import { cn } from '@/lib/cn'

export function CornerRadiusIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  const clipId = `corner-icon-clip-${useId().replace(/:/g, '')}`

  return (
    <svg
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden
      {...props}
    >
      <defs>
        <clipPath id={clipId}>
          <rect width="20" height="20" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`} fill="currentColor">
        <path
          d="M4,14.5H2A2.5,2.5,0,0,1-.5,12V10A.5.5,0,0,1,0,9.5a.5.5,0,0,1,.5.5v2A1.5,1.5,0,0,0,2,13.5H4a.5.5,0,0,1,0,1Z"
          transform="translate(3 3)"
        />
        <path
          d="M4,14.5H2A2.5,2.5,0,0,1-.5,12V10A.5.5,0,0,1,0,9.5a.5.5,0,0,1,.5.5v2A1.5,1.5,0,0,0,2,13.5H4a.5.5,0,0,1,0,1Z"
          transform="translate(17 17) rotate(180)"
        />
        <path
          d="M4,14.5H2A2.5,2.5,0,0,1-.5,12V10A.5.5,0,0,1,0,9.5a.5.5,0,0,1,.5.5v2A1.5,1.5,0,0,0,2,13.5H4a.5.5,0,0,1,0,1Z"
          transform="translate(3 17) rotate(-90)"
        />
        <path
          d="M4,14.5H2A2.5,2.5,0,0,1-.5,12V10A.5.5,0,0,1,0,9.5a.5.5,0,0,1,.5.5v2A1.5,1.5,0,0,0,2,13.5H4a.5.5,0,0,1,0,1Z"
          transform="translate(17 3) rotate(90)"
        />
      </g>
    </svg>
  )
}
