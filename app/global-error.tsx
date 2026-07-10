'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Inter, system-ui, sans-serif', margin: 0 }}>
        <main
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: '1rem',
            padding: '1rem',
          }}
        >
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Something went wrong</h1>
          <p style={{ fontSize: '0.875rem', color: '#71717a', textAlign: 'center' }}>
            An unexpected error occurred. Please try again or return to the dashboard.
          </p>
          {error.digest && (
            <p style={{ fontFamily: 'monospace', fontSize: '10px', color: '#a1a1aa' }}>
              {error.digest}
            </p>
          )}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={reset}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #e4e4e7',
                borderRadius: '4px',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #e4e4e7',
                borderRadius: '4px',
                background: 'transparent',
                textDecoration: 'none',
                color: 'inherit',
                fontSize: '0.875rem',
              }}
            >
              Back to Dashboard
            </a>
          </div>
        </main>
      </body>
    </html>
  )
}
