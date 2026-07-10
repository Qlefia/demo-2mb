'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Input, Switch, TextArea } from '@/components/atoms'
import { Select } from '@/components/molecules/Select'
import {
  StudioDetailWithRelationsSidebar,
  StudioDualImageUpload,
  StudioFieldHeader,
  StudioRichTextField,
  StudioSalesDetailHeader,
} from '@/features/studio-settings/components'
import {
  studioEditorPanelBody,
  studioGhostAction,
  studioSectionStack,
} from '@/features/studio-settings/studioBlockChrome'
import { useStudioProfileStore } from '@/stores/studioProfileStore'
import { STUDIO_PRODUCT_BILLING_KINDS } from '@/stores/studioProfileTypes'
import { studioProductsListPath } from '@/lib/studio/studioSalesPaths'

export function StudioProductDetailSection() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const params = useParams<{ productId: string }>()
  const productId = params.productId
  const listHref = studioProductsListPath(pathname)

  const products = useStudioProfileStore((s) => s.products)
  const updateProduct = useStudioProfileStore((s) => s.updateProduct)
  const product = useMemo(() => products.find((p) => p.id === productId), [products, productId])

  const billingOptions = useMemo(
    () =>
      STUDIO_PRODUCT_BILLING_KINDS.map((k) => ({
        value: k,
        label: t(`studioSettings.products.billing.${k}`),
      })),
    [t],
  )

  if (!productId || !product) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted">{t('studioSettings.products.notFound')}</p>
        <Link href={listHref} className={studioGhostAction}>
          {t('studioSettings.products.backToList')}
        </Link>
      </div>
    )
  }

  const headerTitle = product.title.trim() || t('studioSettings.products.untitled')

  return (
    <StudioDetailWithRelationsSidebar entity={{ kind: 'product', id: product.id }}>
      <div className={studioSectionStack}>
        <StudioSalesDetailHeader
          backHref={listHref}
          backLabelKey="studioSettings.products.backToList"
          title={headerTitle}
        />

        <div className={studioEditorPanelBody}>
          <div className="grid gap-[var(--studio-stack-block-gap)] sm:grid-cols-[2fr_1fr]">
            <div className="studio-field-stack">
              <StudioFieldHeader htmlFor="prod-title" label={t('studioSettings.products.fields.title')} showAi={false} />
              <Input
                id="prod-title"
                value={product.title}
                onChange={(e) => updateProduct(product.id, { title: e.target.value })}
                placeholder={t('studioSettings.products.fields.titlePlaceholder')}
              />
            </div>
            <div className="studio-field-stack">
              <StudioFieldHeader htmlFor="prod-code" label={t('studioSettings.products.fields.code')} showAi={false} />
              <Input
                id="prod-code"
                value={product.code}
                onChange={(e) => updateProduct(product.id, { code: e.target.value })}
                placeholder={t('studioSettings.products.fields.codePlaceholder')}
              />
            </div>
          </div>

          <div className="studio-field-stack">
            <StudioFieldHeader htmlFor="prod-sum" label={t('studioSettings.products.fields.summary')} showAi={false} />
            <Input
              id="prod-sum"
              value={product.summary}
              onChange={(e) => updateProduct(product.id, { summary: e.target.value })}
              placeholder={t('studioSettings.products.fields.summaryPlaceholder')}
              maxLength={160}
            />
          </div>

          <div className="studio-field-stack">
            <StudioFieldHeader label={t('studioSettings.products.fields.image')} showAi={false} />
            <StudioDualImageUpload
              horizontalValue={product.bannerDataUrl}
              portraitValue={product.bannerPortraitDataUrl}
              onHorizontalChange={(v) => updateProduct(product.id, { bannerDataUrl: v })}
              onPortraitChange={(v) => updateProduct(product.id, { bannerPortraitDataUrl: v })}
              horizontalPlaceholder={t('studioSettings.products.fields.imagePlaceholder')}
              portraitPlaceholder={t('studioSettings.products.fields.imagePortraitPlaceholder')}
            />
          </div>

          <div className="grid gap-[var(--studio-stack-block-gap)] sm:grid-cols-[1fr_1fr_1fr_1fr]">
            <div className="studio-field-stack">
              <StudioFieldHeader htmlFor="prod-billing" label={t('studioSettings.products.fields.billing')} showAi={false} />
              <Select
                value={product.billingKind}
                onChange={(value) =>
                  updateProduct(product.id, { billingKind: value as (typeof STUDIO_PRODUCT_BILLING_KINDS)[number] })
                }
                options={billingOptions}
              />
            </div>
            <div className="studio-field-stack">
              <StudioFieldHeader htmlFor="prod-amt" label={t('studioSettings.products.fields.priceAmount')} showAi={false} />
              <Input
                id="prod-amt"
                value={product.priceAmount}
                onChange={(e) => updateProduct(product.id, { priceAmount: e.target.value })}
                placeholder={t('studioSettings.products.fields.priceAmountPlaceholder')}
              />
            </div>
            <div className="studio-field-stack">
              <StudioFieldHeader htmlFor="prod-from" label={t('studioSettings.products.fields.priceFrom')} showAi={false} />
              <Input
                id="prod-from"
                value={product.priceFrom}
                onChange={(e) => updateProduct(product.id, { priceFrom: e.target.value })}
                placeholder={t('studioSettings.products.fields.priceFromPlaceholder')}
              />
            </div>
            <div className="studio-field-stack">
              <StudioFieldHeader htmlFor="prod-to" label={t('studioSettings.products.fields.priceTo')} showAi={false} />
              <Input
                id="prod-to"
                value={product.priceTo}
                onChange={(e) => updateProduct(product.id, { priceTo: e.target.value })}
                placeholder={t('studioSettings.products.fields.priceToPlaceholder')}
              />
            </div>
          </div>

          <div className="studio-field-stack">
            <StudioFieldHeader htmlFor="prod-incl" label={t('studioSettings.products.fields.inclusions')} showAi={false} />
            <TextArea
              id="prod-incl"
              value={product.inclusions}
              onChange={(e) => updateProduct(product.id, { inclusions: e.target.value })}
              placeholder={t('studioSettings.products.fields.inclusionsPlaceholder')}
              rows={4}
            />
            <p className="text-[11px] text-muted">{t('studioSettings.products.fields.inclusionsHint')}</p>
          </div>

          <div className="studio-field-stack">
            <StudioFieldHeader htmlFor="prod-desc" label={t('studioSettings.products.fields.description')} showAi={false} />
            <StudioRichTextField
              id="prod-desc"
              value={product.description}
              onChange={(html) => updateProduct(product.id, { description: html })}
              placeholder={t('studioSettings.products.fields.descriptionPlaceholder')}
              minHeightClass="min-h-[8rem]"
            />
          </div>

          <div className="studio-field-stack">
            <StudioFieldHeader htmlFor="prod-url" label={t('studioSettings.products.fields.url')} showAi={false} />
            <Input
              id="prod-url"
              type="url"
              inputMode="url"
              autoComplete="off"
              value={product.externalUrl}
              onChange={(e) => updateProduct(product.id, { externalUrl: e.target.value })}
              placeholder={t('studioSettings.products.fields.urlPlaceholder')}
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-[var(--form-field-radius)] border border-border/60 bg-background/40 px-3 py-2.5">
            <div>
              <p className="text-xs font-medium text-foreground">{t('studioSettings.products.fields.featured')}</p>
              <p className="text-[11px] text-muted">{t('studioSettings.products.fields.featuredHint')}</p>
            </div>
            <Switch
              checked={product.featured}
              onChange={(checked) => updateProduct(product.id, { featured: checked })}
            />
          </div>
        </div>
      </div>
    </StudioDetailWithRelationsSidebar>
  )
}
