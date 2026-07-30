# Solaire — Premium Sunglasses Shopify Theme

**Version:** 1.0.0  
**Author:** Solaire Themes  
**Platform:** Shopify Online Store 2.0 (OS 2.0)

A premium, mobile-first Shopify theme designed specifically for sunglasses and eyewear brands. Built from the ground up for large-format imagery, lens detail close-ups, and a luxe, fashion-forward aesthetic. Every interaction is crafted to feel elegant and considered — from the smooth cart drawer to the immersive product galleries.

---

## Features

### Sections & Page Templates
| Section | Description |
|---------|-------------|
| **Announcement Bar** | Multi-message rotating bar with autoplay, dismiss button, and link support |
| **Header** | Sticky header, transparent overlay, logo positioning, search icon, account icon |
| **Hero Banner** | Full-featured carousel with crossfade/slide transitions, text overlays, autoplay |
| **Featured Collection** | Grid display with hover secondary images, "View all" button, column controls |
| **Image with Text** | Split-section layout with flexible image ratios and content alignment |
| **Testimonials** | Multi-column quote grid for social proof and brand credibility |
| **Newsletter** | Email signup section with multiple color schemes (light, dark, gold accent) |
| **Footer** | Multi-column with social icons, newsletter, payment icons, language/currency selectors |
| **Cart** | Slide-out drawer with free shipping progress bar and AJAX quantity updates |
| **Search** | Full-screen overlay search with suggestions and predictive results |
| **404 Page** | Custom not-found page with search, featured collections, and navigation |

### Design & UX
- **Mobile-first responsive design** — looks impeccable at every breakpoint
- **WCAG AA accessibility** — skip-to-content link, ARIA attributes, focus management, 44px+ touch targets
- **Performance-optimized** — font preloading, lazy images with explicit dimensions, deferred JS
- **Luxe color palette** — warm gold accents, rich charcoal, off-white, deep black
- **Elegant typography** — serif heading options (Playfair Display, Cormorant, Bodoni) paired with clean sans-serif body text
- **Smooth animations** — scroll behavior, hover transitions, back-to-top button
- **Image zoom** — lightbox and hover zoom on product pages
- **Color swatches** — variant swatches for frame/lens colors
- **Size guide** — built-in frame measurements modal
- **Sticky add-to-cart** — keeps the purchase option visible while browsing

---

## Installation

### Requirements
- A Shopify store (development or production)
- [Shopify CLI](https://shopify.dev/docs/themes/tools/cli) installed

### Quick Start
1. **Download the theme** from the Shopify Theme Store (or upload the ZIP to your store).
2. **In Shopify Admin**, go to **Online Store → Themes**.
3. Click **Upload theme** and select the `solaire-theme.zip` file.
4. Once uploaded, click **Customize** to open the Theme Editor.

### For Developers
```bash
# Clone the repository
git clone https://github.com/ChefTommy511/-solaire-theme.git
cd solaire-theme

# Serve locally with Shopify CLI
shopify theme dev --store your-store.myshopify.com

# Or push directly to a store
shopify theme push --store your-store.myshopify.com
```

---

## Customization Guide

All customization is done through the **Shopify Theme Editor** (Online Store → Themes → Customize). Below is a reference for each section and its key settings.

### Theme Settings (global)

Access these via **Theme Editor → Theme Settings** (the paintbrush icon in the left sidebar).

#### Colors
Configure every color in the theme — backgrounds, text, accents, buttons, borders, badges. The default palette is warm and luxe: off-white backgrounds, deep charcoal text, and gold accents (`#c9a96e`). See [Color Scheme Recommendations](#color-scheme-recommendations-for-sunglasses-brands) below for brand-specific suggestions.

#### Typography
- **Heading font**: Choose from Playfair Display, Cormorant Garamond, Bodoni Moda, Tenor Sans, or system serif.
- **Body font**: Choose from Inter, Lato, Work Sans, or system sans-serif.
- **Base size, scale ratio, weights, letter spacing** — fine-tune all type properties.

#### Header
- Upload your logo and set the width.
- Choose logo position (left or center).
- Select menu style (horizontal nav or hamburger drawer).
- Enable sticky header with "Always visible" or "Show on scroll up" behavior.
- Enable transparent header for pages with hero banners (header overlays the hero).
- Toggle search icon and account icon visibility.
- Adjust header padding (compact, standard, spacious).

#### Footer
- Toggle social media icons, newsletter signup, and payment icons.
- Customize newsletter heading and subtext.
- Choose light or dark color scheme.
- Write custom copyright text (supports Liquid variables like `{{ shop.name }}` and `{{ 'now' | date: '%Y' }}`).
- Show/hide language and currency selectors.

#### Product Page
- **Image zoom**: Enable/disable, choose between lightbox and hover zoom.
- **Gallery layout**: Stacked, thumbnail carousel, or grid.
- **Variant display**: Buttons, color swatches, or dropdowns.
- **Size guide**: Enable and link to a Shopify page with frame measurements.
- **Optional details**: SKU, barcode, vendor, inventory status, share buttons, trust badges.
- **Form position**: Right, left, or bottom (desktop layout).
- **Sticky add-to-cart**: Persistent ATC bar when scrolling past the product form.

#### Cart
- **Cart type**: Slide-out drawer or dedicated page.
- **Order notes**: Allow customers to add special instructions.
- **Free shipping threshold**: Set an amount in cents (e.g., `10000` = $100.00) to display a progress bar. Set to `0` to disable.

#### Social Media
Add full URLs to your social profiles. The theme renders matching SVG icons automatically. Supported: Instagram, Facebook, Pinterest, TikTok, YouTube, X (Twitter), Snapchat, Vimeo.

#### Favicon & Social Sharing
Upload a favicon (32×32px minimum) and a social sharing image (1200×630px recommended). The social sharing image appears when your store URL is shared on platforms like Facebook, Twitter, and LinkedIn.

#### Custom CSS
Add custom CSS that will be applied site-wide. Useful for fine-tuning without editing theme code.

### Sections (add to any page)

#### Announcement Bar
Add to the very top of your store. Create multiple messages that auto-rotate. Each message can have its own link. Choose color scheme (dark, light, gold) and toggle the dismiss button.

**Pro tip:** Use the announcement bar for free shipping thresholds, sale countdowns, or new collection launches.

#### Hero Banner (homepage)
The hero section is a carousel. Add slides, each with:
- Desktop and mobile background images
- Heading, subheading, button text and link
- Text alignment (left, center, right) and vertical alignment
- Overlay color and opacity for text readability

**Settings:** Section height (small through fullscreen), autoplay toggle, slide interval, transition style (crossfade or slide).

**Eyewear tip:** Use large, high-contrast hero images showing models wearing your sunglasses. Keep overlays subtle — let the product imagery dominate.

#### Featured Collection
Display products from a specific collection in a grid.
- Choose the collection, number of products, and desktop columns.
- Enable "second image on hover" for a quick alternate view.
- Show/hide the "View all" button.

**Eyewear tip:** Create a "New Arrivals" or "Best Sellers" collection and feature it on the homepage. The hover secondary image is perfect for showing sunglasses worn vs. folded.

#### Image with Text
A split layout — image on one side, text on the other.
- Multiple image aspect ratios: landscape (3:2), square (1:1), portrait (4:5), tall portrait (2:3).
- Content alignment: top, middle, or bottom.
- Background option: none, secondary, or dark.

**Eyewear tip:** Use this for brand story sections — pair a founder photo or workshop image with brand philosophy text.

#### Testimonials
A grid of testimonial quotes with author names and titles.
- Choose 2, 3, or 4 columns.
- Each testimonial block has a quote, author name, and author title.

**Eyewear tip:** Pull quotes from real customer reviews. Keep them brief (1-2 sentences) for maximum impact.

#### Newsletter
Email signup section with heading, subheading, and customizable button/placeholder text.
- Color schemes: light, dark, or gold accent.

---

## Color Scheme Recommendations for Sunglasses Brands

Solaire's default palette is designed to work beautifully for eyewear brands, but every brand has its own identity. Here are suggested starting palettes:

### Classic Luxury (default)
| Role | Hex | Usage |
|------|-----|-------|
| Primary background | `#faf8f5` | Page background |
| Secondary background | `#f3f0eb` | Alternating sections |
| Primary text | `#1a1a1a` | Headings, body copy |
| Accent | `#c9a96e` | Buttons, links, highlights |
| Dark background | `#1a1a1a` | Footer, dark sections |

### Bold & Modern
| Role | Hex | Usage |
|------|-----|-------|
| Primary background | `#ffffff` | Clean, high-contrast base |
| Secondary background | `#f5f5f5` | Subtle section alternation |
| Primary text | `#111111` | Crisp black text |
| Accent | `#e63946` | Bold red for CTAs |
| Dark background | `#111111` | Footer and mood sections |

### Coastal / Beach Brand
| Role | Hex | Usage |
|------|-----|-------|
| Primary background | `#fefefe` | Bright, airy feel |
| Secondary background | `#e8f4f8` | Soft blue tint |
| Primary text | `#2c3e50` | Dark blue-gray |
| Accent | `#00b4d8` | Vibrant ocean blue |
| Dark background | `#023e8a` | Deep navy footer |

### Minimal / Architectural
| Role | Hex | Usage |
|------|-----|-------|
| Primary background | `#fafaf9` | Warm off-white |
| Secondary background | `#f0efed` | Subtle contrast |
| Primary text | `#0f0f0f` | Near-black |
| Accent | `#b8934f` | Muted gold |
| Dark background | `#171717` | Rich dark sections |

All palettes can be configured in **Theme Settings → Colors**.

---

## Image Size Recommendations

For optimal performance and visual quality, use the following image dimensions:

| Use | Dimensions | Aspect Ratio | Notes |
|-----|-----------|-------------|-------|
| Hero banner (desktop) | 2880×1400px | ~2:1 | Keep subject centered — text overlays may cover edges |
| Hero banner (mobile) | 750×1100px | ~2:3 | Portrait crop preferred for mobile |
| Product images | 2000×2000px | 1:1 | Square, high-res. Shopify serves responsive sizes. |
| Product hover (secondary) | 2000×2000px | 1:1 | Alternate angle or on-model shot |
| Image with Text | 1500×1800px | 5:6 | Works across all ratio options |
| Logo | 500×150px | ~3:1 | Upload as SVG for best results |
| Favicon | 32×32px | 1:1 | PNG or ICO |
| Social sharing | 1200×630px | 1.91:1 | Standard Open Graph size |

**General guidelines:**
- Always upload images at **2× the intended display size** for retina screens.
- Use **WebP or JPEG** for photography, **PNG or SVG** for logos and icons.
- Keep file sizes under 500KB per image for fast loading.
- The theme uses Shopify's `image_url` filter for automatic responsive sizing — you don't need to create multiple crops.

---

## FAQ

### Does this theme work with dropshipping apps?
Yes. Solaire is a standard Shopify Online Store 2.0 theme and is compatible with all Shopify apps, including Oberlo, DSers, Spocket, and others.

### Can I change fonts?
Yes. The theme includes five serif heading options and four sans-serif body options in the Theme Settings. For custom fonts beyond these, you can add `@font-face` declarations in the Custom CSS field under Theme Settings.

### Does the theme support RTL languages?
The theme uses logical CSS properties where possible. Full RTL support is planned for a future update. For now, the Custom CSS field can be used to add RTL overrides.

### How do I set up the free shipping progress bar?
Go to **Theme Settings → Cart** and set the "Free shipping threshold" value in cents. For example, `5000` = $50.00. The cart drawer will automatically display a progress bar and message.

### Can I use this theme for non-eyewear stores?
Absolutely. While Solaire is optimized for eyewear (large imagery, color swatches for frame/lens variants, size guide for measurements), its design system is versatile enough for any fashion, accessories, or luxury goods brand.

### How do I create a size guide page?
1. In Shopify Admin, go to **Online Store → Pages → Add page**.
2. Create a page with your frame measurements (use a table for lens width, bridge width, temple length, frame width).
3. In **Theme Settings → Product Page**, enable "Show size guide" and select your page from the dropdown.

### How do I get support?
See the [Support](#support) section below.

---

## Support

For theme support, please contact:

- **Email:** support@solairethemes.com
- **Documentation:** https://solairethemes.com/docs
- **Theme Store listing:** Visit our Shopify Theme Store page for updates and announcements.

When contacting support, please include:
- Your store's myshopify.com URL
- A description of the issue
- Screenshots or screen recordings if applicable
- Steps to reproduce the problem

---

## Changelog

### v1.0.0 — Initial Release
- 🎉 First public release
- ✨ Hero banner carousel with crossfade/slide transitions
- ✨ Featured collection grid with hover secondary images
- ✨ Image with Text split section (multiple ratios)
- ✨ Testimonials section
- ✨ Newsletter signup section
- ✨ Announcement bar with multi-message rotation
- ✨ Full-featured header (sticky, transparent, search overlay)
- ✨ Slide-out cart drawer with free shipping progress bar
- ✨ Product page with image zoom (lightbox + hover), color swatches, size guide
- ✨ Search page with suggestions
- ✨ Custom 404 page
- ✨ Multi-column footer with social icons, newsletter, payment icons, language/currency selectors
- ✨ 17 color settings for complete brand control
- ✨ 5 serif heading fonts + 4 sans-serif body fonts
- ✨ WCAG AA accessibility (skip-to-content, ARIA, focus management, 44px touch targets)
- ✨ Performance-optimized (font preloading, lazy images, deferred JS)
- ✨ Mobile-first responsive design
- ✨ Sticky add-to-cart on product pages
- ✨ Back-to-top button
- ✨ Custom CSS field for advanced customization
- ✨ Social sharing image support
- ✨ Full Online Store 2.0 JSON template architecture

---

## License

Copyright © Solaire Themes. All rights reserved.  
This theme is proprietary software. Redistribution and resale are prohibited.
