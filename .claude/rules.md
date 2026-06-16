# Hardened rules for this project

These are not preferences. They are settled. Treat as binding unless the user explicitly overrides for a specific task.

## Version control

- **`pull` / `push` always means git, never Shopify CLI.** `shopify theme pull` once wiped untracked local files (`layout/lp.liquid`, template stubs). Default `pull` / `push` to git. If Shopify-side sync is genuinely needed, say so explicitly and confirm.
- **Conventional Commits.** `type(scope): subject`. No em dashes in commit body. No `Co-Authored-By` trailer (per global `~/.claude/CLAUDE.md`).
- **GitHub → Shopify auto-sync** is live on `main` of `drkampes-dawn`. Every push deploys to the unpublished Dawn theme. Treat `git push` as a deploy.

## Landing-page architecture (B2C + B2B)

- **LP elements are snippets, not sections.** Sections in a `.json` template always appear in the Shopify theme editor; snippets never do. The user edits LP content only via code. See `decisions/001-snippets-not-sections.md`.
- **Templates are `.liquid`, not `.json`.** `templates/page.landing.liquid` and `templates/page.landing_b2b.liquid` use `{% layout 'lp' %}` and render LP snippets via `{% render '...' %}`.
- **One snippet, one CSS file, one JS file (optional).** Layout: `snippets/lp-<name>.liquid` + `assets/lp-<name>.css` + `assets/lp-<name>.js` only when interactive behavior is needed.
- **BEM class naming rooted on the section.** `.lp-<name>__<element>--<modifier>`. Styles must not leak across snippets.
- **No shared LP design-system CSS.** Each snippet hard-codes its own colors, sizes, font stacks. See `decisions/002-rem-scaling-dawn-root.md` for the related rem-scaling rule.
- **All editable content is hard-coded in the snippet.** Copy, image URLs, icon choices, discount codes, viewer ranges. Edit via code, not via a theme editor.
- **No `{% schema %}` blocks anywhere in LP elements.** Snippets have no schema.

## Site-wide elements

- **A site-wide element must be rendered in BOTH `layout/theme.liquid` AND `layout/lp.liquid`.** The landing pages use `lp.liquid`, which intentionally drops `header-group` / `footer-group`. Anything hooked only into `theme.liquid` (e.g. after `footer-group`) is silently invisible on every landing page. Cost us a debugging round on the floating WhatsApp button. See `decisions/022-floating-whatsapp-button-sitewide.md`.

## CSS specifics

- **A snippet that emits `stylesheet_tag` while rendered mid-`<body>` injects a `<link>` element into the layout flow.** It's `display:none` so invisible, but it IS a DOM sibling — it sits between the previous element and the snippet's own markup, which defeats adjacent-sibling (`+`) and `:has(+ ...)` CSS selectors that assume the two are neighbours. When you need to style based on what precedes such a snippet, target by content (e.g. `> div:has(> product-form)`), not by adjacency. Surfaced while fighting PDP spacing in `decisions/023`.

- **Multiply all `Nrem` values from Horizon CSS by 1.6 when porting.** Dawn's `lp.liquid` sets `html { font-size: calc(var(--font-body-scale) * 62.5%) }` (10px root). Horizon uses the browser default (16px root). One-liner: `python3 -c "import re; ... re.sub(r'(\\d+(?:\\.\\d+)?)rem', repl, content)"` (canonical version in `patterns/porting-horizon-section.md`).
- **No global CSS.** Never style bare HTML elements unprefixed. Always scope under the section's BEM root.
- **No `!important` to override JS-controlled styles.** If you need it, the architecture is wrong.

## JavaScript specifics

- **No inline `<script>` blocks that execute immediately inside snippets.** Always extract to `assets/lp-<name>.js` and load via `<script src="..." defer></script>` at the bottom of the snippet. Tiny scripts (5–10 lines) are still extracted — consistency beats convenience.
- **No jQuery, no external libs unless explicitly approved.**
- **Variant / product data crosses the Liquid → JS boundary via `<script type="application/json">` blobs**, not via Liquid interpolation inside the JS file. Keeps JS static and CDN-cacheable.
- **DOM hooks via `data-*` attributes.** Selectors like `[data-hps-id="lp"]` and `data-pop-close`. Never rely on auto-generated ids (we hard-code `-lp` suffix everywhere since each LP element is a singleton).

## Cart flow

- **`lp-offerta` cart-add uses direct `fetch('/cart/add.js')` + `window.location` redirect.** It deliberately bypasses Dawn's `<product-form>` Custom Element and `cart-drawer`. UX is "add to cart and immediately checkout", not "drop into drawer". See `decisions/003-cart-flow-bypass-drawer.md`.
- **Discount chain pattern:** `/discount/<bundle_code>?redirect=/checkout?discount=<shipping_code>`. Bundle code applies via `/discount/` redirect, shipping code applies via checkout query. Both are stock Shopify routes.

## Critical paths — do not touch without explicit instruction

| File | Reason |
|---|---|
| `layout/theme.liquid` | Global layout |
| `layout/lp.liquid` | LP layout (already wired) |
| `assets/cart.js` | Cart state management |
| `assets/cart-drawer.js` | Cart drawer |
| `assets/product-form.js` | Acquista handler on regular product pages |
| Anything containing `product-form` Custom Element logic | Same reason |
| `config/settings_schema.json` | Theme settings — LP snippets don't add settings here |
| Checkout templates | Pre-checkout flow is sacrosanct |

## Inter-snippet contracts

- `lp-size-guide` triggers `lp-offerta`'s size-guide popup by simulating a click on `#hps-size-lp`. If `lp-offerta` ever renames or removes that id, `lp-size-guide`'s CTA goes silent. Keep the id stable.

## Documentation discipline

- Architectural decisions land in `.claude/decisions/`. Sequential numbering. Short.
- Hardened rules surface as new entries in `.claude/rules.md`.
- The architecture overview lives in `.claude/architecture/landing-pages.md`.
- User-preference / cross-session memory lives in `~/.claude/projects/-Users-edoardo-main-repos-drkampes-dawn/memory/` (out of the repo).
- CLAUDE.md (in the project root) references this folder up top.
