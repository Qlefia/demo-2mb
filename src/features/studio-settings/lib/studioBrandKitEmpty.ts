import { studioBrandKitNewId } from '@/features/studio-settings/lib/studioBrandKitHelpers'
import type { StudioBrandProfile } from '@/stores/studioProfileTypes'

export function createEmptyBrandKit(isPrimary: boolean): StudioBrandProfile {
  return {
    id: studioBrandKitNewId(),
    isPrimary,
    name: '',
    slogan: '',
    description: '',
    strengthPositioning: '',
    studioPrinciples: '',
    logos: [],
    fonts: [],
    accentFontId: null,
    bodyFontId: null,
    colors: [],
    socialNetworks: [],
    voiceGuidelines: '',
    strategyNotes: '',
    businessProfile: '',
  }
}
