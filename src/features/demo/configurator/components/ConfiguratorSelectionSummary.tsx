'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { IconButton } from '@/components/atoms/IconButton'
import { buildConfigurationQuote, formatEuro } from '../configurationPricing'
import { demoCopy } from '../copy.en'
import type { ConfiguratorManifest, ConfiguratorState } from '../types'

type ConfiguratorSelectionSummaryProps = {
  state: ConfiguratorState
  manifest: ConfiguratorManifest
  onSave: () => void
  onDownload: () => void
}

export function ConfiguratorSelectionSummary({
  state,
  manifest,
  onSave,
  onDownload,
}: ConfiguratorSelectionSummaryProps) {
  const quote = buildConfigurationQuote(state, manifest)
  const upgradeLines = quote.lines.filter((line) => line.amountEur > 0)

  return (
    <section aria-label={demoCopy.selectionSummaryTitle} className="pb-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {demoCopy.selectionSummaryTitle}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">{quote.packageName}</p>
      </div>

      {upgradeLines.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {upgradeLines.map((line) => (
            <li
              key={line.hotspotId}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <span className="min-w-0 text-foreground">
                {line.zone} · {line.value}
              </span>
              <span className="shrink-0 tabular-nums font-medium text-foreground">
                +{formatEuro(line.amountEur)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 space-y-1 border-t border-border pt-3 text-xs">
        <div className="flex justify-between text-muted-foreground">
          <span>{demoCopy.packageBaseLabel}</span>
          <span className="tabular-nums">{formatEuro(quote.packageBaseEur)}</span>
        </div>
        {quote.upgradesEur > 0 ? (
          <div className="flex justify-between text-muted-foreground">
            <span>{demoCopy.upgradesLabel}</span>
            <span className="tabular-nums">+{formatEuro(quote.upgradesEur)}</span>
          </div>
        ) : null}
        <div className="flex justify-between pt-1 text-sm font-semibold text-foreground">
          <span>{demoCopy.totalLabel}</span>
          <span className="tabular-nums">{formatEuro(quote.totalEur)}</span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          variant="primary"
          size="md"
          className="survey-brand-button min-w-0 flex-1 rounded-lg"
          onClick={onSave}
        >
          {demoCopy.saveConfiguration}
        </Button>
        <IconButton
          type="button"
          icon={Download}
          variant="secondary"
          size="md"
          label={demoCopy.downloadConfiguration}
          className="survey-brand-button shrink-0 rounded-lg"
          onClick={onDownload}
        />
      </div>
    </section>
  )
}
