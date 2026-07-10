# Proposal deck — layout contract M1

Audience: Design + engineering alignment for Phase 9 client-facing PDF/HTML.

## Scope

- **Digital PDF / screen first.** Print bleed CMYK out of scope unless product asks later.
- **Typography:** Inter; scale in `src/lib/proposals/deckLayout.ts`.
- **Palette:** monochrome + muted gray; no decorative gradients (Swiss minimalism, aligned with CRM design system).

## Golden regression

After visual changes, manually verify:

1. Cover — title hierarchy, spacing, image aspect not stretched.
2. Section — H2 + body + rule line.
3. Comparable case card — image + two lines text.
4. Testimonial — quote + attribution block.
5. Pricing table — column alignment.

## Parity rule

The same block props JSON feeds:

- Dashboard preview (`DeckPreview`)
- `@react-pdf/renderer` document (`ProposalPdfDocument`)
- Public token page (`/p/[token]`)

If a renderer cannot express a prop, change the block schema — do not fork props per surface.
