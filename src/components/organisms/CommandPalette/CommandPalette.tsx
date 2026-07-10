'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogBackdrop, DialogPanel, Portal } from '@headlessui/react'
import { Search, LayoutDashboard, Layers, Settings, ArrowRight, Users, Calendar } from 'lucide-react'

interface CommandItem {
  id: string
  label: string
  icon: typeof Search
  action: () => void
}

export function CommandPalette() {
  const { t } = useTranslation()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const commands = useMemo<CommandItem[]>(
    () => [
      { id: 'dashboard', label: t('tabs.dashboard'), icon: LayoutDashboard, action: () => router.push('/') },
      { id: 'prospects', label: t('tabs.prospects'), icon: Users, action: () => router.push('/prospects') },
      { id: 'calendar', label: t('tabs.calendar'), icon: Calendar, action: () => router.push('/calendar') },
      { id: 'studio', label: t('tabs.studioSetup'), icon: Layers, action: () => router.push('/settings/studio') },
      { id: 'settings', label: t('common.settings'), icon: Settings, action: () => router.push('/settings') },
    ],
    [router, t],
  )

  const filtered = useMemo(() => {
    if (!query) return commands
    const q = query.toLowerCase()
    return commands.filter((c) => c.label.toLowerCase().includes(q))
  }, [commands, query])

  const handleClose = () => {
    setOpen(false)
    setQuery('')
  }

  const handleSelect = (item: CommandItem) => {
    item.action()
    handleClose()
  }

  return (
    <Portal>
      <Dialog open={open} onClose={handleClose} className="relative z-100">
        <DialogBackdrop className="fixed inset-0 bg-[color:var(--ui-scrim-strong)] transition-opacity" />

        <div className="fixed inset-0 flex items-start justify-center pt-[20vh] p-4">
          <DialogPanel className="w-full max-w-lg overflow-hidden rounded-sm border border-border bg-background">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Search size={16} className="text-muted" aria-hidden />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('commandPalette.placeholder')}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
              />
              <kbd className="rounded border border-border px-1.5 py-0.5 text-xs text-muted">ESC</kbd>
            </div>
            <div className="max-h-64 overflow-y-auto py-2">
              {filtered.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-muted">{t('commandPalette.noResults')}</p>
              )}
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-primary/5"
                >
                  <item.icon size={16} className="text-muted" aria-hidden />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ArrowRight size={12} className="text-muted" aria-hidden />
                </button>
              ))}
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </Portal>
  )
}
