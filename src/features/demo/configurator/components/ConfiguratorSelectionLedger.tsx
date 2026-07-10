'use client'

import type { Dispatch } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { demoCopy } from '../copy.en'
import { upgradeLabelForOption } from '../configurationPricing'
import { DESIGN_DEFAULT_KITCHEN, DESIGN_DEFAULT_LIVING } from '../designDefaults'
import type { ConfiguratorManifest, ConfiguratorState, HotspotId } from '../types'
import type { ConfiguratorAction } from '../configuratorReducer'
import {
  buildConfigurationZones,
  findHotspot,
  hotspotSelectAction,
  resolveHotspotSelection,
} from '../hotspotUtils'
import { OptionSwatchRow } from './OptionSwatch'

type ConfiguratorSelectionLedgerProps = {
  state: ConfiguratorState
  manifest: ConfiguratorManifest
  dispatch: Dispatch<ConfiguratorAction>
}

export function ConfiguratorSelectionLedger({
  state,
  manifest,
  dispatch,
}: ConfiguratorSelectionLedgerProps) {
  const design = manifest.designs[state.designId]
  const zones = buildConfigurationZones(state, manifest)

  const focusHotspot = (hotspotId: HotspotId) => {
    dispatch({
      type: 'SET_ACTIVE_HOTSPOT',
      hotspotId: state.activeHotspot === hotspotId ? null : hotspotId,
    })
  }

  const defaultOptionId = (hotspotId: HotspotId): string => {
    const kitchen = DESIGN_DEFAULT_KITCHEN[state.designId]
    const living = DESIGN_DEFAULT_LIVING[state.designId]
    switch (hotspotId) {
      case 'lower-cabinets':
        return kitchen.colorId
      case 'upper-cabinets':
        return kitchen.upperCabinetId
      case 'backsplash':
        return kitchen.backsplashId
      case 'wall-color':
        return living.wallColorId
      case 'furniture':
        return living.tableId
      default:
        return ''
    }
  }

  return (
    <section aria-label={demoCopy.configurationTitle} className="shrink-0 space-y-2 pb-1">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {demoCopy.configurationTitle}
        </p>
        {!state.activeHotspot ? (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{demoCopy.hotspotPanelHint}</p>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <ul className="divide-y divide-border">
          {zones.map((zone) => {
            const active = state.activeHotspot === zone.hotspotId
            const hotspot = findHotspot(design, zone.hotspotId)
            const selection = hotspot ? resolveHotspotSelection(state, design, hotspot) : null
            const packageDefaultId = defaultOptionId(zone.hotspotId)
            const rowUpgrade = upgradeLabelForOption(
              state.designId,
              selection?.selectedId ?? packageDefaultId,
              packageDefaultId,
            )

            return (
              <li key={zone.hotspotId}>
                <button
                  type="button"
                  onClick={() => focusHotspot(zone.hotspotId)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left transition-colors',
                    active ? 'bg-accent/10 ring-1 ring-inset ring-accent/35' : 'hover:bg-muted/15',
                  )}
                  aria-expanded={active}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] text-muted-foreground">{zone.zone}</span>
                    <span className="block truncate text-sm font-medium text-foreground">
                      {zone.value}
                      {rowUpgrade ? (
                        <span className="ml-1.5 text-xs font-normal tabular-nums text-muted-foreground">
                          {rowUpgrade}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <ChevronRight
                    className={cn(
                      'size-3.5 shrink-0 text-muted-foreground transition-transform',
                      active && 'rotate-90 text-foreground',
                    )}
                    aria-hidden
                  />
                </button>

                {active && hotspot && selection && selection.options.length > 0 ? (
                  <div className="border-t border-border bg-muted/10 px-3 pb-3 pt-2">
                    <OptionSwatchRow
                      title=""
                      options={selection.options.map((opt) => ({
                        ...opt,
                        priceLabel: upgradeLabelForOption(
                          state.designId,
                          opt.id,
                          packageDefaultId,
                        ),
                      }))}
                      selectedId={selection.selectedId}
                      onSelect={(id) => dispatch(hotspotSelectAction(hotspot, id))}
                      compact
                    />
                  </div>
                ) : active && hotspot && selection && selection.options.length === 0 ? (
                  <div className="border-t border-border bg-muted/10 px-3 py-2">
                    <p className="text-xs leading-snug text-muted-foreground">
                      {state.designId === 'design-3'
                        ? 'Select olive green cabinets, or blue shelves for tile options.'
                        : 'Configuration options for this design are coming soon.'}
                    </p>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
