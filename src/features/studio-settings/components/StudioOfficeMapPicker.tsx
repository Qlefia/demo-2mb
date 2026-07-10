'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react'
import { useTranslation } from 'react-i18next'
import { MapContainer, Marker, TileLayer, useMap, useMapEvent } from 'react-leaflet'
import L from 'leaflet'
import { Crosshair, MapPin } from 'lucide-react'
import { Input, Button, Spinner } from '@/components/atoms'
import { cn } from '@/lib/cn'
import { studioRadiusBlock } from '@/features/studio-settings/studioBlockChrome'

const DEFAULT_CENTER: [number, number] = [52.52, 13.405]
const DEFAULT_ZOOM = 12
const PINNED_ZOOM = 15
const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search'
const NOMINATIM_LIMIT = 5

type NominatimResult = {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

type StudioOfficeMapPickerProps = {
  latitude: number | null
  longitude: number | null
  onChange: (next: { latitude: number; longitude: number }) => void
  onClear?: () => void
  /** Pre-filled query for the search input (e.g. street + city). */
  defaultQuery?: string
}

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function MapClickHandler({
  onPick,
}: {
  onPick: (latlng: { lat: number; lng: number }) => void
}) {
  useMapEvent('click', (event) => {
    onPick({ lat: event.latlng.lat, lng: event.latlng.lng })
  })
  return null
}

function MapRecenterer({
  center,
  zoom,
}: {
  center: [number, number]
  zoom: number
}) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom, { animate: true })
  }, [center, zoom, map])
  return null
}

export function StudioOfficeMapPicker({
  latitude,
  longitude,
  onChange,
  onClear,
  defaultQuery,
}: StudioOfficeMapPickerProps) {
  const { t, i18n } = useTranslation()
  const [query, setQuery] = useState(defaultQuery ?? '')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const hasPin = latitude !== null && longitude !== null
  const center: [number, number] = hasPin ? [latitude, longitude] : DEFAULT_CENTER
  const zoom = hasPin ? PINNED_ZOOM : DEFAULT_ZOOM

  const acceptLanguage = useMemo(() => {
    const lang = i18n.language || 'en'
    return `${lang},en;q=0.8`
  }, [i18n.language])

  const handleSearch = useCallback(async () => {
    const needle = query.trim()
    if (needle.length === 0) {
      setResults([])
      setSearchError(null)
      return
    }
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    setIsSearching(true)
    setSearchError(null)
    try {
      const url = new URL(NOMINATIM_ENDPOINT)
      url.searchParams.set('q', needle)
      url.searchParams.set('format', 'jsonv2')
      url.searchParams.set('limit', String(NOMINATIM_LIMIT))
      const res = await fetch(url.toString(), {
        signal: ac.signal,
        headers: { 'Accept-Language': acceptLanguage },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as NominatimResult[]
      setResults(data)
      if (data.length === 0) {
        setSearchError(t('studioSettings.general.offices.map.noResults'))
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setSearchError(t('studioSettings.general.offices.map.searchError'))
      setResults([])
    } finally {
      if (!ac.signal.aborted) setIsSearching(false)
    }
  }, [query, acceptLanguage, t])

  const handlePick = useCallback(
    (lat: number, lng: number) => {
      onChange({ latitude: lat, longitude: lng })
    },
    [onChange],
  )

  const handleResultClick = useCallback(
    (r: NominatimResult) => {
      const lat = Number.parseFloat(r.lat)
      const lng = Number.parseFloat(r.lon)
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        handlePick(lat, lng)
        setResults([])
      }
    },
    [handlePick],
  )

  const handleQueryChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }, [])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        void handleSearch()
      }
    },
    [handleSearch],
  )

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          placeholder={t('studioSettings.general.offices.map.searchPlaceholder')}
          className="flex-1"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void handleSearch()}
          disabled={isSearching || query.trim().length === 0}
          className="gap-1.5"
        >
          {isSearching ? (
            <Spinner size={14} className="text-current" />
          ) : (
            <MapPin size={14} aria-hidden />
          )}
          {t('studioSettings.general.offices.map.searchButton')}
        </Button>
      </div>

      {results.length > 0 ? (
        <ul
          className={cn(
            'max-h-44 divide-y divide-border/60 overflow-y-auto border border-border bg-background',
            studioRadiusBlock,
          )}
        >
          {results.map((r) => (
            <li key={r.place_id}>
              <button
                type="button"
                onClick={() => handleResultClick(r)}
                className="block w-full px-3 py-2 text-left text-xs leading-snug text-foreground hover:bg-hover"
              >
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {searchError ? <p className="text-xs text-destructive">{searchError}</p> : null}

      <div
        className={cn(
          'relative h-72 w-full overflow-hidden border border-border',
          studioRadiusBlock,
        )}
      >
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onPick={({ lat, lng }) => handlePick(lat, lng)} />
          {hasPin ? <MapRecenterer center={[latitude, longitude]} zoom={PINNED_ZOOM} /> : null}
          {hasPin ? (
            <Marker
              position={[latitude, longitude]}
              icon={markerIcon}
              draggable
              eventHandlers={{
                dragend: (event) => {
                  const m = event.target as L.Marker
                  const p = m.getLatLng()
                  handlePick(p.lat, p.lng)
                },
              }}
            />
          ) : null}
        </MapContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        {hasPin ? (
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Crosshair size={12} aria-hidden />
            {t('studioSettings.general.offices.pinnedAt', {
              lat: latitude.toFixed(5),
              lng: longitude.toFixed(5),
            })}
          </span>
        ) : (
          <span>{t('studioSettings.general.offices.map.hint')}</span>
        )}
        {hasPin && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-muted underline-offset-2 hover:text-foreground hover:underline"
          >
            {t('studioSettings.general.offices.map.clearPin')}
          </button>
        ) : null}
      </div>
    </div>
  )
}
