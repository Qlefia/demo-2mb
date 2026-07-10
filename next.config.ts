import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Avoid picking C:\Users\<you>\package-lock.json when multiple lockfiles exist.
  turbopack: {
    root: projectRoot,
  },

  allowedDevOrigins: ['127.0.0.1', 'localhost'],

  async redirects() {
    return [
      { source: '/settings/studio/services', destination: '/settings/studio/sales/services', permanent: false },
      {
        source: '/settings/studio/services/:groupId',
        destination: '/settings/studio/sales/groups/:groupId',
        permanent: false,
      },
      { source: '/settings/studio/works', destination: '/settings/studio/sales/works', permanent: false },
      {
        source: '/settings/studio/works/:workId',
        destination: '/settings/studio/sales/works/:workId',
        permanent: false,
      },
      { source: '/settings/studio/reviews', destination: '/settings/studio/sales/reviews', permanent: false },
      {
        source: '/demo/projects/residence-tower/configure',
        destination: '/demo/projects/urban-oasis/configure',
        permanent: false,
      },
    ]
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'adiptvvvorqtpxpcylcn.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // OpenStreetMap tile servers (a/b/c.tile.openstreetmap.org) and
              // unpkg.com (Leaflet's default marker icon + shadow) are needed
              // by the office-detail map picker at /settings/studio/offices/[id].
              // See `StudioOfficeMapPicker.tsx`.
              "img-src 'self' blob: data: https://*.supabase.co https://*.tile.openstreetmap.org https://unpkg.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://nominatim.openstreetmap.org",
              "font-src 'self' data: https://fonts.gstatic.com",
              "media-src 'self' blob: https://*.supabase.co",
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://kuula.co https://*.kuula.co https://2mb-studio.de https://*.2mb-studio.de",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
