/**
 * Client instrumentation — runs before the app hydrates AND before Next.js
 * registers its dev-overlay error handlers (`handleGlobalErrors` in
 * `next-devtools/.../use-error-handler`). See `app-next-turbopack.js`:
 * `require('../lib/require-instrumentation-client')` executes before
 * `appBootstrap(...)`.
 *
 * Why this exists: TanStack Query v5 + React 19 (Strict Mode) abort an
 * in-flight fetch when a `QueryObserver` is destroyed mid-flight
 * (mount → unmount → mount). The abort surfaces as an *unhandled* promise
 * rejection (`AbortError: signal is aborted without reason` or the internal
 * `CancelledError`) that no consumer reads. Next's `onUnhandledRejection`
 * does NOT honour `event.preventDefault()`, so the only way to keep the dev
 * overlay from flashing this benign cancellation is to run first and call
 * `stopImmediatePropagation()` before Next's listener executes.
 *
 * Genuine fetch/network failures never reach here — TanStack rejects them
 * inside the `queryFn` promise and routes them to the query's `error` state.
 */
function isBenignAbortRejection(reason: unknown): boolean {
  if (!reason || typeof reason !== 'object') return false
  const name = 'name' in reason ? String((reason as { name?: unknown }).name) : ''
  const message = 'message' in reason ? String((reason as { message?: unknown }).message) : ''
  if (name === 'AbortError' || name === 'CancelledError') return true
  if (message === 'signal is aborted without reason') return true
  return false
}

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    if (isBenignAbortRejection(event.reason)) {
      event.stopImmediatePropagation()
      event.preventDefault()
    }
  })
}
