# Solaire — Design Style Guide

A reference for design tokens, typography, spacing, and visual language used in the Solaire theme. Useful for merchants customizing their store and for developers extending the theme.

---

## Design Philosophy

Solaire embodies **refined luxury with editorial restraint**. It draws inspiration from high-end fashion magazines and luxury eyewear boutiques — generous white space, considered typography, and warm gold accents that evoke quality without shouting. The aesthetic is clean, confident, and lets product imagery take center stage.

---

## Color Palette

### Base Colors

| Token | CSS Variable | Hex | Role |
|-------|-------------|-----|------|
| Primary background | `--color-bg-primary` | `#faf8f5` | Main page background — warm off-white with a hint of cream |
| Secondary background | `--color-bg-secondary` | `#f3f0eb` | Alternating sections, cards, subtle differentiation |
| Dark background | `--color-bg-dark` | `#1a1a1a` | Dark sections, footer, mood areas |
| Rich black | `--color-bg-rich-black` | `#0d0d0d` | True black for high-impact areas, overlays |

### Text Colors

| Token | CSS Variable | Hex | Role |
|-------|-------------|-----|------|
| Primary text | `--color-text-primary` | `#1a1a1a` | Headings, body copy, primary content |
| Secondary text | `--color-text-secondary` | `#6b6b6b` | Captions, metadata, secondary information |
| Light text | `--color-text-light` | `#faf8f5` | Text on dark backgrounds |

### Accent & Interactive

| Token | CSS Variable | Hex | Role |
|-------|-------------|-----|------|
| Accent | `--color-accent` | `#c9a96e` | Gold — primary accent, CTAs, highlights |
| Accent hover | `--color-accent-hover` | `#b8934f` | Darker gold for hover states |
| Button background | `--color-button-bg` | `#1a1a1a` | Primary button fill |
| Button text | `--color-button-text` | `#faf8f5` | Primary button label |
| Accent button bg | `--color-button-accent-bg` | `#c9a96e` | Gold button fill |
| Accent button text | `--color-button-accent-text` | `#1a1a1a` | Gold button label |
| Border | `--color-border` | `#e0dcd5` | Dividers, input borders, card edges |

### Status Colors

| Token | CSS Variable | Hex | Role |
|-------|-------------|-----|------|
| Error | `--color-error` | `#c13515` | Error messages, destructive actions |
| Success | `--color-success` | `#2d6a4f` | Success messages, confirmations |
| Sale badge | `--color-sale-badge` | `#c13515` | Sale indicator badges |
| Sold out badge | `--color-sold-out-badge` | `#6b6b6b` | Sold out indicator |

---

## Typography

### Font Families

**Headings** — Serif, elegant, fashion-forward:
- **Playfair Display** (default) — Classic editorial serif. Refined and timeless.
- Cormorant Garamond — Lighter, more delicate serif. Ideal for ultra-luxe brands.
- Bodoni Moda — High-contrast Didone style. Dramatic and bold.
- Tenor Sans — Modern geometric sans-serif. For a more contemporary edge.
- System serif — Native serif fonts. No external font loading.

**Body** — Clean sans-serif, highly readable:
- **Inter** (default) — Modern, highly legible. Excellent at small sizes.
- Lato — Warm, friendly sans-serif. Slightly rounded character.
- Work Sans — Geometric with personality. Wider letterforms.
- System sans-serif — Native system fonts for maximum performance.

### Scale

Type scale is controlled by two settings: **base font size** (default: 16px) and **scale ratio** (default: 1.25, a Major Third).

| Level | Size (at 16px/1.25) | Usage |
|-------|---------------------|-------|
| `--text-xs` | 0.64rem (10.24px) | Fine print, legal text |
| `--text-sm` | 0.8rem (12.8px) | Captions, metadata |
| `--text-base` | 1rem (16px) | Body copy |
| `--text-lg` | 1.25rem (20px) | Large body, pull quotes |
| `--text-xl` | 1.563rem (25px) | Subheadings |
| `--text-2xl` | 1.953rem (31.25px) | H3 |
| `--text-3xl` | 2.441rem (39.06px) | H2 |
| `--text-4xl` | 3.052rem (48.83px) | H1, hero headings |
| `--text-5xl` | 3.815rem (61.04px) | Display, hero |

### Weights
- **Heading weight:** 400 (range: 300–900)
- **Body weight:** 400 (range: 300–500)

### Letter Spacing
- **Headings:** 0em (can be adjusted from -0.05em to 0.2em)
- **Body:** 0em (can be adjusted from -0.02em to 0.1em)

---

## Spacing Scale

The theme uses a consistent spacing scale based on 4px increments.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 0.25rem (4px) | Micro spacing, icon padding |
| `--space-2` | 0.5rem (8px) | Tight inline spacing |
| `--space-3` | 0.75rem (12px) | Standard inline spacing |
| `--space-4` | 1rem (16px) | Block padding, card padding |
| `--space-5` | 1.25rem (20px) | Comfortable block padding |
| `--space-6` | 1.5rem (24px) | Section internal spacing |
| `--space-8` | 2rem (32px) | Large section padding |
| `--space-10` | 2.5rem (40px) | Extra large gaps |
| `--space-12` | 3rem (48px) | Hero padding |
| `--space-16` | 4rem (64px) | Major section breaks |
| `--space-20` | 5rem (80px) | Maximum section spacing |

| Variable | Default | Description |
|----------|---------|-------------|
| `--page-gutter` | 2rem (32px) | Horizontal page margin |
| `--section-spacing` | 6rem (96px) | Vertical space between sections |
| `--header-padding` | `--spacing-standard` | Header vertical padding |

---

## Layout

### Page Width
- **Maximum content width:** 1440px (`--page-width`)
- **Page gutter (horizontal margin):** 2rem (`--page-gutter`)
- **All content is centered** and constrained to `--page-width`

### Grid System
- Based on CSS Grid with flexible columns
- Product grids: 2 columns (mobile) → 3 or 4 columns (desktop)
- Testimonial grids: 1 column (mobile) → 2–4 columns (desktop)
- Footer: 1 column (mobile) → 3 columns (desktop)

### Breakpoints
| Name | Width | Target Devices |
|------|-------|---------------|
| Mobile | 0–767px | Phones in portrait |
| Tablet | 768px–1023px | Tablets and landscape phones |
| Desktop | 1024px+ | Laptops, desktops |

The primary CSS breakpoint is **768px** (`@media (min-width: 768px)`).

---

## Visual Language

### Borders & Dividers
- Subtle borders: `1px solid var(--color-border)` (`#e0dcd5`)
- Rounded corners: minimal — `4px` for cards, `2px` for buttons, `0` for images
- Dividers used sparingly — prefer whitespace for separation

### Shadows
Solaire avoids heavy drop shadows in favor of flat, editorial design. Subtle shadows used only when functionally necessary:
- **Card hover:** `0 4px 12px rgba(0,0,0,0.06)` — gentle lift on hover
- **Sticky header:** `0 1px 0 rgba(0,0,0,0.08)` — hairline shadow for separation
- **Drawers:** `0 0 40px rgba(0,0,0,0.15)` — modal depth

### Buttons
- **Primary:** Solid dark background, light text. Used for main CTAs (Add to cart, Checkout).
- **Secondary/Accent:** Solid gold background, dark text. Used for accent CTAs (Shop collection, View all).
- **Outlined:** Transparent with border. Used for secondary actions.
- **Size:** Generous padding — minimum 44px height for touch targets.
- **Hover:** Slight opacity or background color shift with `transition: all 0.2s ease`.

### Imagery
- **Dominant, immersive photography** — heroes and product shots are the primary visual element.
- Images should be high-contrast, well-lit, and product-focused.
- Overlays are subtle (10–30% opacity) — let the image breathe.
- Aspect ratios are flexible but consistent within sections.

---

## Motion

- **Scroll behavior:** `scroll-behavior: smooth` enabled globally.
- **Hover transitions:** `0.2s ease` on interactive elements.
- **Drawer open/close:** `0.3s ease` slide with overlay fade.
- **Hero transitions:** Configurable crossfade or slide.
- **Back-to-top:** Smooth scroll to top on click.
- **ATC loading:** Spinner with `0.2s` fade transition.
- Avoid motion that lasts longer than 300ms for UI interactions.
- Respect `prefers-reduced-motion` for accessibility.

---

## Iconography

- All icons are inline SVGs rendered via Liquid snippets.
- Icons use `currentColor` for automatic color inheritance.
- Consistent 24×24 viewBox across all icons.
- Stroke-based icons with `stroke-width: 2` and `stroke-linecap: round`.
- Social icons match official brand colors on hover.

---

## Forms & Inputs

- **Input height:** 48px minimum for comfortable touch targets.
- **Border:** `1px solid var(--color-border)`, focus state `1px solid var(--color-text-primary)`.
- **Labels:** Above the input, `--text-sm`, secondary color.
- **Error state:** Red border + error message below.
- **Placeholder:** Light gray, italic optional.
- **Newsletter form:** Inline layout on desktop (input + button side by side), stacked on mobile.

---

## Cart Drawer

- Slides in from the right (desktop) or full-width (mobile).
- Dark overlay with fade transition.
- Free shipping progress bar at the top (gradient fill in accent color).
- Line items with image, title, variant, quantity stepper, price, and remove button.
- Footer with subtotal, shipping note, and checkout CTA.
- Order notes field at the bottom.

---

*This style guide is a living document. As the theme evolves, design tokens and patterns will be updated here.*
