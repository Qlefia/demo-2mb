export type { StudioSalesListTab } from '@/lib/studio/studioSalesPaths'

export type StudioSalesListViewMode = 'list' | 'card' | 'kanban'

export type StudioSalesListSortBy = 'manual' | 'titleAsc' | 'titleDesc' | 'ratingDesc'

export type StudioSalesGroupFilter = 'all' | 'hasServices' | 'empty'

export type StudioSalesServiceFilter = 'all' | 'inGroup' | 'ungrouped'

export type StudioSalesWorkFilter = 'all' | 'featured' | 'draft' | 'in_review' | 'published' | 'unpublished'

export type StudioSalesReviewFilter = 'all' | 'rated' | 'unrated'

export type StudioSalesSegmentFilter = 'all'

export type StudioSalesToolFilter =
  | 'all'
  | 'render_engine'
  | 'modeling_3d'
  | 'cad_bim'
  | 'compositing'
  | 'post_production'
  | 'motion'
  | 'texturing'
  | 'plugin'
  | 'other'
  | 'featured'

export type StudioSalesProductFilter = 'all' | 'featured'

export type StudioSalesPlaybookFilter =
  | 'all'
  | 'first_touch'
  | 'follow_up'
  | 'voicemail'
  | 'objection'
  | 'discovery_call'
  | 'de'
  | 'en'

export type StudioSalesListFilter =
  | StudioSalesGroupFilter
  | StudioSalesServiceFilter
  | StudioSalesWorkFilter
  | StudioSalesReviewFilter
  | StudioSalesSegmentFilter
  | StudioSalesToolFilter
  | StudioSalesProductFilter
  | StudioSalesPlaybookFilter

export type StudioSalesListTabUi = {
  search: string
  viewMode: StudioSalesListViewMode
  sortBy: StudioSalesListSortBy
  filter: StudioSalesListFilter
}
