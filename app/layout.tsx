import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import 'leaflet/dist/leaflet.css'
import '@/styles/globals.css'
import { I18nProvider } from '@/providers/I18nProvider'
import { StoreProvider } from '@/providers/StoreProvider'
import { QueryProvider } from '@/providers/QueryProvider'
import { AuthProvider } from '@/providers/AuthProvider'
import { AuthGuard } from '@/providers/AuthGuard'
import { GlobalToast } from '@/providers/GlobalToast'
import { AnalyticsProvider } from '@/providers/AnalyticsProvider'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { LanguageSync } from '@/providers/LanguageSync'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: '2mb CRM',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <QueryProvider>
          <I18nProvider>
            <AuthProvider>
              <StoreProvider>
                <ThemeProvider />
                <LanguageSync />
                <AuthGuard>{children}</AuthGuard>
                <GlobalToast />
                <AnalyticsProvider />
              </StoreProvider>
            </AuthProvider>
          </I18nProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
