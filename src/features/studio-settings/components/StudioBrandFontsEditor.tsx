'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2, Upload } from 'lucide-react'
import { Button, IconButton, Input, Label } from '@/components/atoms'
import { Select } from '@/components/molecules/Select'
import { StudioFieldHeader } from '@/features/studio-settings/components'
import { STUDIO_BRAND_KIT_MAX_FONTS } from '@/features/studio-settings/constants'
import { pickStudioBrandFontDataUrl } from '@/features/studio-settings/lib/studioBrandFontPick'
import {
  STUDIO_POPULAR_GOOGLE_FONTS,
  STUDIO_SYSTEM_FONT_OPTIONS,
  brandFontCssFamily,
  googleFontStylesheetHref,
} from '@/features/studio-settings/lib/studioBrandFontsCatalog'
import { studioBrandKitNewId } from '@/features/studio-settings/lib/studioBrandKitHelpers'
import { studioFieldStack, studioTintPanel } from '@/features/studio-settings/studioBlockChrome'
import { cn } from '@/lib/cn'
import type { StudioBrandFont } from '@/stores/studioProfileTypes'

type FontLibraryTab = 'google' | 'system'

type StudioBrandFontsEditorProps = {
  fonts: StudioBrandFont[]
  accentFontId: string | null
  bodyFontId: string | null
  onChange: (patch: {
    fonts?: StudioBrandFont[]
    accentFontId?: string | null
    bodyFontId?: string | null
  }) => void
}

function previewSample(t: (key: string) => string): string {
  return t('studioSettings.brandKit.fontPreviewSample')
}

function injectUploadedFontFace(font: StudioBrandFont): void {
  if (font.source !== 'upload' || !font.fontDataUrl) return
  const id = `brand-font-face-${font.id}`
  if (document.getElementById(id)) return
  const style = document.createElement('style')
  style.id = id
  style.textContent = `@font-face{font-family:"brand-font-${font.id}";src:url("${font.fontDataUrl}");font-display:swap;}`
  document.head.appendChild(style)
}

function injectGoogleFontLink(family: string): void {
  const id = `brand-google-font-${family.replace(/\s+/g, '-')}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = googleFontStylesheetHref(family)
  document.head.appendChild(link)
}

function fontCss(font: StudioBrandFont): string {
  if (font.source === 'upload' && font.fontDataUrl) {
    return brandFontCssFamily(font.id, font.family)
  }
  return `"${font.family.replace(/"/g, '')}", sans-serif`
}

export function StudioBrandFontsEditor({
  fonts,
  accentFontId,
  bodyFontId,
  onChange,
}: StudioBrandFontsEditorProps) {
  const { t } = useTranslation()
  const uploadRef = useRef<HTMLInputElement>(null)
  const [libraryTab, setLibraryTab] = useState<FontLibraryTab>('google')
  const [googleFilter, setGoogleFilter] = useState('')
  const [customGoogleFamily, setCustomGoogleFamily] = useState('')

  useEffect(() => {
    for (const font of fonts) {
      if (font.source === 'upload') injectUploadedFontFace(font)
      if (font.source === 'google') injectGoogleFontLink(font.family)
    }
  }, [fonts])

  const fontOptions = useMemo(
    () =>
      fonts.map((f) => ({
        value: f.id,
        label: f.family.trim() || t('studioSettings.brandKit.untitledKit'),
      })),
    [fonts, t],
  )

  const filteredGoogle = useMemo(() => {
    const q = googleFilter.trim().toLowerCase()
    return STUDIO_POPULAR_GOOGLE_FONTS.filter((f) => !q || f.toLowerCase().includes(q))
  }, [googleFilter])

  const hasFamily = (family: string, source: StudioBrandFont['source']) =>
    fonts.some((f) => f.family.toLowerCase() === family.toLowerCase() && f.source === source)

  const addFont = (family: string, source: StudioBrandFont['source'], fontDataUrl: string | null = null) => {
    if (fonts.length >= STUDIO_BRAND_KIT_MAX_FONTS) return
    if (hasFamily(family, source)) return
    const row: StudioBrandFont = {
      id: studioBrandKitNewId(),
      family,
      source,
      fontDataUrl,
    }
    const rolePatch =
      fonts.length === 0
        ? { bodyFontId: row.id }
        : !accentFontId
          ? { accentFontId: row.id }
          : !bodyFontId
            ? { bodyFontId: row.id }
            : {}
    onChange({ fonts: [...fonts, row], ...rolePatch })
  }

  const removeFont = (fontId: string) => {
    onChange({
      fonts: fonts.filter((f) => f.id !== fontId),
      accentFontId: accentFontId === fontId ? null : accentFontId,
      bodyFontId: bodyFontId === fontId ? null : bodyFontId,
    })
  }

  const handleUpload = async (file: File) => {
    const picked = await pickStudioBrandFontDataUrl(file, t)
    if (!picked) return
    addFont(picked.family, 'upload', picked.dataUrl)
  }

  const libraryTabClass = (tab: FontLibraryTab) =>
    cn(
      'rounded-md px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition-colors',
      libraryTab === tab ? 'bg-active text-foreground' : 'text-muted hover:bg-hover hover:text-foreground',
    )

  return (
    <div className="space-y-6">
      <div className={cn(studioTintPanel, 'space-y-3 p-4')}>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {t('studioSettings.brandKit.typographyRolesTitle')}
        </p>
        <p className="text-xs text-muted">{t('studioSettings.brandKit.typographyRolesHint')}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className={studioFieldStack}>
            <Label>{t('studioSettings.brandKit.accentFontLabel')}</Label>
            <Select
              value={accentFontId ?? ''}
              onChange={(v) => onChange({ accentFontId: v || null })}
              options={fontOptions}
              placeholder={t('studioSettings.brandKit.pickFontPlaceholder')}
              disabled={fonts.length === 0}
            />
          </div>
          <div className={studioFieldStack}>
            <Label>{t('studioSettings.brandKit.bodyFontLabel')}</Label>
            <Select
              value={bodyFontId ?? ''}
              onChange={(v) => onChange({ bodyFontId: v || null })}
              options={fontOptions}
              placeholder={t('studioSettings.brandKit.pickFontPlaceholder')}
              disabled={fonts.length === 0}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <StudioFieldHeader
            label={t('studioSettings.brandKit.fontsInKit', {
              count: fonts.length,
              max: STUDIO_BRAND_KIT_MAX_FONTS,
            })}
            showAi={false}
          />
          {fonts.length >= STUDIO_BRAND_KIT_MAX_FONTS ? (
            <p className="text-xs text-muted">{t('studioSettings.brandKit.fontsKitFull')}</p>
          ) : null}
          {fonts.length === 0 ? (
            <p className="text-sm text-muted">{t('studioSettings.brandKit.fontsEmpty')}</p>
          ) : (
            <ul className="space-y-2">
              {fonts.map((font) => {
                const roleLabel =
                  font.id === accentFontId
                    ? t('studioSettings.brandKit.fontRoleAccent')
                    : font.id === bodyFontId
                      ? t('studioSettings.brandKit.fontRoleBody')
                      : null
                return (
                  <li key={font.id} className={cn(studioTintPanel, 'flex items-center gap-3 px-3 py-2.5')}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" style={{ fontFamily: fontCss(font) }}>
                        {previewSample(t)}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {font.family || t('studioSettings.brandKit.untitledKit')}
                        {' · '}
                        {t(`studioSettings.brandKit.fontSource.${font.source}`)}
                        {roleLabel ? ` · ${roleLabel}` : ''}
                      </p>
                    </div>
                    <IconButton
                      icon={Trash2}
                      variant="ghost"
                      size="sm"
                      label={t('studioSettings.remove')}
                      onClick={() => removeFont(font.id)}
                    />
                  </li>
                )
              })}
            </ul>
          )}

          <input
            ref={uploadRef}
            type="file"
            accept=".ttf,.otf,.woff,.woff2,font/woff2,font/woff,font/otf,font/ttf"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) void handleUpload(file)
            }}
          />
          <Button
            type="button"
            variant="secondary"
            className="w-full gap-1.5"
            disabled={fonts.length >= STUDIO_BRAND_KIT_MAX_FONTS}
            onClick={() => uploadRef.current?.click()}
          >
            <Upload size={16} strokeWidth={1.5} />
            {t('studioSettings.brandKit.uploadFont')}
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex gap-1 rounded-lg border border-border p-1">
            <button type="button" className={libraryTabClass('google')} onClick={() => setLibraryTab('google')}>
              {t('studioSettings.brandKit.fontLibraryGoogle')}
            </button>
            <button type="button" className={libraryTabClass('system')} onClick={() => setLibraryTab('system')}>
              {t('studioSettings.brandKit.fontLibrarySystem')}
            </button>
          </div>

          {libraryTab === 'google' ? (
            <>
              <p className="text-xs text-muted">{t('studioSettings.brandKit.googleFontsHint')}</p>
              <Input
                value={googleFilter}
                onChange={(e) => setGoogleFilter(e.target.value)}
                placeholder={t('studioSettings.brandKit.googleFontsFilterPlaceholder')}
              />
              <ul className="max-h-64 space-y-1 overflow-y-auto">
                {filteredGoogle.map((family) => {
                  const added = hasFamily(family, 'google')
                  return (
                    <li
                      key={family}
                      className={cn(studioTintPanel, 'flex items-center justify-between gap-2 px-3 py-2')}
                    >
                      <span className="truncate text-sm" style={{ fontFamily: `"${family}", sans-serif` }}>
                        {family}
                      </span>
                      {added ? (
                        <span className="shrink-0 text-xs font-medium uppercase text-muted">
                          {t('studioSettings.brandKit.fontAdded')}
                        </span>
                      ) : (
                        <Button
                          type="button"
                          variant="secondary"
                          size="md"
                          className="h-10 shrink-0 px-3"
                          disabled={fonts.length >= STUDIO_BRAND_KIT_MAX_FONTS}
                          onClick={() => addFont(family, 'google')}
                        >
                          {t('studioSettings.brandKit.add')}
                        </Button>
                      )}
                    </li>
                  )
                })}
              </ul>
              <div className="border-t border-border pt-3">
                <Label className="mb-1.5 block text-xs text-muted">{t('studioSettings.brandKit.customGoogleFamily')}</Label>
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1 [&>div]:gap-0">
                    <Input
                      value={customGoogleFamily}
                      onChange={(e) => setCustomGoogleFamily(e.target.value)}
                      placeholder={t('studioSettings.brandKit.addFontFamilyPlaceholder')}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    className="shrink-0"
                    disabled={fonts.length >= STUDIO_BRAND_KIT_MAX_FONTS}
                    onClick={() => {
                      const family = customGoogleFamily.trim()
                      if (!family) return
                      addFont(family, 'google')
                      setCustomGoogleFamily('')
                    }}
                  >
                    {t('studioSettings.brandKit.add')}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-muted">{t('studioSettings.brandKit.systemFontsHint')}</p>
              <ul className="max-h-80 space-y-1 overflow-y-auto">
                {STUDIO_SYSTEM_FONT_OPTIONS.map((family) => {
                  const added = hasFamily(family, 'system')
                  return (
                    <li
                      key={family}
                      className={cn(studioTintPanel, 'flex items-center justify-between gap-2 px-3 py-2')}
                    >
                      <span className="truncate text-sm" style={{ fontFamily: family }}>
                        {family}
                      </span>
                      {added ? (
                        <span className="shrink-0 text-xs font-medium uppercase text-muted">
                          {t('studioSettings.brandKit.fontAdded')}
                        </span>
                      ) : (
                        <Button
                          type="button"
                          variant="secondary"
                          size="md"
                          className="h-10 shrink-0 px-3"
                          disabled={fonts.length >= STUDIO_BRAND_KIT_MAX_FONTS}
                          onClick={() => addFont(family, 'system')}
                        >
                          {t('studioSettings.brandKit.add')}
                        </Button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
