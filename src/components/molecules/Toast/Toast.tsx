'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/cn'

type ToastVariant = 'success' | 'error' | 'info'

export type ToastAction = {
  label: string
  onClick: () => void
}

export type ToastOptions = {
  action?: ToastAction
  /** Default 3000 ms; undo toasts should use ~10000 ms. */
  durationMs?: number
}

interface ToastMessage {
  id: string
  message: string
  variant: ToastVariant
  action?: ToastAction
  durationMs: number
}

type ToastFn = (message: string, variant?: ToastVariant, options?: ToastOptions) => void

let addToastExternal: ToastFn | null = null

export function toast(message: string, variant: ToastVariant = 'success', options?: ToastOptions) {
  addToastExternal?.(message, variant, options)
}

const ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success: 'border-success/30 bg-success text-white',
  error: 'border-destructive/30 bg-destructive text-white',
  info: 'border-info/30 bg-info text-white',
}

const DEFAULT_TOAST_DURATION_MS = 3000

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback<ToastFn>((message, variant = 'success', options) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const durationMs = options?.durationMs ?? DEFAULT_TOAST_DURATION_MS
    setToasts((prev) => [...prev, { id, message, variant, action: options?.action, durationMs }])
    const timer = setTimeout(() => dismiss(id), durationMs)
    timers.current.set(id, timer)
  }, [dismiss])

  useEffect(() => {
    addToastExternal = addToast
    const pending = timers.current
    return () => {
      addToastExternal = null
      pending.forEach(clearTimeout)
      pending.clear()
    }
  }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-100 flex max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const Icon = ICONS[t.variant]
        return (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-2.5 rounded-sm border px-4 py-3 text-sm animate-in slide-in-from-right',
              VARIANT_CLASSES[t.variant],
            )}
            role="status"
          >
            <Icon size={16} className="shrink-0" aria-hidden />
            <span className="min-w-0 flex-1 font-medium">{t.message}</span>
            {t.action ? (
              <button
                type="button"
                onClick={() => {
                  t.action?.onClick()
                  dismiss(t.id)
                }}
                className="shrink-0 rounded-sm border border-white/30 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-white/15"
              >
                {t.action.label}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-white/90 transition-colors hover:text-white"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
