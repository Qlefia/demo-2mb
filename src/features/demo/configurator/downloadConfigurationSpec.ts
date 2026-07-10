import { buildConfigurationQuote, formatEuro } from './configurationPricing'
import { buildSummaryLines } from './buildSummary'
import type { ConfiguratorManifest, ConfiguratorState } from './types'

export function buildConfigurationDownloadText(
  state: ConfiguratorState,
  manifest: ConfiguratorManifest,
): string {
  const quote = buildConfigurationQuote(state, manifest)
  const summary = buildSummaryLines(state, manifest)
  const upgradeLines = quote.lines.filter((line) => line.amountEur > 0)

  const lines = [
    `Urban Oasis — ${manifest.project.title}`,
    `Design package: ${quote.packageName}`,
    '',
    'Configuration',
    ...summary.slice(1).map((line) => `  ${line}`),
    '',
    'Pricing',
    `  Design package: ${formatEuro(quote.packageBaseEur)}`,
  ]

  if (upgradeLines.length > 0) {
    lines.push('  Material upgrades:')
    for (const line of upgradeLines) {
      lines.push(`    ${line.zone} — ${line.value}: +${formatEuro(line.amountEur)}`)
    }
    lines.push(`  Upgrades subtotal: +${formatEuro(quote.upgradesEur)}`)
  }

  lines.push(`  Total: ${formatEuro(quote.totalEur)}`)
  lines.push('', `Generated ${new Date().toISOString()}`)

  return lines.join('\n')
}

export function downloadConfigurationSpec(state: ConfiguratorState, manifest: ConfiguratorManifest) {
  const text = buildConfigurationDownloadText(state, manifest)
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${manifest.project.slug}-configuration.txt`
  anchor.click()
  URL.revokeObjectURL(url)
}
