'use client'

import { Dialog, DialogPanel, DialogTitle, DialogBackdrop, Portal } from '@headlessui/react'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  /** Ignore backdrop click / Escape — close only via footer or X. */
  preventBackdropDismiss?: boolean
  panelClassName?: string
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  preventBackdropDismiss = false,
  panelClassName,
}: ModalProps) {
  const { t } = useTranslation()

  return (
    <Portal>
      <Dialog
        open={open}
        onClose={preventBackdropDismiss ? () => {} : onClose}
        className="relative z-50"
      >
        <DialogBackdrop className="fixed inset-0 bg-[color:var(--ui-scrim)] transition-opacity" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel
            className={cn(
              'flex max-h-[min(90vh,720px)] w-full max-w-md flex-col overflow-hidden rounded-sm border border-border bg-background',
              panelClassName,
            )}
          >
            {title ? (
              <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
                <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t('common.close')}
                  className="text-muted transition-colors hover:text-foreground"
                >
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>
            ) : null}

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">{children}</div>

            {footer ? (
              <div className="flex shrink-0 justify-end gap-3 border-t border-border px-6 py-4">
                {footer}
              </div>
            ) : null}
          </DialogPanel>
        </div>
      </Dialog>
    </Portal>
  )
}
