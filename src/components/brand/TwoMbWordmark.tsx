/**
 * 2mb.studio wordmark — use `className="text-[#E8E8E8]"` or `text-[#D99E6A]` on dark surfaces.
 * Paths use currentColor for brand flexibility.
 */
export function TwoMbWordmark({
  className,
  title = '2mb.studio',
}: {
  className?: string
  title?: string
}) {
  return (
    <svg
      className={className}
      width="100%"
      height="100%"
      viewBox="0 0 175 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role="img"
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M10.4386 0.120931H0V3.99073H13.0175V6.65121H0V17.0513H16.9474V13.1815H3.92982V10.521H16.9474V3.99073L10.4386 0.120931Z"
        fill="currentColor"
      />
      <path
        d="M19.7719 17.0513V0.120931H30.4561L36.5965 3.99073V0.120931H43.4737L49.9825 3.99073V17.0513H45.807V3.99073H36.5965V17.0513H32.5439V3.99073H23.4561V17.0513H19.7719Z"
        fill="currentColor"
      />
      <path d="M72.2105 17.0513V13.1815H76.1403V17.0513H72.2105Z" fill="currentColor" />
      <path
        d="M78.8421 13.1815V17.0513H89.1579L95.9123 13.1815V6.53028H82.7719V3.99073H95.9123V0H85.4737L78.8421 3.99073V10.2791H92.1053V13.1815H78.8421Z"
        fill="currentColor"
      />
      <path
        d="M98.614 13.1815V0H102.421V1.33024H109.053V5.32097H102.421V13.1815H109.053V17.0513H105L98.614 13.1815Z"
        fill="currentColor"
      />
      <path
        d="M111.754 17.0513V0H115.684V13.1815H124.895V0H128.825V13.1815L122.193 17.0513H111.754Z"
        fill="currentColor"
      />
      <path d="M151.298 17.0513V0H155.228V17.0513H151.298Z" fill="currentColor" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M131.404 0V17.0513H141.965L148.719 13.1815V3.99073L141.965 0H131.404ZM135.456 13.1815V3.99073H144.789V13.1815H135.456Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M157.93 3.99073V13.1815L164.439 17.0513H168.491L175 13.1815V3.99073L168.491 0H164.439L157.93 3.99073ZM161.737 13.1815V3.99073H171.07V13.1815H161.737Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M52.5614 0.120931V17.0513H63.1228L69.5088 13.1815V10.2791L66.5614 8.46517L69.5088 6.65121V3.99073L63.1228 0.120931H52.5614ZM56.3684 6.40935V3.99073H65.5789V6.40935H56.3684ZM56.3684 10.521V13.1815H65.5789V10.521H56.3684Z"
        fill="currentColor"
      />
    </svg>
  )
}
