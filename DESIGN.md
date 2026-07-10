---
name: 2mb CRM
description: Internal Ops + Sales tool — Swiss minimal UI on Inter with one warm accent.
colors:
  background: "#ffffff"
  foreground: "#000000"
  surface-dark: "#0a0a0a"
  foreground-on-dark: "#fafafa"
  accent: "#D99E6A"
  accent-foreground: "#000000"
  muted: "#737373"
  border: "#e5e5e5"
  destructive: "#DC2626"
  info: "#2563EB"
  success: "#16A34A"
  warning: "#D97706"
typography:
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.35
rounded:
  sm: "0.125rem"
  md: "0.25rem"
spacing:
  page-padding: "1.5rem"
  section: "1rem"
components:
  button-primary:
    backgroundColor: "{colors.foreground}"
    textColor: "{colors.background}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 1rem"
  card-surface:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    padding: "1rem"
---

# Design System: 2mb CRM

## Overview

**Creative North Star: "The Swiss Ops Console"**

The interface reads as a **serious internal instrument**: calm density, clear pipeline state, and dossier content as the hero. Visual noise is avoided; separation comes from **1px borders**, whitespace, and type weight — not gradients or decorative chrome. Marketing-style registration flows may use an isolated **light paper** island (`register-marketing-*`) without changing the core app register.

**Key characteristics:**

- Monochrome-first surfaces with **one warm accent** (`#D99E6A`) for emphasis and brand continuity.
- **Inter** for UI and long-form; hierarchy via size and weight, not display faces.
- **Mobile-first** breakpoints; desktop gets persistent nav and wider canvases.
- **Semantic overlays** use `--ui-scrim*` tokens (tinted neutrals), not literal `bg-black`, for modals and drawers.

## Colors

Palette is **restrained product**: neutrals carry the UI; semantic colors (destructive, success, warning, info) appear only for status and alerts.

### Primary

- **Ink on paper** (`#000` on `#fff`, light): default text and primary actions; inverted in `.dark` using near-black `#0a0a0a` surfaces and `#fafafa` text.

### Accent

- **Warm copper** (`#D99E6A`): single brand accent; paired with `#000` accent-foreground for contrast on fills.

### Neutral

- **Muted** (`#737373` / `#b4b4b4` dark): secondary labels, helper copy, blockquote tone.
- **Border** (`#e5e5e5` / `#71717a` dark): dividers, inputs, cards.

### Overlays (CSS variables)

- **`--ui-scrim`**: default modal / drawer dimmer (OKLCH mix, cool-tinted, not pure black).
- **`--ui-scrim-strong`**: command palette and heavy focus.
- **`--ui-scrim-subtle`**: hover veils on media.
- **`--ui-scrim-chip`**: compact labels on imagery (e.g. proposal compare).
- **`--ui-video-matte`**: letterbox behind video and thumbnails.

### Named rules

**The One Accent Rule.** Only the copper accent carries brand warmth; charts and data use semantic blues/greens/reds, not extra decorative hues.

## Typography

**Body font:** Inter (system-ui fallback).

**Character:** Neutral, confident, slightly tight headings; body stays readable to **~75ch** in prose and dossier sections.

### Hierarchy

- **Page / section titles:** `font-semibold`, step up from body (see in-feature headings).
- **Body:** `1rem` / 400, default line-height 1.5.
- **Labels / meta:** smaller sizes with `text-muted`; uppercase only where i18n allows and readability stays high.

## Elevation

**Flat-by-default.** Depth is communicated with **borders** and background steps (`bg-background`, `border-border`). **Popover surfaces** (menus, listboxes, command palette, toasts) do not use Tailwind `shadow-*`; separation is the 1px border only.

## Components

### Buttons

Primary actions use **solid ink** (primary) on light and inverted on dark; ghost/secondary use border or muted fills from tokens.

### Cards & panels

**`rounded-sm`** (2px-class mapping) with `border-border`; internal padding aligned to the 0.25–1.5rem rhythm.

### Modals & overlays

**Headless UI `Dialog`**: backdrop uses **`bg-[color:var(--ui-scrim)]`**; panels sit on `bg-background` with `border-border`.

### Command palette

Full-screen scrim **`--ui-scrim-strong`**, centered panel `max-w-lg`, `rounded-sm`, `border`.

### Rich text (Tiptap / informational)

Shared `.tiptap` / `.informational-body` styles: lists, headings, code blocks, **blockquote** with a **1px full border** (muted) and subtle tinted background — no single thick accent stripe.

## Do's and Don'ts

### Do

- **Do** use `var(--ui-*)` and Tailwind semantic colors (`bg-background`, `text-foreground`, `border-border`).
- **Do** use scrim / matte tokens for anything that dims the page or sits behind video.
- **Do** respect `prefers-reduced-motion` when adding transitions beyond opacity/transform.

### Don't

- **Don't** use **pure decorative** gradient text, glass stacks, or hero "big number" marketing blocks in core CRM surfaces.
- **Don't** use **`border-left` / `border-right` > 1px** as a colored card accent (Impeccable side-tab tell); blockquotes use **1px** + tint only.
- **Don't** default to modals for low-stakes edits; prefer inline / drawer patterns where the product already does.
- **Don't** introduce extra display fonts without updating this file and `@theme`.
