'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, X, Film } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Spinner } from '@/components/atoms'

/** Keeps aspect-ratio previews from stretching to the full main column on wide screens. */
const CAP_WIDTH: Record<
  'avatar' | 'logo' | 'logoRow' | 'logoMini' | 'banner' | 'hero' | 'portrait' | 'dualHero' | 'dualPortrait',
  string
> = {
  avatar: 'w-full max-w-40',
  logo: 'w-full max-w-44',
  logoRow: 'w-full max-w-[7.5rem] shrink-0 sm:max-w-[8.5rem]',
  logoMini: 'w-36 shrink-0 sm:w-40',
  banner: 'w-full max-w-3xl',
  hero: 'w-full max-w-md',
  portrait: 'w-full max-w-[11rem] sm:max-w-[12rem]',
  dualHero:
    'aspect-auto h-[var(--studio-dual-media-height,10rem)] w-[calc(var(--studio-dual-media-height,10rem)*16/9)] shrink-0',
  dualPortrait:
    'aspect-auto h-[var(--studio-dual-media-height,10rem)] w-[calc(var(--studio-dual-media-height,10rem)*3/4)] shrink-0',
}

interface ImageUploadProps {
  value: string | null
  onChange: (value: string | null) => void
  onUpload?: (file: File) => Promise<string | null>
  accept?: string
  placeholder?: string
  aspect?: '16:9' | '1:1' | '4:3' | '3:4'
  fit?: 'cover' | 'contain'
  className?: string
  /** Sane max width for logos, portraits, or wide banners inside forms. */
  cap?: keyof typeof CAP_WIDTH
}

const aspectClasses: Record<string, string> = {
  '16:9': 'aspect-video',
  '1:1': 'aspect-square',
  '4:3': 'aspect-4/3',
  '3:4': 'aspect-[3/4]',
}

/** Some mobile exports omit `file.type`; fall back to extension before rejecting. */
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|heic|heif|bmp|svg|tiff?)$/i

function looksLikeImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true
  if (file.name.toLowerCase().endsWith('.svg')) return true
  return IMAGE_EXT.test(file.name)
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  accept = 'image/*,image/svg+xml,.svg',
  placeholder = 'Upload image',
  aspect = '16:9',
  fit = 'cover',
  className = '',
  cap,
}: ImageUploadProps) {
  const { t } = useTranslation()
  const isVideo = accept.includes('video')
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const capClass = cap ? CAP_WIDTH[cap] : ''
  const usesDualPairCap = cap === 'dualHero' || cap === 'dualPortrait'
  const aspectClass = usesDualPairCap ? 'aspect-auto' : aspectClasses[aspect]
  const iconSize = cap === 'avatar' ? 20 : cap === 'logoMini' ? 16 : cap === 'logoRow' ? 18 : 24

  const handleChange = (newValue: string | null) => {
    if (value?.startsWith('blob:')) {
      URL.revokeObjectURL(value)
    }
    onChange(newValue)
  }

  const handleFile = async (file?: File) => {
    if (!file) return
    const acceptsVideo = accept.includes('video/')
    const acceptsImage = accept.includes('image') || accept.includes('.svg')
    const isImageFile = looksLikeImageFile(file)
    if (acceptsImage && !acceptsVideo && !isImageFile) return
    if (acceptsVideo && !acceptsImage && !file.type.startsWith('video/')) return
    if (acceptsVideo && acceptsImage && !isImageFile && !file.type.startsWith('video/')) return
    if (onUpload) {
      setUploading(true)
      const url = await onUpload(file)
      setUploading(false)
      if (url) handleChange(url)
    } else {
      handleChange(URL.createObjectURL(file))
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    handleFile(file)
  }

  if (value) {
    return (
      <div
        className={cn(
          'group relative overflow-hidden rounded-[var(--form-field-radius)] border border-border/50',
          cap === 'logoMini' && 'bg-neutral-400',
          aspectClass,
          capClass,
          className,
        )}
      >
        {isVideo ? (
          <video src={value} className="h-full w-full object-cover" />
        ) : (
          <img
            src={value}
            alt=""
            className={cn('h-full w-full', fit === 'contain' ? 'object-contain p-2' : 'object-cover')}
          />
        )}
        <button
          type="button"
          onClick={() => handleChange(null)}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-sm border border-border bg-background text-foreground opacity-0 transition-opacity group-hover:opacity-100"
          aria-label={t('editor.remove')}
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <label
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--form-field-radius)] border border-dashed transition-colors',
        aspectClass,
        capClass,
        isDragging
          ? 'border-foreground/35 bg-muted/45 text-foreground'
          : 'border-border/35 bg-muted/10 text-muted hover:border-foreground/25 hover:bg-muted/25 hover:text-foreground',
        uploading && 'pointer-events-none opacity-60',
        className,
      )}
    >
      {uploading ? (
        <Spinner size={iconSize} className="text-current" />
      ) : isVideo ? (
        <Film size={iconSize} strokeWidth={1.5} />
      ) : (
        <Upload size={iconSize} strokeWidth={1.5} />
      )}
      <span className="max-w-48 text-center text-xs leading-snug">{uploading ? '...' : placeholder}</span>
      <input
        type="file"
        accept={accept}
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          handleFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </label>
  )
}

