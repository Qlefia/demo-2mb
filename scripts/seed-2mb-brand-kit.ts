/**
 * Seeds the primary 2mb Studio brand kit: named proposal colours, Inter typography,
 * and the 2MB wordmark SVG uploaded to workspace-studio storage.
 *
 * Usage: npm run seed:2mb-brand-kit
 */
import { config as loadEnv } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

loadEnv({ path: '.env.local' })
loadEnv()

const WORKSPACE_ID = '00000000-0000-4000-8000-000000000001'
const PRIMARY_BRAND_KIT_ID = 'efdd8477-5ad3-4f78-8a0f-6fd8993f6c87'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
})

const WORDMARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 175 18" fill="none"><path d="M10.4386 0.120931H0V3.99073H13.0175V6.65121H0V17.0513H16.9474V13.1815H3.92982V10.521H16.9474V3.99073L10.4386 0.120931Z" fill="#FAFAFA"/><path d="M19.7719 17.0513V0.120931H30.4561L36.5965 3.99073V0.120931H43.4737L49.9825 3.99073V17.0513H45.807V3.99073H36.5965V17.0513H32.5439V3.99073H23.4561V17.0513H19.7719Z" fill="#FAFAFA"/><path d="M72.2105 17.0513V13.1815H76.1403V17.0513H72.2105Z" fill="#FAFAFA"/><path d="M78.8421 13.1815V17.0513H89.1579L95.9123 13.1815V6.53028H82.7719V3.99073H95.9123V0H85.4737L78.8421 3.99073V10.2791H92.1053V13.1815H78.8421Z" fill="#FAFAFA"/><path d="M98.614 13.1815V0H102.421V1.33024H109.053V5.32097H102.421V13.1815H109.053V17.0513H105L98.614 13.1815Z" fill="#FAFAFA"/><path d="M111.754 17.0513V0H115.684V13.1815H124.895V0H128.825V13.1815L122.193 17.0513H111.754Z" fill="#FAFAFA"/><path d="M151.298 17.0513V0H155.228V17.0513H151.298Z" fill="#FAFAFA"/><path fill-rule="evenodd" clip-rule="evenodd" d="M131.404 0V17.0513H141.965L148.719 13.1815V3.99073L141.965 0H131.404ZM135.456 13.1815V3.99073H144.789V13.1815H135.456Z" fill="#FAFAFA"/><path fill-rule="evenodd" clip-rule="evenodd" d="M157.93 3.99073V13.1815L164.439 17.0513H168.491L175 13.1815V3.99073L168.491 0H164.439L157.93 3.99073ZM161.737 13.1815V3.99073H171.07V13.1815H161.737Z" fill="#FAFAFA"/><path fill-rule="evenodd" clip-rule="evenodd" d="M52.5614 0.120931V17.0513H63.1228L69.5088 13.1815V10.2791L66.5614 8.46517L69.5088 6.65121V3.99073L63.1228 0.120931H52.5614ZM56.3684 6.40935V3.99073H65.5789V6.40935H56.3684ZM56.3684 10.521V13.1815H65.5789V10.521H56.3684Z" fill="#FAFAFA"/></svg>`

function wordmarkDataUrl(): string {
  return `data:image/svg+xml;base64,${Buffer.from(WORDMARK_SVG, 'utf8').toString('base64')}`
}

async function main() {
  const env = envSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  })

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })

  const logoUrl = wordmarkDataUrl()

  const accentFontId = 'font-inter-accent'
  const bodyFontId = 'font-inter-body'
  const logoId = 'logo-2mb-primary'

  const brandColors = [
    { id: 'color-bronze-accent', hex: '#B08D57', name: 'Bronze (accent)' },
    { id: 'color-dark-base', hex: '#151515', name: 'Dark base (background)' },
    { id: 'color-deep-brown', hex: '#3D281F', name: 'Deep brown (surface)' },
    { id: 'color-burgundy', hex: '#B94E48', name: 'Burgundy (tag chip)' },
    { id: 'color-wine-dark', hex: '#261820', name: 'Wine dark (surface tint)' },
    { id: 'color-off-white', hex: '#E8E8E8', name: 'Off-white (text / heading)' },
    { id: 'color-muted-mix', hex: '#9A9A9A', name: 'Muted (body)' },
    { id: 'color-line', hex: '#333333', name: 'Line (border)' },
    { id: 'color-letterhead', hex: '#FAFAFA', name: 'Letterhead (sheet)' },
    { id: 'color-letterhead-fg', hex: '#141414', name: 'Letterhead text' },
    { id: 'color-letterhead-muted', hex: '#575757', name: 'Letterhead muted' },
    { id: 'color-letterhead-line', hex: '#E5E5E5', name: 'Letterhead line' },
  ]

  const brandFonts = [
    {
      id: accentFontId,
      family: 'Montserrat',
      source: 'google' as const,
      fontDataUrl: null,
    },
    {
      id: bodyFontId,
      family: 'Inter',
      source: 'google' as const,
      fontDataUrl: null,
    },
  ]

  const brandLogos = [
    {
      id: logoId,
      label: '2MB wordmark (dark deck)',
      role: 'primary' as const,
      imageDataUrl: logoUrl,
    },
  ]

  const { data: row, error: fetchError } = await supabase
    .from('workspace_studio_settings')
    .select('general, revision')
    .eq('workspace_id', WORKSPACE_ID)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (!row) throw new Error(`workspace_studio_settings missing for ${WORKSPACE_ID}`)

  const general = (row.general ?? {}) as Record<string, unknown>
  const brands = Array.isArray(general.studioBrands) ? [...general.studioBrands] : []
  const kitIndex = brands.findIndex(
    (b: { id?: string }) => b?.id === PRIMARY_BRAND_KIT_ID,
  )
  const existingKit =
    kitIndex >= 0 ? (brands[kitIndex] as Record<string, unknown>) : { id: PRIMARY_BRAND_KIT_ID }

  const patchedKit = {
    ...existingKit,
    id: PRIMARY_BRAND_KIT_ID,
    isPrimary: true,
    name: '2mb Studio',
    logos: brandLogos,
    fonts: brandFonts,
    accentFontId,
    bodyFontId,
    colors: brandColors,
  }

  if (kitIndex >= 0) {
    brands[kitIndex] = patchedKit
  } else {
    brands.unshift(patchedKit)
  }

  const nextGeneral = { ...general, studioBrands: brands }
  const nextRevision = (typeof row.revision === 'number' ? row.revision : 0) + 1

  const { error: updateError } = await supabase
    .from('workspace_studio_settings')
    .update({
      general: nextGeneral,
      revision: nextRevision,
      updated_at: new Date().toISOString(),
    })
    .eq('workspace_id', WORKSPACE_ID)

  if (updateError) throw updateError

  console.log('2mb brand kit seeded:')
  console.log(`  workspace: ${WORKSPACE_ID}`)
  console.log(`  kit: ${PRIMARY_BRAND_KIT_ID}`)
  console.log(`  colors: ${brandColors.length}`)
  console.log(`  logo: ${logoUrl}`)
  console.log(`  fonts: Montserrat (accent) + Inter (body)`)
  console.log(`  revision: ${nextRevision}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
