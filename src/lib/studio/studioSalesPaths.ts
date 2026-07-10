import type { StudioRelationsEntity } from '@/features/studio-settings/lib/studioRelationsSidebar'

/** Studio workspace — Sales hub (groups, catalogue, works, reviews). */
export const STUDIO_SALES_BASE = '/settings/studio/sales' as const

export const STUDIO_SALES_GROUPS = `${STUDIO_SALES_BASE}/groups`
export const STUDIO_SALES_SERVICES = `${STUDIO_SALES_BASE}/services`
export const STUDIO_SALES_WORKS = `${STUDIO_SALES_BASE}/works`
export const STUDIO_SALES_REVIEWS = `${STUDIO_SALES_BASE}/reviews`
export const STUDIO_SALES_SEGMENTS = `${STUDIO_SALES_BASE}/segments`
export const STUDIO_SALES_TOOLS = `${STUDIO_SALES_BASE}/tools`
export const STUDIO_SALES_PRODUCTS = `${STUDIO_SALES_BASE}/products`
export const STUDIO_SALES_PLAYBOOKS = `${STUDIO_SALES_BASE}/playbooks`

export function isStudioSalesPath(pathname: string): boolean {
  return pathname === STUDIO_SALES_BASE || pathname.startsWith(`${STUDIO_SALES_BASE}/`)
}

export function studioSalesGroupEditor(groupId: string): string {
  return `${STUDIO_SALES_BASE}/groups/${groupId}`
}

export function studioSalesCatalogDetail(catalogId: string): string {
  return `${STUDIO_SALES_BASE}/services/${catalogId}`
}

export function studioSalesWorkDetail(workId: string): string {
  return `${STUDIO_SALES_BASE}/works/${workId}`
}

/** Sales hub tab lists only (hide sub-nav on group/service/work/review detail). */

export function isStudioSalesListPath(pathname: string): boolean {
  return (
    pathname === STUDIO_SALES_BASE ||
    pathname === `${STUDIO_SALES_BASE}/` ||
    pathname === STUDIO_SALES_GROUPS ||
    pathname === STUDIO_SALES_SERVICES ||
    pathname === STUDIO_SALES_WORKS ||
    pathname === STUDIO_SALES_REVIEWS ||
    pathname === STUDIO_SALES_SEGMENTS ||
    pathname === STUDIO_SALES_TOOLS ||
    pathname === STUDIO_SALES_PRODUCTS ||
    pathname === STUDIO_SALES_PLAYBOOKS
  )
}

export type StudioSalesListTab =
  | 'groups'
  | 'services'
  | 'works'
  | 'reviews'
  | 'segments'
  | 'tools'
  | 'products'
  | 'playbooks'

export function studioSalesListTabFromPath(pathname: string): StudioSalesListTab | null {
  if (
    pathname === STUDIO_SALES_BASE ||
    pathname === `${STUDIO_SALES_BASE}/` ||
    pathname === STUDIO_SALES_GROUPS
  ) {
    return 'groups'
  }
  if (pathname === STUDIO_SALES_SERVICES) return 'services'
  if (pathname === STUDIO_SALES_WORKS) return 'works'
  if (pathname === STUDIO_SALES_REVIEWS) return 'reviews'
  if (pathname === STUDIO_SALES_SEGMENTS) return 'segments'
  if (pathname === STUDIO_SALES_TOOLS) return 'tools'
  if (pathname === STUDIO_SALES_PRODUCTS) return 'products'
  if (pathname === STUDIO_SALES_PLAYBOOKS) return 'playbooks'
  return null
}



export function studioSalesGroupsListPath(pathname: string): string {

  return isStudioSalesPath(pathname) ? STUDIO_SALES_GROUPS : '/settings/studio/sales/groups'

}



export function studioSalesReviewDetail(reviewId: string): string {
  return `${STUDIO_SALES_BASE}/reviews/${reviewId}`
}

export function studioSalesSegmentDetail(segmentId: string): string {
  return `${STUDIO_SALES_BASE}/segments/${segmentId}`
}

export function studioSalesToolDetail(toolId: string): string {
  return `${STUDIO_SALES_BASE}/tools/${toolId}`
}

export function studioSalesProductDetail(productId: string): string {
  return `${STUDIO_SALES_BASE}/products/${productId}`
}

export function studioSalesPlaybookDetail(playbookId: string): string {
  return `${STUDIO_SALES_BASE}/playbooks/${playbookId}`
}

export function studioPlaybooksListPath(pathname: string): string {
  return isStudioSalesPath(pathname) ? STUDIO_SALES_PLAYBOOKS : '/settings/studio/sales/playbooks'
}

export function studioPlaybookEditorPath(pathname: string, playbookId: string): string {
  return isStudioSalesPath(pathname)
    ? studioSalesPlaybookDetail(playbookId)
    : `/settings/studio/sales/playbooks/${playbookId}`
}

export function studioToolsListPath(pathname: string): string {
  return isStudioSalesPath(pathname) ? STUDIO_SALES_TOOLS : '/settings/studio/sales/tools'
}

export function studioToolEditorPath(pathname: string, toolId: string): string {
  return isStudioSalesPath(pathname)
    ? studioSalesToolDetail(toolId)
    : `/settings/studio/sales/tools/${toolId}`
}

export function studioProductsListPath(pathname: string): string {
  return isStudioSalesPath(pathname) ? STUDIO_SALES_PRODUCTS : '/settings/studio/sales/products'
}

export function studioProductEditorPath(pathname: string, productId: string): string {
  return isStudioSalesPath(pathname)
    ? studioSalesProductDetail(productId)
    : `/settings/studio/sales/products/${productId}`
}

export function studioSegmentsListPath(pathname: string): string {
  return isStudioSalesPath(pathname) ? STUDIO_SALES_SEGMENTS : '/settings/studio/sales/segments'
}

export function studioSegmentEditorPath(pathname: string, segmentId: string): string {
  return isStudioSalesPath(pathname) ? studioSalesSegmentDetail(segmentId) : `/settings/studio/sales/segments/${segmentId}`
}

/** Works list + detail base: Sales hub vs legacy routes (redirects send users to Sales). */
export function studioWorksBasePath(pathname: string): string {
  return isStudioSalesPath(pathname) ? STUDIO_SALES_WORKS : '/settings/studio/works'
}

/** Service group editor URL (Sales uses /sales/groups/:id; legacy was /services/:id). */
export function studioGroupEditorPath(pathname: string, groupId: string): string {
  return isStudioSalesPath(pathname) ? studioSalesGroupEditor(groupId) : `/settings/studio/services/${groupId}`
}

/** Catalogue list (tab Services in Sales, or legacy services hub). */
export function studioServicesCatalogPath(pathname: string): string {
  return isStudioSalesPath(pathname) ? STUDIO_SALES_SERVICES : '/settings/studio/services'
}

/** Catalogue line editor (Sales hub). */
export function studioCatalogEditorPath(pathname: string, catalogId: string): string {
  return isStudioSalesPath(pathname) ? studioSalesCatalogDetail(catalogId) : `/settings/studio/services/${catalogId}`
}

/** Reviews list. */
export function studioReviewsListPath(pathname: string): string {
  return isStudioSalesPath(pathname) ? STUDIO_SALES_REVIEWS : '/settings/studio/reviews'
}

/** Review editor (Sales hub). */
export function studioReviewEditorPath(pathname: string, reviewId: string): string {
  return isStudioSalesPath(pathname) ? studioSalesReviewDetail(reviewId) : `/settings/studio/reviews/${reviewId}`
}

const SALES_GROUP_DETAIL = /^\/settings\/studio\/sales\/groups\/([^/]+)$/
const SALES_CATALOG_DETAIL = /^\/settings\/studio\/sales\/services\/([^/]+)$/
const SALES_WORK_DETAIL = /^\/settings\/studio\/sales\/works\/([^/]+)$/
const SALES_REVIEW_DETAIL = /^\/settings\/studio\/sales\/reviews\/([^/]+)$/
const SALES_SEGMENT_DETAIL = /^\/settings\/studio\/sales\/segments\/([^/]+)$/
const SALES_TOOL_DETAIL = /^\/settings\/studio\/sales\/tools\/([^/]+)$/
const SALES_PRODUCT_DETAIL = /^\/settings\/studio\/sales\/products\/([^/]+)$/
const SALES_PLAYBOOK_DETAIL = /^\/settings\/studio\/sales\/playbooks\/([^/]+)$/

export function isStudioSalesDetailEditorPath(pathname: string): boolean {
  return (
    SALES_GROUP_DETAIL.test(pathname) ||
    SALES_CATALOG_DETAIL.test(pathname) ||
    SALES_WORK_DETAIL.test(pathname) ||
    SALES_REVIEW_DETAIL.test(pathname) ||
    SALES_SEGMENT_DETAIL.test(pathname) ||
    SALES_TOOL_DETAIL.test(pathname) ||
    SALES_PRODUCT_DETAIL.test(pathname) ||
    SALES_PLAYBOOK_DETAIL.test(pathname)
  )
}

/** Detail editor with right relations rail (Proscus-style 3-column scroll). */
export function studioRelationsEntityFromPath(pathname: string): StudioRelationsEntity | null {
  const groupMatch = pathname.match(SALES_GROUP_DETAIL)
  if (groupMatch?.[1]) return { kind: 'group', id: groupMatch[1] }

  const catalogMatch = pathname.match(SALES_CATALOG_DETAIL)
  if (catalogMatch?.[1]) return { kind: 'catalog', id: catalogMatch[1] }

  const workMatch = pathname.match(SALES_WORK_DETAIL)
  if (workMatch?.[1]) return { kind: 'work', id: workMatch[1] }

  const reviewMatch = pathname.match(SALES_REVIEW_DETAIL)
  if (reviewMatch?.[1]) return { kind: 'review', id: reviewMatch[1] }

  const segmentMatch = pathname.match(SALES_SEGMENT_DETAIL)
  if (segmentMatch?.[1]) return { kind: 'segment', id: segmentMatch[1] }

  const toolMatch = pathname.match(SALES_TOOL_DETAIL)
  if (toolMatch?.[1]) return { kind: 'tool', id: toolMatch[1] }

  const productMatch = pathname.match(SALES_PRODUCT_DETAIL)
  if (productMatch?.[1]) return { kind: 'product', id: productMatch[1] }

  return null
}

