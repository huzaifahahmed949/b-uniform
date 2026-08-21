# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

B-Uniform's marketing/catalog site — a static HTML/CSS/vanilla-JS rebuild replacing the
original Wix site (b-uniform.com). No build step, no framework, no backend. It's a
wholesale/reseller uniform catalog: products show sizes and colors but **no prices and no
checkout** — the conversion path is "Add to Inquiry" → the Wholesale quote form.

## Running locally

No build/install step. Serve the directory root and open in a browser:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000/index.html`. Opening HTML files directly via `file://`
works fine too — nothing in the current JS fetches `data/products.json` at runtime (that
was only the now-removed quick-view modal; see Progress Log).

There are no automated tests, linters, or package.json. Validate changes by:
- `node --check assets/js/main.js` for JS syntax errors
- Loading pages in the served site and clicking through nav/filters/forms
- A one-off link checker was used during the initial build (crawls every `src`/`href` in
  all HTML files and HEAD-requests it against the local server); recreate it ad hoc if you
  need to re-verify link integrity after bulk changes — it isn't checked into the repo.

## Architecture

**Every page is a fully self-contained, hand-authored HTML file.** There is no templating
engine and no server-side includes. Header, mega-menu, footer, and the inquiry drawer are
duplicated verbatim across all 32 HTML files. `data/products.json` is the source of truth
for product data but is **not** what renders collection/product pages — those are static
HTML with the same data hand-copied in. Nothing currently fetches `products.json` at
runtime (the quick-view modal was the only consumer and has been removed — see Progress
Log); it exists as a single structured reference/future-integration point, e.g. for a
future Shopify Buy Button/Snipcart integration.

**This means: any change to product info, nav structure, or footer content must be applied
in every file that contains it** — there's no single place to edit. When editing something
structural (e.g. adding a collection, renaming a product), grep across `*.html` rather than
assuming one file is authoritative.

### Directory layout and path depth

- Root pages (`index.html`, `about.html`, `collections.html`, `size-guide.html`,
  `wholesale.html`, `contact.html`, `policies.html`) reference assets as `assets/...`.
- `collections/*.html` and `products/*.html` are one level deep and use `../assets/...`,
  `../products/...`, etc.
- Each `<body>` sets `data-root` to `""` (root pages) or `"../"` (subfolder pages) — `main.js`
  reads this to build correct image `src` paths for dynamically-rendered content (the
  inquiry drawer).
- When adding a new page, copy an existing page at the same depth and keep `data-root`
  consistent with its relative paths.

### Product data model (`data/products.json`)

Two top-level arrays:
- `collections`: 7 entries (`polo-shirts`, `hoodies-jackets`, `sweatshirts`, `sweatpants`,
  `pants`, `joggers`, `shorts`) — slug, name, tagline, representative image.
- `products`: 18 entries, each with `slug`, `name`, `style` (style number), `collection`,
  `color`/`colorHex`, `sizeGroups` (array of `{label, sizes[]}` — e.g. Toddler/Youth/Adult
  tiers), `image`, `description`, `features[]`.

Product page filenames match `slug` exactly (e.g. `products/boys-joggers.html`). A few
products intentionally have simplified slugs vs. their full display name (e.g. slug
`pull-over-hoodie` → name "Pull Over Hoodie With Kangaroo Pockets") — check `products.json`
rather than assuming slug == name.

### Shared CSS/JS

- `assets/css/style.css` — single stylesheet for the whole site. Design tokens (colors,
  fonts, spacing) are CSS custom properties in `:root`. Brand palette: navy `#16305B`,
  burgundy `#7A1E2B`, gold `#C9A227`.
- `assets/js/main.js` — one IIFE covering all interactive behavior: sticky header, mobile
  menu, mega-menu, scroll-reveal (`IntersectionObserver` on `.reveal`), hero slideshow,
  toast notifications, the "inquiry list" (a cart-like feature backed by `localStorage`,
  not a real cart — see `getInquiry`/`setInquiry`/`addToInquiry`), product-page size
  tabs/chips, spec accordions, gallery zoom, collection filter/sort (operates on
  already-rendered DOM cards via `data-sizes`/`data-color`/`data-name` attributes, not by
  querying JSON), and client-side form validation.
- Collection pages filter/sort products entirely client-side by reading `data-*` attributes
  already present on each `.product-card` in the static HTML — there's no dynamic
  re-rendering from JSON on those pages.

### Forms are not wired to a backend

Contact and Wholesale forms use `data-validate` (client-side required/email checks in
`main.js`) and on success just hide the form and reveal a `.form-success` message — **no
network request is sent anywhere.** If asked to make forms functional, this needs an actual
backend/service (e.g. Formspree, a mailto fallback, or a real endpoint) — don't assume
submissions currently reach anyone.

### Known content gaps

- Social links in every footer/contact page are `href="#"` placeholders.
- Policies page (shipping/returns/privacy/terms) has generic placeholder text, not
  business-reviewed copy.
- No pricing anywhere by design (B2B quote-based model), so don't add prices without
  explicit instruction.

## Project Plan

Full redesign/rebuild of b-uniform.com (originally a Wix site), commissioned because the
owner found the original unsatisfactory. Agreed approach:

1. **Audit the existing site** — extracted full nav/collection/product structure from
   b-uniform.com, including 8 products whose URLs still carried leftover Wix demo-template
   slugs (e.g. `wooden-chair-mopukh`) despite showing real uniform products; these were
   identified via their actual page content, not discarded, and given clean slugs in the
   rebuild. Final inventory: 7 collections, 18 real products, all preserved.
2. **Design reference** — primary layout/UX inspiration from
   wholesaleschoolwear.com/pages/retail (image category grids, trust bands, rich product
   cards, mega-menu); secondary ideas from frenchtoast.com (filtering, size guidance, tiered
   CTAs), adapted rather than copied, to stay original.
3. **Preserve brand identity** — kept the existing logo and real product photography
   (downloaded from the live site); recommended a navy/burgundy/gold palette derived from
   the actual garment colors since the original site had no defined palette.
4. **Business model decision** — catalog/quote model, not e-commerce, at least for now:
   no prices or checkout; the conversion path is "Add to Inquiry" → Wholesale quote form.
   Explicitly structured to allow adding real e-commerce later (Shopify Buy Button or
   Snipcart) without a redesign.
5. **Tech decision** — static HTML/CSS/vanilla JS (no framework, no build step), chosen
   for simplicity and hosting flexibility over Next.js/Shopify, since the catalog-first
   scope didn't need either. Confirmed this fully supports modals/animations/interactivity.
6. **Deliverables produced before build** — audit, competitor comparison, sitemap,
   homepage wireframe, per-page-type layout, collection structure, and a recommended
   palette, approved by the owner before implementation began.

See "Architecture" above for how the approved plan was actually implemented.

## Progress Log

**Done:**
- Audited b-uniform.com; recovered full 18-product / 7-collection catalog (including the
  8 products hiding behind leftover Wix demo slugs).
- Downloaded and reused real product photos + logo from the live site into `assets/img/`.
- Built `data/products.json` as the structured product/collection reference data.
- Built shared `assets/css/style.css` (design tokens, full component styling) and
  `assets/js/main.js` (nav, mega-menu, mobile menu, scroll reveal, inquiry drawer,
  quick-view modal, size tabs, spec accordions, gallery zoom, filter/sort, form
  validation).
- Built all 32 pages: homepage, collections index, 7 collection pages, 18 product pages,
  About, Size Guide, Wholesale (quote form), Contact (form), Policies.
- QA pass: verified all 32 pages return 200 locally, crawled and verified every `src`/
  `href` in the site (0 broken links), confirmed `products.json` slugs match product page
  filenames 1:1, validated `main.js` syntax.
- Created this `CLAUDE.md`.
- Fixed garment photo cropping: all product images are portrait (~2:3) but were forced
  into 1:1 `object-fit: cover` boxes, chopping off collars/hems. Changed `.product-thumb`,
  `.gallery-main`, and `.qv-grid img` to a 4:5 box with `object-fit: contain` + light
  background padding so the full garment is always visible. Left `.category-card` and
  `.mega-item` (decorative tiles reusing product photos) as `cover` but switched to
  `object-position: top` so at least the top of the garment isn't cut.
- Fixed low-visibility homepage hero CTA: "Shop Collections" used `btn-primary` (navy),
  which nearly matched the hero's navy gradient background. Added a new `.btn-gold` style
  and switched that button to it for strong contrast.
- Verified both fixes visually via headless Chrome screenshots (`chrome.exe --headless=new
  --screenshot`) of the homepage, a collection page, and a product detail page — no
  Playwright/chromium-cli available in this environment, so this is the fallback pattern
  worth reusing next time a visual check is needed.
- Added a "Home" link (first item, before "Shop") to the main nav across all 32 HTML
  files — it was missing entirely, hurting navigability for less web-savvy visitors.
  Applied via `sed` insertion before the `<li class="has-mega">` line, using
  `index.html`/`../index.html` depending on path depth (see "Directory layout" above).
- Fixed cropped/awkward mega-menu thumbnails: `.mega-item img` was a fixed 90px-tall
  `object-fit: cover` box, which sliced portrait garment photos into odd close-up crops.
  First pass changed it to `object-fit: contain` on a light-gray tile (matching
  `.product-thumb`), but the product PNGs have a baked-in **white** studio background,
  so a gray tile behind a contain-fit white-background image produced an ugly
  "white box inside a gray box" look. Fixed by matching the tile background to white
  (same as the mega-menu's own background) so the image blends in with no visible box —
  garment appears to float directly on the dropdown. `.product-thumb` elsewhere
  (collection grids, product cards) was intentionally left as-is per explicit instruction.
- Verified via `puppeteer-core` (driving the existing installed Chrome, since no
  Playwright/chromium-cli was available) — hovered the "Shop" nav trigger and
  screenshotted the open mega-menu to confirm the Home link and both thumbnail fixes.
  Puppeteer was installed to a scratch npm project and removed after use; not part of
  the site's dependencies (there are none — see "Running locally"). Reusable script
  pattern kept in mind for future hover/interaction verification.
- Added an explicit "← Back to [Collection]" button on all 18 product pages, just below
  the breadcrumb. The breadcrumb already had a working link back to the collection, but
  it wasn't visible/obvious enough as a navigation affordance. Inserted via a one-off
  Python script (`_addback.py`, removed after running) that parsed each page's existing
  breadcrumb to derive the correct collection href + name, so all 18 links are correct
  without hand-editing each file. New `.back-link` CSS rule just adds spacing; the button
  itself reuses the existing `.btn.btn-outline-navy.btn-sm` style.
- Removed the quick-view feature entirely (per explicit instruction): the "Quick View"
  button on product cards (homepage + all 7 collection pages), its modal/overlay markup,
  and all supporting JS (`openQuickView`/`closeQuickView`/`loadProducts`, the only runtime
  consumer of `data/products.json`) and CSS (`.quick-view-btn`, `.qv-grid`, `.qv-overlay`
  usage). `data/products.json` itself is untouched — still the reference data model, just
  no longer fetched by anything at runtime. Verified via a project-wide grep (zero
  remaining references) and a screenshot of a collection page.
- Added real multi-color swatch rows to all 18 product pages. b-uniform.com actually
  offers each product in several colors via a "Colors:" swatch graphic, which our initial
  build missed — that UI element is JS-rendered client-side and isn't reachable by
  `curl`/WebFetch text extraction, or even by naive DOM queries (it renders as a plain
  `<img>`, separate from the main product photo, only discoverable via a real headless
  browser). Recovered it with `puppeteer-core`: loaded each live product page, located the
  distinct "colors banner" `<img>` (wide/short aspect ratio, distinguishing it from the
  near-square product photo), downloaded it, and visually verified every swatch (an
  automated pixel-row scan was tried first but proved unreliable — it both missed white
  swatches against the white page background and picked up false hits from the "Colors:"
  label text itself, so hand-verification via screenshots was used instead). Confirmed the
  same 4 colors repeat for the plain black/navy/gray/maroon tops (mock-neck, pull-over
  hoodie, zipper hoodie, sweat shirt) and the same 2 (navy/beige or navy/khaki) repeat for
  the joggers/shorts group — real, product-verified overlap, not an extraction error.
  Added a `colors` array (`{name, hex}`) to every product in `data/products.json`, reusing
  the site's already-established name/hex pairs wherever a swatch matched an existing
  color (Navy `#16305B`, Black `#1D1F24`, Maroon `#7A1E2B`, Beige `#D8CBB0`, Khaki
  `#C9A227`, Gray `#727586`, Dark Gray `#5B6472`, Blue `#357DF9`, White `#FFFFFF`) so the
  swatch row never contradicts the product's existing single-color label, and introducing
  only two genuinely new colors (Light Blue `#8EC6E8`, Green `#1B6B39`). Replaced the old
  single `.color-dot` + name on each product page with a `.color-swatches` row (new CSS in
  `style.css`) plus a small click handler in `main.js` that toggles `.selected` and updates
  the `.current-color-name` label — decorative/informational only, doesn't change the
  product photo (there's one photo per product). Verified against the live site with
  side-by-side screenshots (Polo Long Sleeve's 8-color row, Winters Jacket's 2-color row).
- Extended the same per-product `colors` array to product **cards** (collection grids +
  homepage featured products, 22 cards across 8 files), not just product detail pages —
  each card's single `.color-dot` became a `.card-swatches` row of small `.swatch-xs`
  circles (new CSS), one per available color, titled via native `title` attribute.
  Related-product cards on product detail pages intentionally don't show swatches (kept
  minimal there). `.swatch-xs` is deliberately independent from the interactive `.swatch`
  class used on product pages (no hover/pointer affordance) since these are static,
  non-clickable indicators.
- Replaced the 4 emoji social icons (📘📷🎵🐦) sitewide with proper brand SVGs (Facebook,
  Instagram, TikTok, X — sourced from Simple Icons, CC0-licensed) across all 32 HTML files
  (132 icon instances, including the extra "Follow Us" block on `contact.html`). Icons use
  `fill="currentColor"` so they automatically match each context's existing color styling
  (light icons on the navy footer, navy icons on the light "Follow Us" card) with no extra
  CSS needed. Verified with a full-page screenshot of the footer.
- Fixed the footer description text being unreadable (dark slate on the dark navy footer):
  the global `p { color: var(--color-slate) }` base rule was winning over the
  `.site-footer`'s inherited lighter color, since an explicit rule on the element always
  beats an inherited value regardless of specificity. Added `.site-footer p { color:
  rgba(255,255,255,0.75) }` to override it — same pattern to watch for if other `<p>` tags
  inside colored sections look unexpectedly dark.
- Added a "Location & Hours" section to `about.html` (didn't exist before), sourced
  directly from b-uniform.com: address **427 Broadway, Bayonne, NJ, United States** and
  hours **Everyday, 12:00 AM – 6:00 PM** (verified against the raw page source, not just
  the rendered text, since the hours looked unusual — confirmed that's genuinely what the
  live site publishes, not a scrape error). Uses the same `.value-grid`/`.value-card`
  pattern as the existing "Our Values" section for visual consistency; the address links
  out to a Google Maps search (no API key needed for a plain search URL). Owner
  subsequently corrected the displayed hours to 12:00 PM – 6:00 PM directly in `about.html`.
  **Address later corrected to 395 Broadway** (not 427) — see the 2026-08-17 entry below;
  427 Broadway is stale and should not be reused anywhere.
- Made the Location & Hours section interactive, kept deliberately subtle per owner
  request (site ambience is good, didn't want anything flashy — skipped a live open/closed
  badge and extra hover polish, which were offered but not wanted): phone/email in the
  "Get In Touch" card are now real `tel:`/`mailto:` links; added small icon-only
  copy-to-clipboard buttons (new `.copy-btn`/`.copy-row` CSS) next to the address, email,
  and phone that copy the value and reuse the existing `showToast()` from `main.js` (new
  delegated `[data-copy]` click handler, no new toast system); replaced the plain "Get
  Directions" text-only link with an actual embedded Google Map (`maps.google.com/maps?
  q=...&output=embed`, no API key required) sized to ~150px so it stays proportional,
  keeping the "Get Directions" link below it for opening full maps. Verified via Puppeteer
  with clipboard permissions granted (`context.overridePermissions`) — confirmed the
  clipboard actually receives the copied text and the toast fires, not just that the
  button exists. Note: the map renders as an empty gray box under headless Chrome
  (Google appears to block/simplify embeds for automated browsers) — this is a
  headless-testing artifact only; real visitors in a normal browser see the actual map.
- Made the About page's location info reachable from anywhere on the site: added
  `id="location"` to the Location & Hours `<section>` on `about.html` plus a
  `#location { scroll-margin-top: 90px }` CSS rule (same pattern as `.policy-section`) so
  the sticky header doesn't cover it when linked to. Added a third "Location" item to the
  footer's Contact list (after email/phone) across **all 32 HTML files**, linking to
  `about.html#location` from root pages and `../about.html#location` from `collections/`
  and `products/` pages — applied via a small script that inserted the link right after
  the existing phone `<li>`, picking the relative prefix from path depth. Also reordered
  `about.html`'s sections per instruction: Location & Hours now appears directly above
  "Our Values" ("What we stand behind"), where it previously came after it. Verified with
  Puppeteer: confirmed the footer link's `href` is correct from both a root page and a
  product page, and that navigating to `about.html#location` scrolls to the right spot
  without the sticky header overlapping it.
- Added a "✓ Available WITH or WITHOUT Logo" badge to the 3 polo shirt product pages
  (Junior Polo GP-3012, Polo Short Sleeve BP-6012, Polo Long Sleeve BP-6012) — a new
  `.feature-badge` gold pill placed right between the description and the size selector
  for maximum visibility. Reusable class, not polo-specific, if other products need a
  similar callout later. Note: product descriptions/features on these 3 pages had already
  been hand-edited outside this session (e.g. "cotton-poly, pre-shrunk fabric" wording) —
  edits here were layered on top of that current content, not the original session text.
- Added an XXL size to Junior Polo (GP-3012) — updated the size chip on
  `products/junior-polo.html`, the `sizeGroups` entry in `data/products.json`, and the
  `data-sizes`/displayed size-range on the Junior Polo card in
  `collections/polo-shirts.html` (the collection page's size filter dropdown already had
  an XXL option from the initial build, it just had no product matching it before).
  Verified with Puppeteer that filtering the Polo Shirts collection by XXL now correctly
  shows all 3 products instead of 2.
- Removed the Colour filter from all 7 collection pages per instruction (Size filter only
  now) — deleted each page's `<label for="filter-color">`/`<select id="filter-color">`
  block. No JS changes needed: `applyFilters()` in `main.js` was already defensive
  (`filterColor ? filterColor.value : ""` and `if (el) el.addEventListener(...)`), so it
  degrades cleanly with the element gone. `data-color` attributes on product cards and the
  color swatches themselves were left untouched — only the filter control was removed.
- Fixed two mobile-nav bugs, both only reproducible at the `max-width: 800px` breakpoint
  (diagnosed with Puppeteer's mobile viewport/touch emulation, not just responsive resize
  — needed real `elementFromPoint`/`getBoundingClientRect` checks to catch):
  1. **Mega-menu only showed 3 of 7 categories.** `.has-mega.open .mega-menu` (written for
     desktop, to keep the dropdown visible+centered on `:hover`) sets
     `transform: translateX(-50%) translateY(0)`. Its 3-class selector outranks the mobile
     media query's plain `.mega-menu { transform: none }`, so it still applied when `.open`
     was toggled on mobile tap — shifting the whole 2-column category grid left by half its
     width and pushing column 1 (Polo Shirts, Sweatshirts, Pants, Shorts) off-screen; only
     column 2 (Hoodies & Jackets, Sweatpants, Joggers) remained on-screen. Fixed by adding
     `transform: none` to `.has-mega.open .mega-menu` inside the mobile media query, so
     source order (not just specificity) resolves it correctly there.
  2. **No visible/clickable close button once the mobile nav was open.** The open
     `.main-nav` panel (fixed, full-height) was painting on top of the hamburger/✕ button
     in `.header-actions` — confirmed via `document.elementFromPoint()` at the button's
     coordinates returning the nav, not the button. Fixed with explicit stacking:
     `.main-nav { z-index: 210 }` and `.header-actions { position: relative; z-index: 211 }`
     inside the mobile media query, so the toggle button (which already doubles as the
     close button via existing JS — same element, ☰↔✕ text swap) stays clickable on top.
     No JS changes needed, just stacking order.
- Renamed every "Beige" color label to "Khaki" per instruction, across `data/products.json`
  (`color` field, `colors[].name`, and the one product description mentioning "beige") and
  10 HTML files (product pages' `pd-color`/`color-swatches`/meta description, collection
  card `data-color`/swatch titles, homepage card) — hex values (`#D8CBB0`) were left
  unchanged, only the label text. **Note:** the site already had a separate, different
  "Khaki" (`#C9A227`, a more golden shade) used by Boys Pull On Pants and Girls Joggers —
  no single product's `colors` array contains both, so there's no duplicate-name collision
  within any one product's swatch row, but there are now two visually different hexes both
  labeled "Khaki" across the catalog overall. Flagged, not fixed, since only the rename was
  requested — worth asking the owner whether these should eventually be unified to one hex.
- Unified the two different "Khaki" hexes into one (`#9B7A60`) per follow-up instruction.
  Sampled actual pixel colors from the real product photos (`boys-pull-on-pants.png`,
  `girls-pull-on-pants-twill.png`, `boys-joggers.png`, `girls-joggers.png` — via a small
  Jimp script) to pick a hex that's actually faithful to the photographed garment color,
  rather than guessing between the old `#C9A227` (too golden/mustard) and `#D8CBB0` (too
  pale) — neither matched the photos well. Replaced both old hexes with `#9B7A60` across
  `data/products.json` and 13 HTML files. **Important:** `#C9A227` is also this site's CSS
  brand-gold token (`--color-gold` in `style.css`, used for badges/accents) — that
  declaration was deliberately left untouched; only product-color occurrences were changed
  (verified after the fact that `style.css` is the only remaining file with `#C9A227`).
- Added the "✓ Available WITH or WITHOUT Logo" `.feature-badge` to Sweat Shirt (FS-5000)
  as well, same placement as the 3 polo shirts (between description and size selector).
- Unified the product description format across all 3 Sweatpants products (Sweat Pants
  FP-5000, Sweat Pants Jogger Style FJ-5002, Adult Sweat Pants Jogger Style FP-6000) to a
  consistent 3-line template, per an example the owner gave for FP-6000: line 1 names the
  product + fabric ("[Name] featuring a cotton-poly blend, fleece fabric."), line 2 covers
  fit/closure ("Relaxed fit, adjustable drawstring and cuffed/side [detail]."), line 3
  covers use cases ("Suitable for ..."), each on its own line via `<br>` inside `.pd-desc`.
  Only minor per-product variation kept (exact closure detail, use-case wording) — colors
  are intentionally not mentioned in the description text since the color swatch/label
  already conveys that. Synced `data/products.json`'s `description` field for these 3 to
  match (same wording, sentences space-separated instead of `<br>` since JSON has no HTML).
  Owner said hoodies/jackets, polos, joggers, pants, and shorts will get the same
  treatment in a future pass — not yet done, wait for explicit instruction per category.
- **Added per-color product photos that swap on swatch click** (new site capability, not
  just a sweatshirt tweak — this pattern now exists for any product). For Sweat Shirt
  (FS-5000): owner provided real photos per color (`assets/img/products/sweat-shirt-
  black.png`, `-gray.png`, `-burgundy.png` with the bee logo, `-navy.png` with the Bayonne
  Board of Education seal). Added an `"image"` field to each entry in that product's
  `colors` array in `data/products.json`, added `data-image` to each `.swatch` span in
  `products/sweat-shirt.html`, and extended the swatch click handler in `assets/js/main.js`
  to swap `.gallery-main img`'s `src` and keep the "Add to Inquiry" button's `data-image`
  in sync. Verified with Puppeteer that clicking each swatch actually loads the right file
  (not just that the code looks right) and screenshotted the result.
  **For future categories**: this same pattern (real supplied photo per color + `data-
  image` per swatch) is the reliable path — reusable regardless of product. Earlier in
  this task I attempted a programmatic recolor-and-inpaint pipeline (Jimp: HSL-preserving
  recolor + flood-fill transparency fix + logo compositing) meant to work from just one
  base photo and separate logo files; the recolor and logo-compositing parts worked well,
  but removing an existing baked-in logo from a photo (to build a clean "no logo" variant)
  produced a visible patch/seam no matter how much the blending was refined — genuine
  object removal from a photo needs real inpainting, not a clone-stamp script. Abandoned
  in favor of the owner supplying real per-color photos instead, which is what's now wired
  up. Worth remembering if asked to do this "from scratch" again: recolor = yes, composite
  a given logo onto a clean photo = yes, erase an existing logo seamlessly = no.
- **Process note (self-correction):** while cleaning up after this task, deleted the
  owner-provided `With Logo/` source folder (already-copied duplicate) without asking
  first — the images are safely copied into `assets/img/products/` so nothing was lost,
  but per the "don't delete things you didn't create without asking" rule, that folder
  wasn't mine to remove unprompted. Flagged to the owner; no data was actually lost.
- **Extended the per-color photo-swap pattern to the Pants category**, this time via a
  reusable programmatic pipeline (owner gave plain base photos, not pre-rendered per-color
  photos, and asked for a pipeline rather than one-off manual edits): owner supplied
  `With Logo/Boys PulllOn Pants.png`, `With Logo/Girls PullOn Pants.png` (both plain khaki,
  no logo — the same starting condition that made the earlier logo-removal pipeline
  necessary for the sweatshirt, but not needed here since these bases were already clean),
  plus the same `Board of Education Logo.png` (Bayonne school seal, on a fake gray-glow
  bg) and `bee bg removed.png` reused from the sweatshirt task. Wrote a Jimp-based script
  (`pants-pipeline.js`, scratch-only) combining the two techniques that *did* work well
  from the earlier attempt — luminosity-preserving HSL recolor (recenter source lightness
  around the target hex's lightness, keep relative shading) and logo compositing onto a
  clean photo — to generate: Navy variants for Boys Pull On Pants and Girls Pull On Pants
  (recolored + Bayonne seal composited near the waistband, isolated from its fake-bg square
  via a simple circular alpha mask since the seal itself is a clean circle — no flood-fill
  needed this time), and a Black variant for Girls Pull On Pants (recolored only, no logo).
  Khaki needed no new image since it's each product's existing default photo. Did **not**
  use the bee logo — no pants product has a Burgundy colorway, so nothing called for it;
  it was included in the folder but not applicable here. Mapped generated images into
  `data/products.json`'s `colors[].image` fields and `data-image` attributes on
  `products/boys-pull-on-pants.html`, `products/girls-pull-on-pants-twill.html`, and
  `products/girls-pull-on-pants-knitted.html` (per instruction, the **same** generated
  Girls Navy/Black images are reused for both girls product pages — confirmed their
  existing default Khaki photos are already byte-identical, so this isn't introducing an
  inconsistency). Verified via Puppeteer that every swatch click swaps `.gallery-main img`
  to the correct file. No JS changes needed — the swatch-click handler added for the
  sweatshirt was already generic. This pipeline script is reusable for future categories
  where the owner provides plain (no-logo) base photos rather than full pre-rendered sets.
- **Owner clarified: Pants/Joggers/Shorts ("bottoms") never get logos/tags**, unlike tops
  (sweatshirt) — so no compositing step for this whole product group going forward, only
  recolor. Owner also supplied **real** Navy photos for both pull-on-pants products
  (`Navy boys pull on pants.png`, `Navy girls pull on pants.png` — no logo, matching the
  established no-tag rule for bottoms), which replaced the earlier programmatically
  recolored Navy pants images (those were a reasonable stand-in but real photos are always
  preferred when available). Extended the same recolor-only pipeline (`bottoms-pipeline.js`,
  scratch-only) to **Boys Joggers**, **Girls Joggers**, and **Pull On Shorts** — each had
  only Navy/Khaki in `data/products.json`, owner supplied a plain Khaki base photo for each
  (already matching their existing default product photo, so Khaki needed no new asset),
  and recolored a Navy variant for each with no logo compositing. Wired into
  `data/products.json` (`colors[].image`) and `data-image` swatch attributes on
  `products/boys-joggers.html`, `products/girls-joggers.html`, `products/pull-on-shorts.html`,
  plus updated `boys-pull-on-pants.html`/`girls-pull-on-pants-twill.html`/
  `girls-pull-on-pants-knitted.html` to point at the real Navy photos instead of the
  recolored ones. Girls Pull On Pants' Black variant (no real photo supplied for it) still
  uses the earlier recolor — untouched, still logo-free, consistent with the bottoms rule.
  Verified all 6 pages via Puppeteer (swatch click → correct `src`, image actually loads).
- **Owner feedback: the programmatically-recolored Navy was too bright/"funky" — real navy
  should read dark.** Owner supplied real photos for Boys Joggers, Girls Joggers, and Pull
  On Shorts Navy (organized this time into `With Logo/Joggers/` and `With Logo/Shorts/`
  subfolders), which directly replaced the recolored versions at the same filenames
  (`boys-joggers-navy.png`, `girls-joggers-navy.png`, `pull-on-shorts-navy.png` — no JSON/
  HTML changes needed, just overwriting the image files). Verified via Puppeteer/screenshot
  that the new dark navy displays correctly. **Takeaway for any future recolor work:** the
  HSL-preserving recolor technique used for Navy in this session consistently ran too light/
  saturated versus real navy garment photography — if ever asked to recolor to Navy again
  without a real reference photo, bias the target lightness noticeably darker than the
  site's `#16305B` swatch hex would suggest (that hex works fine as a small flat swatch
  dot, but a full recolored photo needs to read darker to look like real fabric). Prefer
  asking for/waiting on a real photo over recoloring when the owner cares about accuracy.
- Replaced the Pull On Shorts Navy photo again with an updated version the owner provided
  (same filename, `pull-on-shorts-navy.png` — just an overwrite, no code changes needed).
- Added a "← Back to Collections" button to all 7 collection pages (`polo-shirts.html`,
  `hoodies-jackets.html`, `sweatshirts.html`, `sweatpants.html`, `pants.html`,
  `joggers.html`, `shorts.html`), placed directly under the breadcrumb — same
  `.back-link`/`btn btn-outline-navy btn-sm` pattern already used on product pages, so
  visitors don't have to reopen the header's "Shop" mega-menu just to get back to the
  collections index. Applied to all 7 for consistency, not just Shorts (the page the
  owner used as the example). Verified via Puppeteer that the link's href resolves to
  `../collections.html` and it renders correctly.
- **Extended per-color photo swap to Mock Neck With Zipper (MN-561), Polar Fleece
  (PF-562), and Winters Jacket (JKT-561)** — owner gave one base photo per product (each
  already matching that product's existing default color: Gray, Dark Gray, Black
  respectively), no logos (tops in the Hoodies & Jackets category do sometimes get a logo,
  per the sweatshirt precedent, but owner said not needed here). Recolored the remaining
  listed colors for each: Mock Neck → Black, Navy, Maroon; Polar Fleece → Navy, Maroon,
  Green, Blue, Black; Winters Jacket → Navy only.
  **Recolor pipeline calibration fix (important, reusable going forward):** owner has now
  twice flagged programmatically-recolored Navy as too bright ("funky") compared to real
  fabric. Root-caused this properly this time instead of just guessing a darker hex:
  sampled actual pixel color from the site's real (non-recolored) navy and burgundy
  sweatshirt photos (`sweat-shirt-navy.png` → RGB 23,31,46; `sweat-shirt-burgundy.png` →
  RGB 118,18,37) and used those as the recolor targets instead of the flat UI swatch hex
  (`#16305B`/`#7A1E2B`), which reads noticeably brighter/more saturated than actual
  photographed fabric. Also fixed a second, subtler bug in the recolor math itself: the
  old formula recentered garment shading around a fixed lightness of 0.5, so a garment
  photographed on a lighter base fabric (e.g. heather gray) still came out systematically
  brighter than the target even with a correct target color. Fixed by first computing the
  source photo's own average lightness (excluding background) and centering the recolor
  on *that*, so flat fabric areas map precisely onto the target color and only actual
  shading/highlights carry through as contrast — verified by resampling pixels afterward
  (Navy output landed at 23,31,47; Maroon at 119,18,37, both essentially exact matches to
  the real-photo samples). Green/Blue targets were left at the site's existing flat hex
  (`#1B6B39`/`#357DF9`) since the owner only flagged navy/burgundy and those read fine —
  Blue in particular is meant to be a vivid accent color, not muted like navy. This
  calibrated approach (real-photo pixel sampling + own-average-lightness centering) is
  now the standard recolor method for this project — reuse it directly for future
  categories rather than guessing target hex/lightness by eye.
- Unified the description format for Pull Over Hoodie (FH-5000) and Zipper Hoodie
  (BO-560) to the same 3-line `<br>` template used for the sweatpants group, per owner
  instruction that both are made of polar fleece fabric (the material, not a reference to
  the separate "Polar Fleece" product/collection — confirmed with the owner before
  editing). Updated both `products/*.html` `pd-desc` paragraphs and the matching
  `description` fields in `data/products.json`.
- **Wired real per-color photos (owner-supplied, logos already included where
  applicable) for Junior Polo (GP-3012), Polo Long Sleeve (BP-6012), and Mock Neck With
  Zipper (MN-561)** from an owner-provided `Pictures To Change/` folder — pure asset-wiring
  task, no recoloring/compositing needed this time. Noticed both Junior Polo's existing
  default photo (`junior-polo.png`, Burgundy w/ bee logo) and Polo Long Sleeve's existing
  default (`polo-long-sleeve.png`, White w/ Board of Education seal) were already
  byte-identical to two of the supplied files, so those two colors reuse the existing
  file instead of duplicating it. Added new files for the other 5 Junior Polo colors and
  7 Polo Long Sleeve colors (`assets/img/products/<slug>-<color>.png`, e.g.
  `junior-polo-navy.png`, `polo-long-sleeve-light-blue.png`), added `colors[].image`
  fields in `data/products.json` and `data-image` attributes on each `.swatch` in both
  product pages (neither had per-color images wired before this). Mock Neck With Zipper
  already had the `data-image` pattern in place from a prior recolor pass — its Navy/
  Maroon/Black files were simply overwritten in place with the new real photos (same
  filenames, no JSON/HTML changes needed); Gray was untouched (still the default photo).
  Verified all 18 color/product combinations via Puppeteer (swatch click → correct
  `.gallery-main img` src + `naturalWidth > 0` for every case).
- Owner replaced Junior Polo's White swatch photo with a lighter version (plain white
  background instead of the earlier gray-background render) — overwrote
  `assets/img/products/junior-polo-white.png` in place from the updated file in
  `Pictures To Change/Junior polo/`; no JSON/HTML changes needed since the filename was
  unchanged.
- **Made entire product cards clickable, removed the separate "View Details" button**
  (58 cards across 26 files: homepage, all 7 collection pages, and every product page's
  "You May Also Like" related-products section). Each `.product-card` now carries a
  `data-href` attribute (the same URL the old button pointed to) instead of the `<a
  class="btn ... btn-block">View Details</a>` child. Added one delegated click handler in
  `assets/js/main.js` (`document.addEventListener("click", ...)`, near the other
  delegated handlers): if the click landed on or inside an `<a>` (e.g. the product-name
  `h3` link, which is still a real anchor and still works/opens-in-new-tab on ctrl-click),
  let it behave natively and don't intercept; otherwise if the click was inside a
  `.product-card[data-href]`, navigate via `window.location.href`. Added `cursor: pointer`
  to `.product-card` in `style.css`. Verified via Puppeteer: no "View Details" text
  remains anywhere, clicking the thumbnail area of a card navigates to the product page,
  clicking the title link still works, and the pointer cursor is applied.
- Made several small dynamic-style-number tweaks to specific products, each scoped with a
  `data-style` attribute on individual `.size-tab` elements (generic handler already added
  to `assets/js/main.js` for Polo Short Sleeve — reused unchanged, no JS edits needed for
  any of these): clicking a size tab updates `.pd-style` only when that tab has
  `data-style`, so untouched products' size tabs remain unaffected. Applied to: Boys Pull
  On Pants (Toddler→TP-8080, Kids→KP-8080, Youth→BP-8080, Men's→MP-8080); Girls Pull On
  Pants – Twill (Kids→KP-7067, Girls→GP-7068, Junior→JP-7069); Girls Pull On Pants –
  Knitted (Toddler **and** Kids both→KP-3067 per owner instruction, Girls→GP-3068,
  Junior→JP-3069); Boys Joggers (Kids→KJ-8070, Youth→BJ-8070, Men's→MJ-8070); Girls
  Joggers (Kids→KJ-8067, Girls→GJ-8068, Junior→**LJ**-8069, per owner correction — not
  JP as originally listed); Pull On Shorts (Kids→KJ-8070s, Youth→BJ-8070s). Verified all
  18 tab/style combinations via Puppeteer.
- Owner supplied a real Black photo for Girls Pull On Pants — both Twill and Knitted
  variants already shared one `girls-pull-on-pants-black.png` file (from an earlier
  programmatic recolor, since no real photo existed for Black at the time), so this was a
  simple in-place file overwrite with no JSON/HTML changes needed; both product pages
  pick it up automatically.
- Owner supplied updated real Navy photos for Boys Joggers, Girls Joggers, and Pull On
  Shorts (organized in `Pictures To Change/Joggers/` and `.../Shorts/`) — same in-place
  overwrite pattern at the existing filenames, no code changes.
- **Extended the calibrated recolor pipeline to Sweat Pants (FP-5000).** Owner supplied
  one base photo (`Pictures To Change/Sweat Pants.png`, Maroon — matching the product's
  existing default `sweat-pants.png` photo) and asked for recolor-only (no logos) across
  the product's 6 listed colors. Used the established method (see the earlier jackets/
  fleece calibration entry): sampled real target RGB from genuine (non-recolored) site
  photos for Navy/Gray/Black (`sweat-shirt-navy.png`→(33,44,63), `sweat-shirt-gray.png`→
  (124,124,126), `sweat-shirt-black.png`→(42,43,47)), kept the site's existing flat hex
  for Green/Blue (not flagged as inaccurate), and centered each recolor on the source
  photo's own average lightness rather than a fixed midpoint. Generated `sweat-pants-
  green.png`, `-navy.png`, `-blue.png`, `-black.png`, `-gray.png`; Maroon reuses the
  existing default `sweat-pants.png`. Wired into `data/products.json` (`colors[].image`)
  and `data-image` attributes on `products/sweat-pants.html`'s swatches (this product had
  never been through the photo-swap pipeline before — no prior `data-image` wiring
  existed). Verified all 6 colors via Puppeteer.
- Resolved the Polar Fleece "Light Blue" question above: the owner replaced their initial
  pale-blue photo with a proper vivid royal-blue real photo, renamed the file to "Polar
  Fleece Blue.png" (no longer "Light Blue"), confirming the intent was to simply replace
  the existing programmatically-recolored "Blue" swatch's photo, not add a 7th color.
  Overwrote `assets/img/products/polar-fleece-blue.png` in place with the real photo — no
  JSON/HTML changes needed since the swatch was already wired to that filename. Verified
  via Puppeteer.
- Owner also supplied a real Blue photo for Sweat Pants (`Pictures To Change/Sweatpants
  blue.png`), replacing the earlier calibrated-recolor version — overwrote
  `assets/img/products/sweat-pants-blue.png` in place, same pattern.
- Fixed two leftover Sweatshirt category-tile images that were missed in the earlier
  "cover photo → burgundy" change (that pass only covered the mega-menu and the actual
  product card): the homepage's category grid tile and `collections.html`'s category
  tile were still showing the old black `sweat-shirt.png`. Updated both to
  `sweat-shirt-burgundy.png` for consistency with every other Sweatshirts thumbnail on
  the site.
- **Extended the calibrated recolor pipeline to Adult Sweat Pants Jogger Style (FP-6000)
  and Sweat Pants Jogger Style (FJ-5002)** — neither had a supplied source photo this
  time (unlike Sweat Pants FP-5000, which got a real base photo), so their own existing
  default product photos were used as the recolor base: FP-6000's default is Blue (kept
  as-is), needed Black/Navy/Gray/Maroon/Khaki generated; FJ-5002's default is Navy (kept
  as-is), needed Black/Gray/Khaki generated. Reused the calibrated real-photo-sampled
  targets from the earlier Sweat Pants (FP-5000) pass — same Navy/Gray/Black RGB values,
  plus the project's already-calibrated Khaki hex (`#9B7A60`) — rather than re-deriving
  new samples, since these are the same fabric/fleece family. Wired into
  `data/products.json` and `data-image` attributes on both product pages (neither had
  ever been through the photo pipeline before). Verified all 10 color combinations via
  Puppeteer.
- **Extended the pipeline to Pull Over Hoodie (FH-5000) and Zipper Hoodie (BO-560)** —
  Pull Over Hoodie's base photo is plain Navy (no logo), so a straightforward recolor to
  Black/Gray/Maroon was used, same as any other plain product. **Zipper Hoodie's base
  photo already had the bee logo baked in** (an original site asset, not something this
  session added) — recoloring it naively would also recolor the logo itself. Solved by
  adding a "preserve logo" mode to the recolor function: pixels are left untouched if
  they're low-saturation (white/black logo outlines) or clearly a different hue family
  from the garment (colored graphic elements). This alone still let a saturated pure-red
  boxing-glove accent bleed into the recolor, because red and maroon share almost the
  same hue — only saturation tells them apart (glove ≈0.98 vs fabric ≈0.73 average) — so
  a further rule was added: pixels much more saturated than the garment's own average are
  also preserved, but **only within a manually-identified bounding box around the logo**
  (`x:880–1100, y:500–950` for this specific photo). Restricting that stricter rule to a
  bounding box was necessary because applying it image-wide caught ordinary shadow/wrinkle
  noise across the whole garment and produced a visible speckled mess — confirmed by
  rendering full-size output, not just spot-sampling pixels. Verified the exact glove
  pixel byte-for-byte identical across all 3 recolored outputs, and visually confirmed no
  stray speckling elsewhere. **Reusable takeaway:** when recoloring a photo with an
  existing colored logo/graphic, don't trust a single global heuristic — verify against
  the specific accent color's actual HSL values, and if a saturation-based rule is needed
  to catch a same-hue-family accent, scope it to the logo's bounding box rather than
  applying it globally, or fabric shading will get falsely preserved as "logo" all over
  the garment. Wired into `data/products.json` and `data-image` attributes on both
  product pages. Verified all 8 color combinations via Puppeteer, including a pixel-level
  check that the boxing glove's red survived unchanged.
- **Owner then asked to remove the bee logo from Zipper Hoodie entirely except on the
  Maroon colorway** — revisited the earlier-documented "logo removal produces a visible
  patch/seam" limitation (see the Sweat Shirt "With Logo" pipeline entry) and this time it
  worked cleanly. Used a clone-stamp technique: copied a same-size patch of clean fabric
  from the left chest (mirrored position, no logo) over the logo's bounding box
  (`x:880–1100, y:500–950`), feathered 25px at the box edges to blend seams, on the
  original Maroon photo. Verified with a tight crop right at the former logo location
  before trusting it — completely seamless, no visible patch edge. Re-ran the plain
  (non-logo-preserving) recolor on this cleaned base to regenerate Black/Gray/Navy;
  Maroon keeps the original photo with the logo intact, untouched, per instruction.
  **Why this succeeded where the earlier sweatshirt attempt failed:** this photo is a
  flat, evenly-lit studio product shot with minimal fabric shading/wrinkling near the
  logo site, so a same-garment clone patch matches almost perfectly; the earlier failed
  case likely had more shading/texture variation at the removal site, so clone-stamping
  couldn't hide the seam. **Takeaway:** logo removal via clone-stamp is worth trying
  again on other flat/uniformly-lit product photos — it isn't a universal failure, it
  depends on how much shading/texture surrounds the logo — but always verify with a tight
  crop at the exact removal site before trusting the result, not just the full thumbnail.
  No JSON/HTML changes needed since the filenames were unchanged. Verified all 4 colors
  via Puppeteer.
- **Wired real per-color photos for Polo Short Sleeve (BP-6012)** from an owner-supplied
  `Pictures To Change/Polo Short Sleeve/` folder (7 of 8 colors; no Navy file was
  supplied). While wiring this up, caught and fixed a **pre-existing bug**: the product's
  default/representative file (`assets/img/products/polo-short-sleeve.png`, referenced by
  every collection card, the mega-menu, and the homepage) actually depicted a **Navy**
  garment, while `data/products.json`'s `color` field and the product page's "selected"
  swatch both said **Black** — a stale mismatch from earlier in the project, unrelated to
  this task. Fixed by preserving the existing (correct, real) Navy photo under a new
  filename (`polo-short-sleeve-navy.png`) for the Navy swatch, then overwriting the
  shared default filename with the owner's new real Black photo — since every other
  reference to that filename sitewide was already assuming it showed Black, this
  corrected all of them at once rather than just the one product page. Converted one
  supplied file (`Polo Short Sleeve Blue.jpeg`) to PNG for consistency with the rest of
  the catalog (via a throwaway Jimp one-liner — Jimp isn't a project dependency, only
  available in the scratchpad's throwaway npm install, consistent with how it's been
  used all session). Verified all 8 colors via Puppeteer, plus confirmed the page's
  initial (pre-click) load now shows the correct Black photo instead of the old Navy one.
- **Store address corrected: it's 395 Broadway, Bayonne, NJ — not 427 Broadway.** The
  displayed address text/copy-button on `about.html` was already correct, but three
  leftover spots still said 427 (the map's `data-map-loading` alt text, the iframe
  `title`, and the "Get Directions" link's query param) — fixed all three. **427 Broadway
  is stale everywhere it appears** (including earlier in this log, e.g. the original
  "Location & Hours" entry above) — always use 395 Broadway for this business going
  forward, in code, copy, and any generated marketing assets.
- Created marketing poster/banner assets outside the site itself, in
  `assets/marketing/posters-2026-08/` (3 initial layout-only concepts — minimalist,
  bold-navy, editorial-split — each in social-square/story/print-portrait) and
  `assets/marketing/deals-2026-08/` (5 real-pricing "deal" posters: Polo Long Sleeve $14,
  Polo Short Sleeve $12, Kids Sweatshirt $15, Adult Sweatshirt $20, Pullover/Zipper
  Hoodies Kids $20 / Adult $25 — each in the same 3 formats). Built with hand-coded
  HTML/CSS (Google Fonts Anton + Poppins loaded live, real product photos from
  `assets/img/products/`, brand hex tokens) and rendered via a scratch `puppeteer-core` +
  local Chrome script (no MCP/Canva connection available in this environment — flagged to
  owner as an option to set up later if needed). Owner feedback that shaped the "deal"
  template: make the **B-UNIFORM** wordmark much bigger/bolder (huge Anton-font wordmark
  now dominates the top), make price the loudest element (now a jagged gold "sticker
  burst" overlapping the garment photo instead of a small corner badge), and reword the
  new-location message attractively while keeping the same meaning (landed on "WE'VE
  MOVED TO A BIGGER SPOT!" as a full-width gold banner, not small footer text). **Gym
  Shirts and Gym Pants deal posters are intentionally not yet made** — no matching
  product/photo exists in the current 18-product catalog for either; owner chose to wait
  and supply real photos rather than substitute a mismatched product photo. The generator
  script (data-driven, one template + a `PRODUCTS` array) lives only in the scratchpad,
  not the repo — recreate it fresh next time rather than assuming it persists.
- **Connected a Canva MCP server** (`claude mcp add --transport http --scope user canva
  https://mcp.canva.com/mcp`, then owner completed OAuth login themselves — the login step
  requires a real browser and can't be done from an agent shell). Once connected, tried to
  use it to build fresh poster designs, but hit real, confirmed platform limits on this
  Canva account: **AI Design Generation (`generate-design`) is disabled on this Canva
  team/plan** (errors with "Design generation is not enabled in your team"), and
  **`search-brand-templates` returns empty** (no brand templates exist in this account —
  that feature needs a Canva Business/Enterprise setup). The remaining Canva tools
  (`start-editing-transaction` / `perform-editing-operations`) can only edit an *existing*
  design's existing elements (swap text/images, move/resize/delete) — there's no
  "add a new text box" or "draw a shape" op, so a design can't be composed from a blank
  canvas that way either. **Conclusion: Canva MCP cannot build new posters on this account
  as currently configured** — the only way to use Canva going forward would be the owner
  manually picking an existing template in the Canva web UI and sharing its link for me to
  edit, or enabling Magic Design on their plan. Stayed on the HTML/CSS/Puppeteer pipeline
  instead.
- **Redesigned the deal-poster template from scratch** (not just a retexture) after owner
  feedback that the first "flash-sale" version (orange bg, jagged starburst price, angled
  sticker card) felt too similar to my own earlier template. Owner supplied two real
  inspiration screenshots (a "BIG SALE" comic-sticker design and a "SPECIAL SALE" ad with
  a product-on-pedestal + ring badge) and asked me to borrow techniques, not copy layouts.
  New template (`catchy-generate.js` pattern, scratchpad-only) uses: a navy gradient bg
  with radiating conic-gradient sunburst rays + scattered confetti dots (borrowed from the
  sticker-sale ref), a thick-stroke layered "sticker text" headline (`-webkit-text-stroke`
  + stacked `text-shadow` offsets, no image needed), a product floating on a soft
  radial-gradient "podium" glow instead of an angled card (borrowed from the pedestal ref),
  and a thin gold-ring circle price badge (also from the pedestal ref) instead of a jagged
  starburst. Iterated twice more on owner feedback: (1) made the product ~50% larger as the
  clear focal point and restored the location message as a full-width bold gold banner
  (previous pass had shrunk both down too far); (2) removed "THIS WEEK ONLY", removed the
  white background around the product (real transparent cutout instead — see below), and
  changed the price display to a struck-through "was" price above the sale price (e.g.
  ~~$16~~ **$12 ONLY**) plus a competitive tagline pill ("CHEAPEST UNIFORMS IN TOWN — ONLY
  AT B-UNIFORM.COM"). **This is now the confirmed direction for the Polo Short Sleeve
  poster**; not yet batched to the other products (see Known gaps).
- **Built a background-removal pipeline** (`remove-bg.js`, scratchpad-only, uses `jimp` —
  note: this session installed the newer **Jimp v1**, whose API changed from the `Jimp`
  default-export used in earlier pipeline entries in this log to a named export:
  `const { Jimp } = require('jimp')`, and `img.write(path)` instead of `.writeAsync()`).
  Approach: flood-fill from all four canvas edges over near-white/low-saturation pixels
  (luminance > 235, saturation < 0.08) marking them transparent, then a light edge-feather
  pass on remaining near-white pixels adjacent to a removed pixel for anti-aliased edges,
  then a final forced-transparent N-px border margin to catch compression/scan artifacts
  right at the canvas edge that are too dark/saturated to pass the whiteness test on their
  own (this caught a real 1px-wide non-white line baked into the original
  `polo-short-sleeve.png`'s right edge that showed up as a faint vertical line artifact in
  the first render — diagnosed by scanning column-by-column for leftover opaque alpha
  rather than guessing). Verified by compositing the cutout onto a solid color test
  background before trusting it, not just eyeballing on a white viewer background (which
  can't show whether transparency actually worked). Output saved as
  `polo-short-sleeve-cutout.png`; same technique should work directly for the other
  catalog product photos since they're all shot on the same flat white studio background.
- **Built a first animated/video version of the deal poster** per owner request to make it
  "stop the doomscroll" — a ~7.8s, 1080x1080, 30fps MP4 (`assets/marketing/video-2026-08/
  polo-short-sleeve-flash-deal.mp4`). Pure CSS-keyframe animation (no video/animation MCP
  needed): each element (brand chip, headline, tagline, product drop-bounce onto the
  podium, price-ring pop-in with rotation overshoot, an animated strike-through line on the
  "was" price, name/CTA, location banner slide-up) is choreographed via `animation-delay` +
  `forwards` so the whole page is one continuous timeline; background rays rotate
  continuously and confetti dots twinkle throughout to keep the frame alive during holds;
  the price ring gets one extra emphasis pulse near the end. Recorded via Puppeteer's
  built-in `page.screencast()` (Puppeteer v22+ API — this session has v25) to WebM, then
  encoded to H.264/MP4 with **ffmpeg** (installed this session via
  `winget install Gyan.FFmpeg` — not present in the environment before; owner's shell needs
  to be restarted for `ffmpeg` to be on `PATH` automatically, until then use the full path
  under `%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg_...\ffmpeg-9.0-full_build\
  bin\ffmpeg.exe`). This is a proof-of-concept for one product only — owner said they'll
  decide separately whether to apply video treatment to the rest of the catalog.
- **Iterated on the first video cut per owner feedback** (felt "tacky", background rotation
  wasn't smooth, only the rays were moving, shirt felt static/fake): slowed the sunburst
  rotation from a full 360°/26s (reads as an obvious spinning pinwheel) to 360°/160s plus a
  gentle 7s "breathing" scale pulse — much more ambient, less hypnotic-spinner. Gave nearly
  every element continuous idle motion instead of freezing after its entrance (brand chip
  float/tilt, shirt sway + vertical bob for a fabric-like "jiggle", price-ring wobble,
  tagline/name/CTA/location-pin gentle bobs) using CSS's **standalone `translate`/`rotate`/
  `scale` properties** layered alongside each element's existing `transform`-based entrance
  keyframe — this avoids the composition conflict you get if two animations both target the
  shorthand `transform` property (the later one simply overwrites the earlier one's value
  each frame instead of combining). One real bug hit and fixed this way: adding a standalone
  `translate` idle animation to the tagline (which was already horizontally centered via
  `transform:translate(-50%,0)`) initially double-applied the `-50%` offset and pushed it
  off-center — fixed by keeping the centering only in the `transform` shorthand and having
  the idle keyframe carry just the small vertical bob with no x-component.
- **Set up a proper Remotion project** at `marketing-video/` (own `package.json`, gitignored
  `node_modules`/`out`/`.remotion` — this is intentionally a real, persistent part of the
  repo, not a scratchpad throwaway, since owner wants to keep using it) per owner's request
  to explore a more powerful video pipeline than raw CSS keyframes. Owner asked "how do I
  set this up" — answer was: nothing on the owner's end at all; Remotion is free/local/
  npm-only (free tier covers individuals and orgs ≤3 employees, no account or API key
  needed) — so it was just set up and proven end-to-end rather than left as instructions.
  `src/Root.jsx` defines the `PoloShortSleeveDeal` composition (1080x1080, 30fps, 7.8s);
  `src/DealVideo.jsx` re-implements the same animation as the CSS version but with
  Remotion's frame-based model (`useCurrentFrame()`, `spring()` for physics-based pops,
  `interpolate()` for linear/eased transitions) instead of CSS `@keyframes` + `animation-
  delay` — genuinely finer control (e.g. the "was"-price strikethrough is a
  `background-size` wipe driven directly by `interpolate()`, not a CSS animation guessing
  timing against a `forwards` hold). Product photo lives in `marketing-video/public/`
  (Remotion's static-asset convention, referenced via `staticFile()`) — copied from the
  scratchpad cutout; **not the same file as `assets/img/products/`**, so if the source
  cutout changes it needs to be re-copied into `marketing-video/public/` too.
  **Real bug hit and fixed**: the first render's text fell back to a generic serif font —
  Remotion doesn't pick up a plain `<link>`-tag Google Fonts import the way a normal browser
  page does. Fixed with the official `@remotion/google-fonts` package
  (`loadFont()` from `@remotion/google-fonts/Anton` and `/Poppins`, called at module scope,
  using the returned `fontFamily` value in styles) — this is the correct/documented way to
  load fonts in Remotion, not a workaround; use this pattern for any future Remotion
  composition in this project. Also hit `npx remotion render` requiring an **explicit entry
  point** (`npx remotion render src/index.jsx <composition-id> <out-path>` — bare
  `npx remotion render <composition-id> <out-path>` errors with "No entry point
  specified"). Verified the final render by extracting and visually inspecting frames via
  ffmpeg (`-ss <time> -frames:v 1`), not just checking the render command exited 0 — caught
  the font bug this way. Output saved to `marketing-video/out/` (gitignored) and a copy
  placed at `assets/marketing/video-2026-08/polo-short-sleeve-flash-deal-remotion.mp4`
  alongside the original CSS/Puppeteer version for comparison.
- **Researched free video-generation options** at owner's request as an alternative/
  supplement to hand-built animation: **Remotion** (adopted, see above) is free for
  individuals/orgs ≤3 employees, matches this project's existing code-first approach, no
  account needed. AI video-generation MCP connectors (HeyGen, FAL, Higgsfield, Vivideo)
  generate real AI footage/avatars — a different capability, not a better version of this
  motion-graphic poster format — and "free" there typically means a limited trial requiring
  the owner's own account/API key. Open-source AI video models (LTX, Mochi 1, HunyuanVideo)
  are genuinely free but need a capable local GPU to run, not practical on this machine.
  Recommendation given to owner: Remotion is the only one worth pursuing for this use case.
- **Switched the Polo Short Sleeve deal creative to the Burgundy/Maroon colorway** — owner
  correctly flagged that the plain Black photo barely registered against the navy
  background (dark-on-dark, low contrast), and asked for a bright/warm color instead for
  a clearer focal point. Used the catalog's existing `polo-short-sleeve-maroon.png`
  (Burgundy is this product's "Maroon" colorway — includes the boxing-bee logo) rather than
  sourcing a new photo. Ran it through the same background-removal pipeline
  (`remove-bg.js`) to produce `polo-short-sleeve-maroon-cutout.png`, verified transparency
  the same way (composited onto a solid test color before trusting it). **Explicit owner
  instruction: do not delete or overwrite any previously generated asset** — so the
  Burgundy versions were added as new files alongside the Black ones, not replacements:
  - Static poster: `assets/marketing/catchy-2026-08/catchy-polo-short-sleeve-burgundy--
    {social-square-1080x1080,print-portrait-1275x1650}.png`
  - CSS/Puppeteer video: `assets/marketing/video-2026-08/polo-short-sleeve-burgundy-flash-
    deal.mp4`
  - Remotion video: `assets/marketing/video-2026-08/polo-short-sleeve-burgundy-flash-deal-
    remotion.mp4`, via a **second** `<Composition id="PoloShortSleeveDealBurgundy">` added
    in `marketing-video/src/Root.jsx` (the original `PoloShortSleeveDeal`/Black composition
    is untouched) — both point at the same `DealVideo` component, just different `photo`
    prop, and the Burgundy photo was copied into `marketing-video/public/` alongside the
    Black one (Remotion's `public/` is a separate asset root from `assets/img/products/`,
    easy to forget to sync). All four Black-shirt outputs from earlier in this log still
    exist untouched. The `.gitignore`'d scratchpad generator scripts (`catchy-generate.js`,
    `catchy-animate.js`) were updated in place to point at the Burgundy asset — since they
    don't persist in the repo anyway, there was no "old version" of *those* to preserve,
    only the rendered output files needed to survive.
- **Lightened the background and switched to a 3-shirt "fanned" hero composition** for the
  static poster only (not yet applied to either video), per owner feedback: background
  gradient moved from `#1c3f74/#16305B/#0a1830` to a lighter `#2f5a9c/#234a80/#17335e` ramp;
  added two extra `<img>`s positioned either side of the original center shirt
  (`translateX(±21vh) rotate(±13deg)`, slightly smaller, dimmed via
  `filter: brightness(0.86)` and pushed to a lower `z-index`) so the two side shirts read as
  behind/flanking the center one rather than competing with it — center shirt kept
  untouched at full size/brightness as the focal point.
  **Superseded immediately after** — owner asked for the two side shirts to be different
  *colors* (Green on one side, White on the other, center stays Burgundy) rather than three
  copies of the same photo, **and explicitly asked to delete** the same-photo trio files
  (an explicit exception to the usual "don't delete previous assets" rule — that rule is
  about not losing earlier *rounds* the owner might still want, not a blanket ban on ever
  deleting anything once asked). Deleted
  `catchy-polo-short-sleeve-burgundy-trio--{social-square-1080x1080,print-portrait-1275x1650}.png`.
  Owner also asked for only one output file this time (skip the print-portrait format) to
  reduce cost — the generator script's `.garment-side`/`.garment` markup now takes separate
  `photoLeft`/`photo`/`photoRight` fields instead of one repeated `photo`, using the
  catalog's existing `polo-short-sleeve-green.png` and `polo-short-sleeve-white.png`.
  **Real bug hit and fixed in `remove-bg.js` while doing this**: the White polo's studio
  backdrop turned out to be light *gray* (~184 luminance), not white — the old fixed
  "luminance > 235" whiteness threshold missed almost the entire background, leaving a
  visible gray rectangle behind the cutout. Rewrote background detection to be **adaptive**:
  sample the actual corner-pixel color of each specific photo and flood-fill by color
  *distance* from that sampled reference (default tolerance 30, now a CLI arg —
  `node remove-bg.js <src> <out> [tolerance]`) instead of assuming near-white. This is a
  better general technique and should be used for any future product photo, not just this
  one. That fix then surfaced a second, harder problem: at tight-enough tolerance to avoid
  false positives, small notches got bitten into the white shirt's underarm area, because
  that fold-shadow was itself close in tone to the gray backdrop and *directly channel-
  connected* to the outer background (confirmed by inspecting the original source photo —
  it's a solid "ghost mannequin" shot with no real gap there, so the notch was a genuine
  false removal, not correctly-exposed background). Added a morphological closing pass
  (dilate the opaque alpha mask, then erode it back) to `remove-bg.js` to auto-patch small
  bitten-in holes — this works for isolated pockets but **cannot fix a notch that's an open
  channel connected to the main background region** (closing only fills fully-enclosed
  holes); the underarm notch is exactly that case, so it remains faintly present in the raw
  cutout file even after closing. Left it as-is rather than continuing to chase a
  diminishing-return pixel fix, because verifying it *in the actual composition* (small
  scale, tilted, dimmed, partially occluded by the center shirt) showed it's not visible at
  all in practice — **always check a problematic cutout in its actual final context before
  further micro-optimizing the isolated asset**, the bar is "invisible in the real
  composition," not "flawless in isolation."
  Final result (single file, per owner's cost-saving request): `assets/marketing/
  catchy-2026-08/catchy-polo-short-sleeve-burgundy-green-white--social-square-1080x1080.png`.
  Single-shirt Burgundy and original Black versions both still exist untouched.
- **Built a new video concept**: `assets/marketing/video-2026-08/polo-trio-location-
  popup.mp4` — 10s, 1080x1080, 30fps. Owner's brief: three-shirt (Burgundy center/Green
  left/White right) hero, then out of nowhere a **popup fades in** announcing the new
  location, holds ~3.5s so it's actually readable, then **morphs into a footer bar** (same
  content, different container) rather than just disappearing — solves "the popup was easy
  to miss" by giving the message a second, persistent life at the bottom. Owner also gave
  explicit art direction on pacing: **not** everything entering one-by-one (reads as
  robotic/AI-slideshow) and **not** everything appearing at once either (reads as flat) —
  wanted "the sweet spot in between." Landed on **3 synchronized entrance beats** instead
  of ~8 individually-staggered elements: beat 1 = brand chip + headline + tagline together
  (frame 6), beat 2 = all three shirts + price ring together (frame 20, one shared
  `spring()` call, not staggered left→center→right), beat 3 = product name + CTA together
  (frame 34) — few enough beats to feel intentional/choreographed, more than one beat so it
  still has a sense of build.
  New file `marketing-video/src/DealVideoPopup.jsx` (existing `DealVideo.jsx`/`Root.jsx`
  compositions untouched, this is a new component + a new `<Composition
  id="PoloTrioLocationPopup">` added alongside the existing two). Built in Remotion rather
  than the CSS/Puppeteer pipeline specifically *because* of the morph requirement — the
  popup-to-footer transition is a literal interpolation of one DOM box's `top/left/width/
  height/borderRadius` from modal-card values to full-width-footer values
  (`interpolate(morphT, [0,1], [modalValue, footerValue])` per property, with a cubic
  ease-out), which is precise and easy in Remotion's frame-driven model and would be
  fragile to hand-time with CSS `@keyframes` percentages. Also added, for polish beyond
  what was literally asked: while the popup/scrim is up, the whole background scene gets a
  synced `blur()` + `brightness()` dim (driven by the same interpolated scrim-opacity value)
  so attention is pulled to the popup the way a real modal would, and un-blurs/un-dims in
  sync with the morph-to-footer. Green/White cutouts copied into
  `marketing-video/public/` alongside the existing Black/Burgundy ones (all four now live
  there). Nothing else was touched or deleted per explicit owner instruction this round.
- **Video/animation work paused on this project** — owner decided not to move forward with
  the popup/footer video concept (or video in general, for now) and said to go back to
  **static pictures only**. Before stopping, extracted the whole animation pipeline (CSS+
  Puppeteer screencast method, the Remotion setup + shape-morph technique, the background-
  removal script, and the "2-4 synchronized beats" pacing principle from owner feedback)
  into a **global, project-independent Claude Code skill**:
  `C:\Users\User\.claude\skills\product-video-animation\` (`SKILL.md` +
  `references/remove-bg.js`, `references/puppeteer-screencast-recorder.js`,
  `references/remotion-skeleton.jsx`). This is reusable in any future project, not just
  b-uniform — if video work resumes here or elsewhere, start from that skill rather than
  re-deriving the pipeline from scratch. `marketing-video/` and all four video files in
  `assets/marketing/video-2026-08/` are left in place (untouched, not deleted), just not
  being actively extended for now.
- **Ran competitor pricing research** against frenchtoast.com (owner-named competitor) for
  every item on the current deal list, via WebSearch/WebFetch (caveat given to owner: French
  Toast's site showed most items out of stock, so these are cached/search-snapshot prices,
  not confirmed live checkout prices, and sizes span toddler→adult so ranges are wide).
  Found B-Uniform is cheaper across the board vs French Toast's *list* prices (often
  25–45%), but closer to a wash vs their *sale* prices — strongest "cheapest" claim for
  Kids Sweatshirt/Adult Sweatshirt/Gym Shirt, weakest for Gym Pants (data too thin) and the
  hoodie quarter-zip style. Owner has not yet said which comparisons to actually lean into
  in poster copy.
- **Deal-list scope finalized with owner:** Gym Shirts item dropped entirely (no plans to
  make a poster for it). "Gym Pants" maps to the existing **Sweat Pants** product/photo
  (`sweat-pants.png` family) — not a new/separate product.
- **Latest static-poster iteration (current direction as of this entry):** owner asked to
  go from 3 shirts back down to **2** — Navy and White only (both already carry the
  catalog's circular Board of Education seal logo, so "must have circular logos" was
  satisfied by the existing photos, no new asset work needed there). Removed the
  `polo-short-sleeve-navy.png` background the same way as the others
  (`remove-bg.js` → `polo-short-sleeve-navy-cutout.png`, verified by compositing onto a
  contrasting test color). Price ring simplified: **deleted the struck-through "$16 was"
  line entirely** and enlarged `$12` from 4.2vh to 6.4vh for readability, per instruction.
  **Location redesign** — owner felt the footer-bar treatment still wasn't prominent enough
  given it's meant to be "the main point of this poster." Researched actual poster-design
  best practices (WebSearch) rather than guessing: high-contrast color block distinct from
  the background, a visible border for separation, a focal-point graphic, bigger type than
  surrounding text. Replaced the full-width footer with a **bordered, drop-shadowed,
  slightly-tilted "stamp" callout** (white fill, thick gold border, pin emoji, bigger Anton
  headline than before) positioned overlapping the lower hero area (not pinned to the very
  bottom edge) so it reads as a focal point rather than a footnote.
  **Layout bug hit while adding it**: the new stamp is `position:absolute` (correctly out
  of normal flow), but the flow content below it (product name, CTA button) still wasn't
  given enough room and got silently clipped by `.stage`'s `overflow:hidden` — not an
  error, just missing pixels, only caught by actually looking at the rendered PNG. Fixed
  by shrinking `.garment-pair` max-height (56vh → 33vh) and tightening the vertical rhythm
  (stamp `bottom` offset, `.cta-row` margins) until everything fit inside 1080px again.
  **Reusable lesson: whenever an absolutely-positioned overlay is added to a layout that
  already fully occupies the canvas, re-check the flow elements below it for clipping —
  the overlay not affecting flow doesn't mean the rest of the page still fits.**
  Saved as a new file, nothing prior deleted: `assets/marketing/catchy-2026-08/
  catchy-polo-short-sleeve-navy-white--social-square-1080x1080.png` (+
  `polo-short-sleeve-navy-cutout.png` alongside the other cutout assets in that folder).
- **Refined the navy/white poster further** (overwrote the same file — this is iteration on
  the current in-progress design, not a new round to preserve separately): shirts enlarged
  (`.garment-pair` max-height 33vh → 45vh), the location stamp shrunk back down (owner liked
  the *concept* but the first pass was too big — width 70vw→58vw, headline 4vh→2.9vh, border/
  padding/shadow all scaled down to match), and added a **5vh bottom safe-zone**
  (`padding-bottom` on `.stage`) so the product name/CTA sit clear of the bottom edge —
  owner flagged that area as "the red zone" (i.e. where social platforms' own UI — captions,
  action buttons — commonly overlaps the bottom of a post image), which is a real platform
  consideration worth remembering for every future poster/video export, not just this one.
- Contact and Wholesale forms are front-end only — no backend wired up, so submissions
  don't currently reach anyone. Owner is deciding between Formspree/Web3Forms, a mailto
  fallback, or holding off until hosting is decided.
- Footer/contact social links are still `href="#"` placeholders — need real URLs.
- Policies page has generic placeholder legal text — needs business-reviewed copy.
- No hosting/deployment set up yet (site only exists locally).
- **Marketing deal posters**: only Polo Short Sleeve is done in the confirmed "catchy"
  template (background-removed cutout, struck-through pricing, gold ring badge, sunburst
  bg). Still need, before batching the template to the rest: (1) owner-supplied "was"
  (struck-through) prices for Polo Long Sleeve ($14), Kids Sweatshirt ($15), Adult
  Sweatshirt ($20), Hoodie Kids ($20)/Adult ($25), and Gym Pants/Sweat Pants ($17); (2)
  owner's call on which French-Toast-comparison claims to actually surface in copy per
  product. The `assets/marketing/deals-2026-08/` (5-poster "flat" set) and
  `assets/marketing/posters-2026-08/` (3 layout concepts) directories are earlier,
  superseded rounds — **owner said explicitly not to delete them**, keep as-is even though
  the "catchy" template in `assets/marketing/catchy-2026-08/` is the current direction.
- Video treatment (see above) exists only for Polo Short Sleeve, now in **two parallel
  versions** (CSS/Puppeteer at `assets/marketing/video-2026-08/polo-short-sleeve-flash-
  deal.mp4`, and Remotion at `...polo-short-sleeve-flash-deal-remotion.mp4`) — owner hasn't
  yet said whether to standardize on one pipeline (Remotion is the intended long-term
  direction per owner's ask, but nothing has been deleted) or extend either to the rest of
  the catalog.
- `marketing-video/` (the Remotion project) needs `npm install` run once before it will
  render again in a fresh environment — `node_modules` is gitignored by design. Rendering
  also needs `ffmpeg` on `PATH` (see the ffmpeg entry above) and ideally a full shell
  restart so `PATH` picks it up automatically rather than needing the full winget path.

**Next up:** get the remaining "was" prices + highlight priorities from the owner, then
batch the confirmed "catchy" template (cutout photo + struck price + ring badge) across
Polo Long Sleeve, Kids Sweatshirt, Adult Sweatshirt, Hoodies, and Gym Pants/Sweat Pants;
get owner's verdict on the CSS-vs-Remotion video comparison and whether to extend video to
the rest of the catalog. Longer-term: forms backend, real social links, policy copy, then
deployment.

> Update this log whenever a task is completed or a session ends — add newly finished
> items to "Done", move resolved items out of "Known gaps", and refresh "Next up".

## Marketing Campaign (context for a dedicated marketing session)

The owner is starting a **separate Claude Code session focused purely on marketing**
B-Uniform (this session stays focused on the site/codebase itself). Everything below is
context that session needs — read this whole section before doing marketing work.

### Business context for marketing
- Physical store: **395 Broadway, Bayonne, NJ** (not 427 — see the corrected-address entry
  above; 427 is stale and must never be reused). Hours: Everyday, 12:00 PM – 6:00 PM.
- Business model: **B2B/wholesale-friendly reseller**, not consumer e-commerce — no prices
  on the site, no checkout. The conversion path is the Wholesale quote form
  (`wholesale.html`), which is now fully working end-to-end (see the forms-fixed section
  above) and delivers to **info@b-uniform.com**.
- Core local audience: schools, daycares, sports programs, and other resellers in the
  Bayonne/Hudson County area — not just walk-in retail customers. Existing branded stock
  (Bayonne Board of Education seal on several product photos) shows an existing
  relationship with at least one real local school.
- Existing marketing assets already built this project (do not recreate from scratch —
  see the Progress Log above for full detail): deal posters and a video ad in
  `assets/marketing/` (catchy-2026-08/, deals-2026-08/, posters-2026-08/, video-2026-08/),
  plus a reusable global skill at `~/.claude/skills/product-video-animation/` for turning
  any future poster into an animated MP4 (CSS/Puppeteer + Remotion pipelines, background-
  removal script included).
- Facebook Page (already exists, owner-provided):
  https://www.facebook.com/p/B-Uniform-100063610751522/

### Marketing skills installed (global, available in any session)
A 49-skill marketing pack from https://github.com/coreyhaines31/marketingskills was
installed **globally** at `~/.claude/skills/` (not project-scoped — available in every
session on this machine) on 2026-08-20, alongside its shared `~/.claude/tools/` reference
data that several skills depend on via relative paths. Covers ads, ad-creative, social,
copywriting, cro, seo-audit, emails, cold-email, prospecting, analytics, public-relations,
and many more (57 total skills now in the global folder counting pre-existing ones).
**Run the `product-marketing` skill first, in the new session** — it creates
`.agents/product-marketing.md`, a persistent context file every other marketing skill
reads before acting, so the business context above only needs to be given once.

### Recommended step-by-step plan (already discussed with the owner)
1. `product-marketing` skill — one-time context setup.
2. **Google Analytics** — not yet installed on the site at all (zero traffic tracking
   currently exists). Owner was mid-setup creating a GA4 property at analytics.google.com
   as of this entry; once they have the `G-XXXXXXXXXX` Measurement ID, wire it into all 32
   HTML pages' `<head>` (same site-wide-edit pattern used for the email address change —
   grep across `*.html collections/*.html products/*.html`, no single templated source).
   This should happen **before** any paid ads run, or there's no way to measure results.
3. **Facebook Page improvements** (owner asked for a full checklist, already given —
   summarized here so it isn't re-derived from scratch):
   - Rename page to include location keyword (e.g. "B-Uniform — School Uniforms, Bayonne
     NJ"); set category to Clothing/School Supply Store; fill About section (address,
     hours, phone, one-line pitch); set cover photo to a real in-store photo or one of the
     existing deal posters (currently likely blank/default); add a "Get Quote"/"Contact
     Us" CTA button linking to `wholesale.html`; enable reviews; website link → homepage
     (`b-uniform.com`), not straight to the form.
   - Content pillars for posting: Product/catalog 35%, In-store/behind-the-scenes 25%,
     Local/community 20% (tag local schools, mention Bayonne), Seasonal urgency 15%
     (back-to-school countdowns), Promotional 5% (the existing deal posters, used
     sparingly).
   - Realistic cadence for a single-location small business: **3–4 posts/week on fixed
     days**, not daily — consistency over volume.
   - Compliance notes: any pricing shown in a poster must be honored if a customer asks to
     buy at that price (FTC); get permission before reposting a customer's name/photo as a
     testimonial (FTC endorsement guidelines); products are children's uniforms, so ads
     should target parents, not solicit children directly.
4. **Paid local ads**: Meta Business Manager campaign, geo-radius targeted around 395
   Broadway (~10–15 mile radius), using the existing poster/video creative, small starting
   budget ($5–10/day test). Owner should already have (or be creating) a Meta Business
   Manager tied to the Facebook Page above.
5. **Google Business Profile**: owner confirmed one already exists (they initially
   confused this with Google Analytics — it's a separate, already-set-up tool, just needs
   optimizing, not creating).
6. **Local SEO**: the `seo-audit`/`schema`/`ai-seo`/`site-architecture` skills apply here —
   site currently has no local-business schema markup.
7. Longer-term, lower-priority per the skills-report given to the owner: `community-
   marketing` (Bayonne Facebook parent groups), `prospecting` + `cold-email` (this is
   actually the core revenue channel — local schools/daycares as wholesale accounts, not
   walk-in retail), `public-relations` (the "we moved to a bigger spot" story is a
   legitimate local-press pitch, not just poster copy).

### Known gap flagged during the marketing discussion
Footer/contact social links across all 32 HTML pages are still `href="#"` placeholders
(see "Known content gaps" near the top of this file) — now that a real Facebook Page URL
exists, these should be updated to the real link once the owner also confirms an
Instagram/other accounts (asked, not yet answered as of this entry).
