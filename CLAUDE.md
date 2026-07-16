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
mostly works too, except the quick-view modal (fetches `data/products.json` via `fetch()`,
which CORS-blocks under `file://`).

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
HTML with the same data hand-copied in. `products.json` is only fetched at runtime by the
quick-view modal (see `openQuickView()` in `assets/js/main.js`).

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
  reads this to build correct paths when fetching `data/products.json` or writing image
  `src` into dynamically-rendered content (inquiry drawer, quick-view modal).
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
  not a real cart — see `getInquiry`/`setInquiry`/`addToInquiry`), quick-view modal,
  product-page size tabs/chips, spec accordions, gallery zoom, collection filter/sort
  (operates on already-rendered DOM cards via `data-sizes`/`data-color`/`data-name`
  attributes, not by re-querying JSON), and client-side form validation.
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
