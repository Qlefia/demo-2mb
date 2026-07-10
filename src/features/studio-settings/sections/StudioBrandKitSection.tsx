'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { Button, IconButton, Input, Label } from '@/components/atoms'
import { ConfirmDialog } from '@/components/molecules'
import {
  StudioBrandFontsEditor,
  StudioBrandKitHeader,
  StudioBrandLogosEditor,
  StudioFieldHeader,
  StudioRichTextField,
} from '@/features/studio-settings/components'
import { StudioBrandSubNav } from '@/features/studio-settings/StudioBrandSubNav'
import {
  STUDIO_BRAND_KIT_MAX_COLORS,
  STUDIO_BRAND_KIT_MAX_SOCIAL_LINKS,
} from '@/features/studio-settings/constants'
import { createEmptyBrandKit } from '@/features/studio-settings/lib/studioBrandKitEmpty'
import {
  cloneBrandKit,
  studioBrandKitNewId,
} from '@/features/studio-settings/lib/studioBrandKitHelpers'
import {
  DECK_COLOR_ROLE_LABELS,
  inferSwatchProposalRole,
} from '@/lib/proposals/deckTheme'
import { StudioProposalThemePreview } from '@/features/studio-settings/components/StudioProposalThemePreview'
import { STUDIO_BRAND_PROFILE_MAX } from '@/features/studio-settings/lib/pickSingleStudioBrand'
import {
  studioEditorPanelBody,
  studioFieldStack,
  studioSettingsContentGutter,
  studioSettingsListScroll,
  studioSettingsPinnedHeader,
  studioTintPanel,
} from '@/features/studio-settings/studioBlockChrome'
import { cn } from '@/lib/cn'
import { studioBrandSubTabFromPath } from '@/lib/studio/studioBrandPaths'
import { useStudioProfileStore } from '@/stores/studioProfileStore'
import type {
  StudioBrandColor,
  StudioBrandProfile,
  StudioBrandSocialLink,
} from '@/stores/studioProfileTypes'

function normalizeHexInput(raw: string): string {
  const t = raw.trim()
  if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t.toUpperCase()
  if (/^[0-9A-Fa-f]{6}$/.test(t)) return `#${t.toUpperCase()}`
  return '#B08D57'
}

function ensureSinglePrimary(brands: StudioBrandProfile[]): StudioBrandProfile[] {
  if (brands.length === 0) return [createEmptyBrandKit(true)]
  const primaryIdx = brands.findIndex((b) => b.isPrimary)
  if (primaryIdx < 0) {
    return brands.map((b, i) => (i === 0 ? { ...b, isPrimary: true } : { ...b, isPrimary: false }))
  }
  return brands.map((b, i) => (i === primaryIdx ? { ...b, isPrimary: true } : { ...b, isPrimary: false }))
}

type PanelProps = {
  activeKit: StudioBrandProfile
  patchActive: (patch: Partial<StudioBrandProfile>) => void
}

export function StudioBrandKitSection() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const subTab = studioBrandSubTabFromPath(pathname)
  const studioBrands = useStudioProfileStore((s) => s.general.studioBrands)
  const setGeneral = useStudioProfileStore((s) => s.setGeneral)

  const [activeId, setActiveId] = useState<string | null>(null)
  const [draftKitId, setDraftKitId] = useState<string | null>(null)
  const [deleteKitId, setDeleteKitId] = useState<string | null>(null)

  const kits = studioBrands
  const activeKit = useMemo(
    () => kits.find((b) => b.id === activeId) ?? kits.find((b) => b.isPrimary) ?? kits[0],
    [activeId, kits],
  )

  useEffect(() => {
    if (!activeKit) return
    if (activeId !== activeKit.id) setActiveId(activeKit.id)
  }, [activeId, activeKit])

  const patchBrands = useCallback(
    (next: StudioBrandProfile[]) => {
      setGeneral({ studioBrands: ensureSinglePrimary(next).slice(0, STUDIO_BRAND_PROFILE_MAX) })
    },
    [setGeneral],
  )

  const patchActive = useCallback(
    (patch: Partial<StudioBrandProfile>) => {
      const brands = useStudioProfileStore.getState().general.studioBrands
      const active =
        (activeId ? brands.find((b) => b.id === activeId) : null) ??
        brands.find((b) => b.isPrimary) ??
        brands[0]
      if (!active) return
      patchBrands(brands.map((b) => (b.id === active.id ? { ...b, ...patch } : b)))
    },
    [activeId, patchBrands],
  )

  const addKit = () => {
    if (kits.length >= STUDIO_BRAND_PROFILE_MAX) return
    const kit = createEmptyBrandKit(false)
    patchBrands([...kits, kit])
    setActiveId(kit.id)
    setDraftKitId(kit.id)
  }

  const duplicateKit = () => {
    if (!activeKit || kits.length >= STUDIO_BRAND_PROFILE_MAX) return
    const copy = cloneBrandKit(activeKit, false)
    patchBrands([...kits, copy])
    setActiveId(copy.id)
    setDraftKitId(copy.id)
  }

  const confirmDeleteKit = () => {
    if (!deleteKitId || kits.length <= 1) {
      setDeleteKitId(null)
      return
    }
    const next = kits.filter((b) => b.id !== deleteKitId)
    patchBrands(next)
    if (activeId === deleteKitId) setActiveId(next[0]?.id ?? null)
    setDeleteKitId(null)
  }

  const setPrimaryKit = () => {
    if (!activeKit) return
    patchBrands(kits.map((b) => ({ ...b, isPrimary: b.id === activeKit.id })))
  }

  if (!activeKit) {
    return (
      <div className="space-y-3 p-4">
        <p className="text-sm text-muted">{t('studioSettings.brandKit.emptyState')}</p>
        <Button type="button" variant="secondary" size="sm" className="gap-1.5" onClick={addKit}>
          <Plus size={16} />
          {t('studioSettings.brandKit.newKit')}
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className={cn(studioSettingsPinnedHeader, studioSettingsContentGutter, 'space-y-2 pb-2')}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-base font-semibold text-foreground">
              {t('studioSettings.brandKit.title')}
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled
              title={t('studioSettings.brandKit.autoExtractSoon')}
            >
              {t('studioSettings.brandKit.autoExtract')}
            </Button>
          </div>
          <StudioBrandKitHeader
            kits={kits}
            activeKit={activeKit}
            activeId={activeId}
            draftKitId={draftKitId}
            maxKits={STUDIO_BRAND_PROFILE_MAX}
            onSelectKit={(id) => {
              setActiveId(id)
              if (id !== draftKitId) setDraftKitId(null)
            }}
            onNameChange={(name) => {
              patchActive({ name })
              if (name.trim()) setDraftKitId(null)
            }}
            onAddKit={addKit}
            onDuplicateKit={duplicateKit}
            onDeleteKit={() => setDeleteKitId(activeKit.id)}
            onSetPrimary={setPrimaryKit}
          />
        </header>

        <div className={cn(studioSettingsPinnedHeader, studioSettingsContentGutter, 'pb-0')}>
          <StudioBrandSubNav />
        </div>

        <div className={cn(studioSettingsListScroll, studioSettingsContentGutter, 'pt-4')}>
          {subTab === 'general' && <BrandGeneralPanel activeKit={activeKit} patchActive={patchActive} />}
          {subTab === 'fonts' && <BrandFontsPanel activeKit={activeKit} patchActive={patchActive} />}
          {subTab === 'logos' && <BrandLogosPanel activeKit={activeKit} patchActive={patchActive} />}
          {subTab === 'colors' && <BrandColorsPanel activeKit={activeKit} patchActive={patchActive} />}
          {subTab === 'networks' && <BrandNetworksPanel activeKit={activeKit} patchActive={patchActive} />}
          {subTab === 'voice' && <BrandVoicePanel activeKit={activeKit} patchActive={patchActive} />}
          {subTab === 'strategy' && <BrandStrategyPanel activeKit={activeKit} patchActive={patchActive} />}
          {subTab === 'business' && <BrandBusinessPanel activeKit={activeKit} patchActive={patchActive} />}
        </div>
      </div>

      <ConfirmDialog
        open={deleteKitId !== null}
        onClose={() => setDeleteKitId(null)}
        onConfirm={confirmDeleteKit}
        title={t('studioSettings.brandKit.deleteKitTitle')}
        message={t('studioSettings.brandKit.deleteKitBody')}
        variant="destructive"
        confirmLabel={t('studioSettings.remove')}
      />
    </>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*                                  Panels                                    */
/* ────────────────────────────────────────────────────────────────────────── */

function BrandGeneralPanel({ activeKit, patchActive }: PanelProps) {
  const { t } = useTranslation()
  return (
    <div className={studioEditorPanelBody}>
      <div className={studioFieldStack}>
        <Label htmlFor="brand-slogan">{t('studioSettings.general.brandSlogan')}</Label>
        <Input
          id="brand-slogan"
          value={activeKit.slogan}
          onChange={(e) => patchActive({ slogan: e.target.value })}
        />
      </div>

      <div className={studioFieldStack}>
        <StudioFieldHeader label={t('studioSettings.general.brandDescription')} />
        <StudioRichTextField
          id="brand-desc"
          value={activeKit.description}
          onChange={(description) => patchActive({ description })}
          placeholder={t('studioSettings.richText.brandDescriptionPlaceholder')}
        />
      </div>

      <div className={studioFieldStack}>
        <StudioFieldHeader label={t('studioSettings.general.brandStrengthPositioning')} />
        <StudioRichTextField
          id="brand-strength"
          value={activeKit.strengthPositioning}
          onChange={(strengthPositioning) => patchActive({ strengthPositioning })}
          placeholder={t('studioSettings.richText.brandStrengthPlaceholder')}
        />
      </div>

      <div className={studioFieldStack}>
        <StudioFieldHeader label={t('studioSettings.general.studioPrinciples')} />
        <StudioRichTextField
          id="brand-principles"
          value={activeKit.studioPrinciples}
          onChange={(studioPrinciples) => patchActive({ studioPrinciples })}
          placeholder={t('studioSettings.richText.studioPrinciplesPlaceholder')}
        />
      </div>
    </div>
  )
}

function BrandFontsPanel({ activeKit, patchActive }: PanelProps) {
  return (
    <div className={studioEditorPanelBody}>
      <StudioBrandFontsEditor
        fonts={activeKit.fonts}
        accentFontId={activeKit.accentFontId}
        bodyFontId={activeKit.bodyFontId}
        onChange={(patch) => patchActive(patch)}
      />
    </div>
  )
}

function BrandLogosPanel({ activeKit, patchActive }: PanelProps) {
  const { t } = useTranslation()
  return (
    <div className={studioEditorPanelBody}>
      <StudioFieldHeader
        label={t('studioSettings.brandKit.logosInKit', { count: activeKit.logos.length })}
        showAi={false}
      />
      <StudioBrandLogosEditor logos={activeKit.logos} onChange={(logos) => patchActive({ logos })} />
    </div>
  )
}

function BrandColorsPanel({ activeKit, patchActive }: PanelProps) {
  const { t } = useTranslation()
  const [draftHex, setDraftHex] = useState('#B08D57')
  const [draftColorName, setDraftColorName] = useState('')

  return (
    <div className={studioEditorPanelBody}>
      <StudioFieldHeader
        label={t('studioSettings.brandKit.colorsInKit', { count: activeKit.colors.length })}
        showAi={false}
      />
      <p className="text-xs leading-relaxed text-muted">{t('studioSettings.brandKit.colorRolesHint')}</p>
      {activeKit.colors.length > 0 ? <StudioProposalThemePreview brand={activeKit} /> : null}
      {activeKit.colors.length === 0 ? (
        <p className="text-sm text-muted">{t('studioSettings.brandKit.colorsEmpty')}</p>
      ) : (
        <ul className="space-y-2">
          {activeKit.colors.map((color, colorIndex) => (
            <li key={color.id} className={cn(studioTintPanel, 'flex items-center gap-3 px-3 py-2')}>
              <input
                type="color"
                value={color.hex}
                onChange={(e) => {
                  const hex = normalizeHexInput(e.target.value)
                  patchActive({
                    colors: activeKit.colors.map((c, j) => (j === colorIndex ? { ...c, hex } : c)),
                  })
                }}
                className="h-9 w-9 shrink-0 cursor-pointer border border-border bg-transparent"
                aria-label={t('studioSettings.brandKit.colorSwatchAria')}
              />
              <div className="min-w-0 flex-1 space-y-1">
                <Input
                  value={color.hex}
                  onChange={(e) => {
                    const hex = normalizeHexInput(e.target.value)
                    patchActive({
                      colors: activeKit.colors.map((c, j) => (j === colorIndex ? { ...c, hex } : c)),
                    })
                  }}
                  className="font-mono text-xs"
                />
                <Input
                  value={color.name}
                  onChange={(e) =>
                    patchActive({
                      colors: activeKit.colors.map((c, j) =>
                        j === colorIndex ? { ...c, name: e.target.value } : c,
                      ),
                    })
                  }
                  placeholder={t('studioSettings.brandKit.colorNamePlaceholder')}
                />
                {(() => {
                  const role = inferSwatchProposalRole(activeKit.colors, colorIndex)
                  if (!role) return null
                  return (
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                      {t('studioSettings.brandKit.proposalRole', {
                        role: DECK_COLOR_ROLE_LABELS[role],
                      })}
                    </p>
                  )
                })()}
              </div>
              <IconButton
                icon={Trash2}
                variant="ghost"
                size="sm"
                label={t('studioSettings.remove')}
                onClick={() =>
                  patchActive({ colors: activeKit.colors.filter((c) => c.id !== color.id) })
                }
              />
            </li>
          ))}
        </ul>
      )}
      {activeKit.colors.length < STUDIO_BRAND_KIT_MAX_COLORS ? (
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {t('studioSettings.brandKit.addColor')}
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <input
              type="color"
              value={draftHex}
              onChange={(e) => setDraftHex(normalizeHexInput(e.target.value))}
              className="h-10 w-10 shrink-0 cursor-pointer border border-border"
              aria-label={t('studioSettings.brandKit.colorSwatchAria')}
            />
            <div className={cn(studioFieldStack, 'min-w-24 flex-1')}>
              <Input
                value={draftHex}
                onChange={(e) => setDraftHex(normalizeHexInput(e.target.value))}
                className="font-mono text-xs"
              />
            </div>
            <div className={cn(studioFieldStack, 'min-w-32 flex-1')}>
              <Input
                value={draftColorName}
                onChange={(e) => setDraftColorName(e.target.value)}
                placeholder={t('studioSettings.brandKit.colorNamePlaceholder')}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                const row: StudioBrandColor = {
                  id: studioBrandKitNewId(),
                  hex: draftHex,
                  name: draftColorName.trim(),
                }
                patchActive({ colors: [...activeKit.colors, row] })
                setDraftColorName('')
              }}
            >
              {t('studioSettings.brandKit.add')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function BrandNetworksPanel({ activeKit, patchActive }: PanelProps) {
  const { t } = useTranslation()
  const [draftNetworkLabel, setDraftNetworkLabel] = useState('')
  const [draftNetworkUrl, setDraftNetworkUrl] = useState('')

  return (
    <div className={studioEditorPanelBody}>
      <StudioFieldHeader
        label={t('studioSettings.brandKit.networksInKit', { count: activeKit.socialNetworks.length })}
        showAi={false}
      />
      {activeKit.socialNetworks.length === 0 ? (
        <p className="text-sm text-muted">{t('studioSettings.brandKit.networksEmpty')}</p>
      ) : (
        <ul className="space-y-2">
          {activeKit.socialNetworks.map((link, linkIndex) => (
            <li key={link.id} className={cn(studioTintPanel, 'grid gap-2 px-3 py-3 sm:grid-cols-2')}>
              <Input
                value={link.label}
                onChange={(e) =>
                  patchActive({
                    socialNetworks: activeKit.socialNetworks.map((n, j) =>
                      j === linkIndex ? { ...n, label: e.target.value } : n,
                    ),
                  })
                }
                placeholder={t('studioSettings.brandKit.networkLabelPlaceholder')}
              />
              <div className="flex gap-2">
                <Input
                  type="url"
                  value={link.url}
                  onChange={(e) =>
                    patchActive({
                      socialNetworks: activeKit.socialNetworks.map((n, j) =>
                        j === linkIndex ? { ...n, url: e.target.value } : n,
                      ),
                    })
                  }
                  placeholder="https://"
                  className="min-w-0 flex-1"
                />
                <IconButton
                  icon={Trash2}
                  variant="ghost"
                  size="sm"
                  label={t('studioSettings.remove')}
                  onClick={() =>
                    patchActive({
                      socialNetworks: activeKit.socialNetworks.filter((n) => n.id !== link.id),
                    })
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      {activeKit.socialNetworks.length < STUDIO_BRAND_KIT_MAX_SOCIAL_LINKS ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Input
            value={draftNetworkLabel}
            onChange={(e) => setDraftNetworkLabel(e.target.value)}
            placeholder={t('studioSettings.brandKit.networkLabelPlaceholder')}
          />
          <div className="flex gap-2">
            <Input
              type="url"
              value={draftNetworkUrl}
              onChange={(e) => setDraftNetworkUrl(e.target.value)}
              placeholder="https://"
              className="min-w-0 flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                const label = draftNetworkLabel.trim()
                const url = draftNetworkUrl.trim()
                if (!label && !url) return
                const row: StudioBrandSocialLink = {
                  id: studioBrandKitNewId(),
                  label: label || url,
                  url,
                }
                patchActive({ socialNetworks: [...activeKit.socialNetworks, row] })
                setDraftNetworkLabel('')
                setDraftNetworkUrl('')
              }}
            >
              {t('studioSettings.brandKit.add')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function BrandVoicePanel({ activeKit, patchActive }: PanelProps) {
  const { t } = useTranslation()
  return (
    <div className={studioEditorPanelBody}>
      <StudioFieldHeader label={t('studioSettings.brandKit.tabs.voice')} showAi={false} />
      <StudioRichTextField
        id="brand-kit-voice"
        value={activeKit.voiceGuidelines}
        onChange={(voiceGuidelines) => patchActive({ voiceGuidelines })}
        placeholder={t('studioSettings.brandKit.voicePlaceholder')}
        minHeightClass="min-h-[10rem]"
      />
    </div>
  )
}

function BrandStrategyPanel({ activeKit, patchActive }: PanelProps) {
  const { t } = useTranslation()
  return (
    <div className={studioEditorPanelBody}>
      <StudioFieldHeader label={t('studioSettings.brandKit.tabs.strategy')} showAi={false} />
      <StudioRichTextField
        id="brand-kit-strategy"
        value={activeKit.strategyNotes}
        onChange={(strategyNotes) => patchActive({ strategyNotes })}
        placeholder={t('studioSettings.brandKit.strategyPlaceholder')}
        minHeightClass="min-h-[10rem]"
      />
    </div>
  )
}

function BrandBusinessPanel({ activeKit, patchActive }: PanelProps) {
  const { t } = useTranslation()
  return (
    <div className={studioEditorPanelBody}>
      <StudioFieldHeader label={t('studioSettings.brandKit.tabs.business')} showAi={false} />
      <StudioRichTextField
        id="brand-kit-business"
        value={activeKit.businessProfile}
        onChange={(businessProfile) => patchActive({ businessProfile })}
        placeholder={t('studioSettings.brandKit.businessPlaceholder')}
        minHeightClass="min-h-[10rem]"
      />
    </div>
  )
}
