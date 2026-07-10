'use client'

import { useCallback, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2 } from 'lucide-react'
import type { DropdownMenuEntry } from '@/components/molecules'
import { ConfirmDialog } from '@/components/molecules'
import { StudioSalesListLayout, StudioSortableListCard } from '@/features/studio-settings/components'
import type { StudioSortableListChip } from '@/features/studio-settings/components/StudioSortableListCard'
import { useStudioSalesListIds } from '@/features/studio-settings/lib/useStudioSalesListIds'
import type { StudioSalesListFilter } from '@/features/studio-settings/lib/studioSalesListTypes'
import { stripHtmlToPlain } from '@/features/studio-settings/lib/stripHtmlToPlain'
import { useStudioProfileStore } from '@/stores/studioProfileStore'
import { studioProductEditorPath } from '@/lib/studio/studioSalesPaths'

const BLOCK = 'studio-products'
const DESC_PREVIEW_CHARS = 180

function pricePreview(row: {
  priceAmount: string
  priceFrom: string
  priceTo: string
}): string | null {
  const amount = row.priceAmount.trim()
  if (amount) return amount
  const from = row.priceFrom.trim()
  const to = row.priceTo.trim()
  if (from && to) return `${from} – ${to}`
  if (from) return from
  if (to) return to
  return null
}

export function StudioProductsHubSection() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const products = useStudioProfileStore((s) => s.products)
  const removeProduct = useStudioProfileStore((s) => s.removeProduct)
  const reorderProducts = useStudioProfileStore((s) => s.reorderProducts)

  const [removeId, setRemoveId] = useState<string | null>(null)

  const productIds = products.map((p) => p.id)

  const listState = useStudioSalesListIds({
    tab: 'products',
    sourceIds: productIds,
    matchesFilter: useCallback(
      (id, filter: StudioSalesListFilter) => {
        if (filter === 'all') return true
        const product = products.find((p) => p.id === id)
        if (!product) return false
        if (filter === 'featured') return product.featured
        return true
      },
      [products],
    ),
    getSearchText: useCallback(
      (id) => {
        const product = products.find((p) => p.id === id)
        if (!product) return ''
        const desc = stripHtmlToPlain(product.description, DESC_PREVIEW_CHARS)
        return `${product.title} ${product.summary} ${product.code} ${desc}`.trim()
      },
      [products],
    ),
    getTitle: useCallback(
      (id) => {
        const product = products.find((p) => p.id === id)
        return product?.title.trim() || t('studioSettings.products.untitled')
      },
      [products, t],
    ),
  })

  return (
    <div className="space-y-1">
      {productIds.length === 0 ? (
        <p className="text-sm text-muted">{t('studioSettings.products.empty')}</p>
      ) : listState.noResults ? (
        <p className="text-sm text-muted">{t('studioSettings.sales.listToolbar.noResults')}</p>
      ) : (
        <StudioSalesListLayout
          blockId={BLOCK}
          itemIds={listState.ids}
          listLabel={t('studioSettings.products.listAria')}
          viewMode={listState.viewMode}
          isManualOrder={listState.isManualOrder}
          onReorder={reorderProducts}
        >
          {(id, dragHandle) => {
            const product = products.find((p) => p.id === id)
            if (!product) return null
            const title = product.title.trim() || t('studioSettings.products.untitled')
            const description =
              stripHtmlToPlain(product.description, DESC_PREVIEW_CHARS).trim() ||
              product.summary.trim() ||
              null
            const href = studioProductEditorPath(pathname, id)
            const price = pricePreview(product)
            const chips: StudioSortableListChip[] = []
            chips.push({
              id: 'billing',
              kind: 'plain',
              label: t(`studioSettings.products.billing.${product.billingKind}`),
            })
            if (product.code.trim()) {
              chips.push({ id: 'code', kind: 'plain', label: product.code.trim() })
            }
            if (product.linkedCatalogIds.length > 0) {
              chips.push({
                id: 'services',
                kind: 'plain',
                label: t('studioSettings.products.includesServices', {
                  count: product.linkedCatalogIds.length,
                }),
              })
            }
            const menuItems: DropdownMenuEntry[] = [
              {
                label: t('studioSettings.edit'),
                icon: Pencil,
                onClick: () => router.push(href),
              },
              { separator: true },
              {
                label: t('studioSettings.remove'),
                icon: Trash2,
                variant: 'destructive',
                onClick: () => setRemoveId(id),
              },
            ]

            return (
              <StudioSortableListCard
                dragHandle={dragHandle}
                href={href}
                menuTriggerAriaLabel={t('studioSettings.sortableListCardMenuAria')}
                menuItems={menuItems}
                thumbnailUrl={product.bannerDataUrl ?? null}
                eyebrow={product.featured ? t('studioSettings.products.featured') : null}
                title={title}
                subtitle={price}
                description={description}
                chips={chips}
              />
            )
          }}
        </StudioSalesListLayout>
      )}

      <ConfirmDialog
        open={removeId !== null}
        onClose={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId) removeProduct(removeId)
          setRemoveId(null)
        }}
        title={t('studioSettings.products.confirmRemoveTitle')}
        message={t('studioSettings.products.confirmRemoveBody')}
        variant="destructive"
        confirmLabel={t('studioSettings.remove')}
      />
    </div>
  )
}
