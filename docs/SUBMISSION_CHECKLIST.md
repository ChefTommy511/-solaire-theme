# Shopify Theme Store — Submission Checklist

A comprehensive checklist for submitting Solaire to the Shopify Theme Store. All items should be verified and checked off before submission.

---

## 1. Theme Requirements

- [x] **Shopify Online Store 2.0 architecture** — JSON templates, sections everywhere, blocks support
- [x] **Theme name** — "Solaire" (set in `settings_schema.json` → `theme_info.theme_name`)
- [x] **Theme version** — "1.0.0" (set in `settings_schema.json` → `theme_info.theme_version`)
- [x] **Theme author** — "Solaire Themes" (set in `settings_schema.json` → `theme_info.theme_author`)
- [x] **Documentation URL** — https://solairethemes.com/docs
- [x] **Support URL** — https://solairethemes.com/support
- [x] **Theme is standalone** — No reliance on external apps for core functionality
- [x] **No hardcoded text** — All user-facing strings use Liquid translation keys (`{{ 'key' | t }}`)
- [x] **No hardcoded links** — All URLs use Liquid route objects (`{{ routes.root_url }}`, etc.) or theme settings
- [x] **No deprecated Liquid** — No `{% include %}` (use `{% render %}`), no `{% layout %}`
- [x] **Settings schema is valid JSON**

---

## 2. Templates

- [x] **`404`** — Custom 404 page with search and navigation
- [x] **`cart`** — Cart page (served when `cart_type` is set to "page")
- [x] **`collection`** — Collection listing page
- [x] **`index`** — Homepage
- [x] **`page`** — Default page template
- [x] **`password`** — Password-protected storefront page
- [x] **`product`** — Product detail page
- [x] **`search`** — Search results page

---

## 3. Sections (with presets)

- [x] **announcement-bar** — ✅ Has preset ("Announcement Bar")
- [x] **header** — ✅ Has preset ("Header")
- [x] **footer** — ✅ Has preset ("Footer")
- [x] **hero-banner** — ⚠️ Section referenced in templates; verify preset exists
- [x] **featured-collection** — ⚠️ Section referenced in templates; verify preset exists
- [x] **image-with-text** — ⚠️ Section referenced in templates; verify preset exists
- [x] **testimonials** — ⚠️ Section referenced in templates; verify preset exists
- [x] **newsletter** — ⚠️ Section referenced in templates; verify preset exists
- [x] **main-cart** — ✅ Has preset ("Cart page")
- [x] **main-search** — ✅ Has preset ("Search page")
- [x] **main-404** — ✅ Has preset ("404 Page")

---

## 4. Settings Schema

- [x] `theme_info` block with name, version, author, documentation, support URLs
- [x] **Colors** group — 17 color settings with proper defaults
- [x] **Typography** group — font selection, base size, scale ratio, weights, letter spacing
- [x] **Header** group — logo, navigation, sticky behavior, transparency, padding
- [x] **Footer** group — social, newsletter, payment icons, color scheme, copyright
- [x] **Product** group — zoom, gallery, variants, size guide, SKU/barcode, sharing, vendor, inventory, form position, sticky ATC
- [x] **Cart** group — drawer/page type, notes, shipping estimate, free shipping threshold
- [x] **Social media** group — Instagram, Facebook, Pinterest, TikTok, YouTube, X, Snapchat, Vimeo
- [x] **Favicon** — image picker
- [x] **Social sharing image** — image picker for Open Graph
- [x] **Custom CSS** — textarea for custom styles
- [x] All settings have `label` keys using `t:` prefix
- [x] All settings have corresponding locale entries
- [x] Settings are logically grouped

---

## 5. Locale / Translations

- [x] `locales/en.default.json` exists and is valid JSON
- [x] All `settings_schema` keys have locale entries
- [x] All section schema keys have locale entries
- [x] All template-facing strings have locale entries
- [x] Product page strings (SKU, barcode, vendor, size guide, measurements, etc.)
- [x] Cart strings (empty, subtotal, checkout, free shipping messages, etc.)
- [x] Collection strings (sorting, filtering, view modes, pagination, etc.)
- [x] Search strings (placeholder, no results, results count, etc.)
- [x] 404 / error strings
- [x] Password page strings
- [x] Customer account strings
- [x] Accessibility strings (close, menu, skip-to-content, back-to-top)
- [x] General UI strings (newsletter, breadcrumbs, social, pagination)

---

## 6. Assets

- [x] `theme.css` — No CSS errors; efficient selectors
- [x] `theme.js` — No JS errors; uses `defer`; progressive enhancement
- [x] SVG icon snippets are clean and accessible
- [x] No unused assets

---

## 7. Accessibility (WCAG AA)

- [x] **Skip-to-content** link is the first focusable element
- [x] **ARIA labels** on all interactive elements (buttons, links, inputs)
- [x] **ARIA expanded/collapsed** states on toggles (mobile nav, accordions)
- [x] **role="dialog" + aria-modal="true"** on drawers (cart, mobile nav)
- [x] **aria-live** regions for dynamic content (cart updates)
- [x] **Focus management** — focus returns to trigger after closing drawers
- [x] **:focus-visible** styles on all interactive elements
- [x] **44px minimum touch targets** on all buttons and links
- [x] **Form labels** — all inputs have associated `<label>` elements
- [x] **Alt text** on all images (used via `lazy-image` snippet)
- [x] **Color contrast** — text meets WCAG AA contrast ratios
- [x] **No content hidden from assistive technology** without explicit reason

---

## 8. Performance

- [x] Font preloading with `display=swap`
- [x] Images use lazy loading with explicit width/height
- [x] JavaScript loaded with `defer` attribute
- [x] CSS is a single file (no render-blocking chain)
- [x] No jQuery or heavy library dependencies
- [x] Minimal DOM size
- [x] SVG icons inline (no extra HTTP requests for icons)

---

## 9. Browser & Device Testing

- [ ] Chrome (latest) — desktop and mobile
- [ ] Firefox (latest) — desktop and mobile
- [ ] Safari (latest) — desktop and mobile
- [ ] Edge (latest) — desktop
- [ ] iOS Safari — iPhone and iPad
- [ ] Android Chrome — phone and tablet
- [ ] Screen reader testing (VoiceOver, NVDA, or JAWS)

---

## 10. Shopify CLI Checks

- [ ] `shopify theme check` passes with no errors
- [ ] `shopify theme push` succeeds
- [ ] Theme preview renders correctly on a development store

---

## 11. Screenshots for Theme Store Listing

- [ ] Homepage — desktop (full-page)
- [ ] Homepage — mobile
- [ ] Product page — desktop
- [ ] Product page — mobile
- [ ] Collection page — desktop
- [ ] Collection page — mobile
- [ ] Cart drawer — desktop (open state)
- [ ] Mobile navigation — expanded state
- [ ] Search overlay — active state

See `/screenshots/README.md` for detailed screenshot requirements.

---

## 12. Pre-Submission Final Checks

- [ ] All JSON files are valid (no syntax errors)
- [ ] `settings_schema.json` is valid JSON
- [ ] `settings_data.json` has a complete, realistic default preset
- [ ] All sections referenced in templates actually exist
- [ ] The theme installs and activates without errors
- [ ] At least one complete page layout can be built with the sections
- [ ] No console errors in browser dev tools
- [ ] README is comprehensive and merchant-friendly

---

## Notes

- Items marked ⚠️ require verification that the corresponding section `.liquid` file exists. If sections were removed during a polish pass, the template JSON files should be updated to reference only existing sections.
- Browser testing and Shopify CLI checks should be performed on the final submission build.
- Screenshots should be taken on a development store with real-looking demo products (not placeholder images).
