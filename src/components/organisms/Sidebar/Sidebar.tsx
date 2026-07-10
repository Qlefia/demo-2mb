import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

interface SidebarItem {
  icon: LucideIcon
  label: string
  href?: string
  active?: boolean
}

interface SidebarProps {
  items: SidebarItem[]
  header?: string
}

export function Sidebar({ items, header }: SidebarProps) {
  return (
    <aside className="flex w-56 flex-col border-r border-border py-4">
      {header && (
        <div className="mb-4 px-4">
          <span className="text-sm font-semibold">{header}</span>
        </div>
      )}
      <nav className="flex flex-col gap-0.5 px-2">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href ?? '/'}
              className={`flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors ${
                item.active
                  ? 'bg-active font-medium text-foreground'
                  : 'text-muted hover:bg-hover hover:text-foreground'
              }`}
              aria-current={item.active ? 'page' : undefined}
            >
              <Icon size={18} strokeWidth={1.5} />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
