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

**Known gaps / not yet done:**
- Contact and Wholesale forms are front-end only — no backend wired up, so submissions
  don't currently reach anyone. Owner is deciding between Formspree/Web3Forms, a mailto
  fallback, or holding off until hosting is decided.
- Footer/contact social links are still `href="#"` placeholders — need real URLs.
- Policies page has generic placeholder legal text — needs business-reviewed copy.
- No hosting/deployment set up yet (site only exists locally).

**Next up:** waiting on the owner's decision for the forms backend; then real social
links and policy copy; then deployment.

> Update this log whenever a task is completed or a session ends — add newly finished
> items to "Done", move resolved items out of "Known gaps", and refresh "Next up".
