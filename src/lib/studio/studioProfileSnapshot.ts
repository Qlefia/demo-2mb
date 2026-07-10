import type {
  StudioGeneral,
  StudioProduct,
  StudioReview,
  StudioSegment,
  StudioServiceCatalogItem,
  StudioServiceGroup,
  StudioTool,
  StudioWork,
} from '@/stores/studioProfileTypes'

export type StudioSalesSnapshot = {
  serviceCatalog: StudioServiceCatalogItem[]
  serviceGroups: StudioServiceGroup[]
  segments: StudioSegment[]
  works: StudioWork[]
  reviews: StudioReview[]
  tools: StudioTool[]
  products: StudioProduct[]
}

export type StudioProfileSnapshot = {
  general: StudioGeneral
  sales: StudioSalesSnapshot
}

/** Zustand store slice used for API sync (sales fields are top-level). */
export type StudioProfileStoreSlice = {
  general: StudioGeneral
  serviceCatalog: StudioServiceCatalogItem[]
  serviceGroups: StudioServiceGroup[]
  segments: StudioSegment[]
  works: StudioWork[]
  reviews: StudioReview[]
  tools: StudioTool[]
  products: StudioProduct[]
}

export function studioSalesSnapshotFromState(state: StudioProfileStoreSlice): StudioSalesSnapshot {
  return {
    serviceCatalog: state.serviceCatalog,
    serviceGroups: state.serviceGroups,
    segments: state.segments,
    works: state.works,
    reviews: state.reviews,
    tools: state.tools,
    products: state.products,
  }
}

export function studioProfileSnapshotFromState(state: StudioProfileStoreSlice): StudioProfileSnapshot {
  return {
    general: state.general,
    sales: studioSalesSnapshotFromState(state),
  }
}

export function emptyStudioSalesSnapshot(): StudioSalesSnapshot {
  return {
    serviceCatalog: [],
    serviceGroups: [],
    segments: [],
    works: [],
    reviews: [],
    tools: [],
    products: [],
  }
}

export function isStudioSalesSnapshot(value: unknown): value is StudioSalesSnapshot {
  if (!value || typeof value !== 'object') return false
  const s = value as Partial<StudioSalesSnapshot>
  return (
    Array.isArray(s.serviceCatalog) &&
    Array.isArray(s.serviceGroups) &&
    Array.isArray(s.segments) &&
    Array.isArray(s.works) &&
    Array.isArray(s.reviews)
    // `tools` and `products` are accepted as empty arrays when absent (server
    // backfill happens in `mergeServerStudioProfile` on the client and in the
    // load path on the server); legacy rows without these keys must still pass.
  )
}
