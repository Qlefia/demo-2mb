import type { LucideIcon } from 'lucide-react'
import {
  CircleDollarSign,
  ClipboardList,
  FolderTree,
  Images,
  Package,
  Star,
  Target,
  Wrench,
} from 'lucide-react'

export type StudioRelationsEntityKind =
  | 'group'
  | 'catalog'
  | 'work'
  | 'review'
  | 'segment'
  | 'tool'
  | 'product'

export type StudioRelationsEntity = {
  kind: StudioRelationsEntityKind
  id: string
}

export type StudioRelationsTabId =
  | 'groups'
  | 'pricing'
  | 'services'
  | 'works'
  | 'reviews'
  | 'segments'
  | 'tools'
  | 'products'

export type StudioRelationsTabDef = {
  id: StudioRelationsTabId
  labelKey: string
  icon: LucideIcon
}

const TAB_DEFS: StudioRelationsTabDef[] = [
  { id: 'groups', labelKey: 'studioSettings.sales.tabs.groups', icon: FolderTree },
  { id: 'services', labelKey: 'studioSettings.sales.tabs.services', icon: ClipboardList },
  { id: 'pricing', labelKey: 'studioSettings.relationsSidebar.tabPricing', icon: CircleDollarSign },
  { id: 'works', labelKey: 'studioSettings.sales.tabs.works', icon: Images },
  { id: 'reviews', labelKey: 'studioSettings.sales.tabs.reviews', icon: Star },
  { id: 'segments', labelKey: 'studioSettings.sales.tabs.segments', icon: Target },
  { id: 'tools', labelKey: 'studioSettings.sales.tabs.tools', icon: Wrench },
  { id: 'products', labelKey: 'studioSettings.sales.tabs.products', icon: Package },
]

/** Tabs shown in the right relations rail; the entity being edited is always omitted. */
export function relationsTabsForEntity(kind: StudioRelationsEntityKind): StudioRelationsTabDef[] {
  // Tool detail rail surfaces inverse Groups + Services + Works pickers (where the tool is used).
  if (kind === 'tool') {
    return TAB_DEFS.filter((tab) => tab.id === 'groups' || tab.id === 'services' || tab.id === 'works')
  }
  // Product detail rail mirrors the bundle picker shape (Group + Services + Works).
  if (kind === 'product') {
    return TAB_DEFS.filter((tab) => tab.id === 'groups' || tab.id === 'services' || tab.id === 'works')
  }

  const hidden: StudioRelationsTabId =
    kind === 'group'
      ? 'groups'
      : kind === 'catalog'
        ? 'services'
        : kind === 'work'
          ? 'works'
          : kind === 'review'
            ? 'reviews'
            : 'segments'

  return TAB_DEFS.filter((tab) => {
    if (tab.id === hidden) return false
    if (tab.id === 'reviews' && kind === 'work') return false
    if (tab.id === 'segments') return false
    if (tab.id === 'pricing' && kind !== 'catalog' && kind !== 'group') return false
    if (tab.id === 'products') return false
    // `tools` on Work / Group / Catalog detail surfaces the picker (which tools are used).
    if (tab.id === 'tools' && kind !== 'work' && kind !== 'group' && kind !== 'catalog') return false
    return true
  })
}
