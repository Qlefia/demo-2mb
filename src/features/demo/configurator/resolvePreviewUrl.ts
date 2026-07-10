import type { ConfiguratorManifest, ConfiguratorState } from './types'
import type { HotspotLayoutKey } from './hotspotLayouts'
import { resolveDesign3PreviewFrame, resolveDesign3PreviewFrameByLayout } from './design3Preview'

export type PreviewAspect = '9/5' | '4/5' | '20/11'

export type PreviewFrame = {
  url: string
  aspect: PreviewAspect
  hotspotLayout: HotspotLayoutKey
}

export function resolvePreviewFrame(
  state: ConfiguratorState,
  manifest: ConfiguratorManifest,
): PreviewFrame {
  if (state.designId === 'design-3') {
    return resolveDesign3PreviewFrame(state)
  }

  const design = manifest.designs[state.designId]
  return { url: design.heroImage, aspect: '9/5', hotspotLayout: 'hero' }
}

/** Debug mode: preview follows the selected layout, not the expanded sidebar zone. */
export function resolvePreviewFrameForDebug(
  state: ConfiguratorState,
  manifest: ConfiguratorManifest,
  layout: HotspotLayoutKey,
): PreviewFrame {
  if (state.designId === 'design-3') {
    return resolveDesign3PreviewFrameByLayout(state, layout)
  }

  const design = manifest.designs[state.designId]
  return { url: design.heroImage, aspect: '9/5', hotspotLayout: 'hero' }
}

import { KUULA_URBAN_OASIS } from './assets'

export function resolveKuulaUrl(
  _state: ConfiguratorState,
  _manifest: ConfiguratorManifest,
): string {
  return KUULA_URBAN_OASIS
}

/** @deprecated Use resolvePreviewFrame */
export function resolvePreviewUrl(state: ConfiguratorState, manifest: ConfiguratorManifest): string {
  return resolvePreviewFrame(state, manifest).url
}
