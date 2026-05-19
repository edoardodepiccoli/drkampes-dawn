# Landing-page architecture

This is the canonical description of how the B2C (`/pages/landing`) and B2B (`/pages/landing-b2b`) landing pages are built in this Dawn theme. Read it before touching any `lp-*` file.

## Goals (in priority order)

1. **Edit only via code.** No LP content is exposed in the Shopify theme editor. Not in the section picker, not in the page sidebar, not as editable settings.
2. **Stability and isolation.** Each LP element is self-contained. Editing one snippet must never break another.
3. **Match Horizon visually + behaviorally.** This is a theme swap, not a redesign. Visual parity with the live Horizon LP is the acceptance bar.

## Layered structure

```
templates/page.landing.liquid          ← orchestrates B2C LP
templates/page.landing_b2b.liquid      ← orchestrates B2B LP

  ↓ uses {% layout 'lp' %}

layout/lp.liquid                       ← head + body shell, no header / footer

  ↓ {% render 'lp-<name>' %} for each element

snippets/lp-navbar.liquid              ← markup
snippets/lp-hero.liquid
snippets/lp-benefits.liquid
snippets/lp-offerta.liquid
snippets/lp-size-guide.liquid
...

  ↓ each snippet loads its own asset(s)

assets/lp-<name>.css                   ← BEM-scoped styles, no leakage
assets/lp-<name>.js                    ← optional, vanilla, no Dawn imports
```

## Why snippets, not sections

Sections referenced in a `.json` template **always** appear in the Shopify theme editor sidebar. There is no `presets`-trick or schema-trick to hide them. The only way to fully eliminate editor exposure is to:

1. Use `.liquid` templates (not `.json`).
2. Render LP elements as `{% render '<snippet>' %}` (not `{% section '<section>' %}`).

Snippets have no `{% schema %}`, no settings, no editor presence. All content lives in the snippet file and is edited by changing the file.

See `decisions/001-snippets-not-sections.md` for the full reasoning and rejected alternatives.

## Why no shared LP design-system CSS

Horizon shipped a `lp-design-system.css` (285 lines of `--lp-*` tokens) used by every `lp-*` section. We deliberately did not port it to Dawn.

Reason: the user's stability mandate. A single shared CSS file means a change to one token can break many sections at once. Per-snippet CSS means a change is local. Each snippet hard-codes its own values.

Trade-off accepted: more duplication, but a clear blast radius.

## How Horizon CSS gets ported

Dawn's `lp.liquid` runs:

```css
html { font-size: calc(var(--font-body-scale) * 62.5%); }
```

That's the classic "10px root" trick — `1rem = 10px` when `--font-body-scale = 1`. Horizon uses the browser default (16px root).

Every `Nrem` value copied from Horizon must be multiplied by 1.6 to render at the same visual size in Dawn. Canonical Python one-liner:

```python
import re
def repl(m):
    n = float(m.group(1)) * 1.6
    return (f"{int(n)}rem" if n == int(n)
            else f"{n:.4f}".rstrip('0').rstrip('.') + 'rem')
re.sub(r'(\d+(?:\.\d+)?)rem', repl, content)
```

Run it after copying the Horizon `{% stylesheet %}` body into `assets/lp-<name>.css`. See `decisions/002-rem-scaling-dawn-root.md` and `patterns/porting-horizon-section.md`.

## How JS gets ported

Horizon embeds JS via `<script>` blocks inside each section, with Liquid interpolations like `var sid = '{{ section.id }}'`. We extract to `assets/lp-<name>.js` and strip Liquid:

- Section.id → fixed string (snippets are singletons; use `'lp'` or the snippet name).
- Section settings → `const CFG = { ... }` at the top of the JS file.
- Variant / product data → emitted by the snippet as `<script type="application/json" id="...">…</script>` blobs and `JSON.parse`d on `DOMContentLoaded`.

This keeps the JS file static and CDN-cacheable. The Liquid → JS handoff happens through DOM (data attributes + JSON blobs), not through Liquid interpolation inside JS.

## Cart integration on `lp-offerta`

The Acquista flow on the landing page deliberately bypasses Dawn's cart machinery:

```
[user clicks main CTA]
  ↓
[gift-tshirt modal opens]
  ↓
[user picks tshirt size, clicks "CONFERMA E VAI AL CHECKOUT"]
  ↓
fetch('/cart/add.js', { items: [shoe, tshirt] })
  ↓ (.then OR .catch — always)
window.location.href =
  '/discount/BUNDLETSHIRT?redirect=' +
  encodeURIComponent('/checkout?discount=SPEDIZIONEGRATIS')
```

No `<product-form>` Custom Element wrap. No cart drawer open. No `cart:updated` event. The user lands on checkout with both items + free-shipping discount applied.

This is **intentional**: the LP is a conversion funnel, the cart-drawer would be a distraction. See `decisions/003-cart-flow-bypass-drawer.md`.

A direct consequence: we never touch Dawn's `product-form.js`, `cart.js`, or `cart-drawer.js`. The Acquista button on regular product pages continues to use Dawn's native flow, untouched.

## Inter-snippet contracts

Snippets are self-contained but a few cross-talk via stable DOM ids:

| Snippet | Talks to | Hook |
|---|---|---|
| `lp-size-guide` | `lp-offerta` | Clicks `#hps-size-lp` to open the size-guide popup hosted inside `lp-offerta` |

When adding new cross-talk, document it here and in `rules.md`.

## Adding a new LP element

See `patterns/porting-horizon-section.md` for the full recipe. Short version:

1. Read the Horizon `sections/<name>.liquid` and the corresponding entry in `horizon/templates/page.landing.json` (for actual settings values).
2. Create `assets/lp-<name>.css` — copy the `{% stylesheet %}` body, run the 1.6x rem rescaler.
3. Create `assets/lp-<name>.js` (only if there's interactive behavior) — copy the `<script>` body, replace Liquid with `const CFG = {…}`, read variant/product data from `<script type="application/json">` blobs.
4. Create `snippets/lp-<name>.liquid` — port the markup, hard-code every `section.settings.X` with the actual value from the JSON, hard-code blocks inline, drop `{% schema %}` and `{% stylesheet %}` and `{% form %}` wrappers, load CSS at top and JS at bottom.
5. Wire into `templates/page.landing.liquid` with `{% render 'lp-<name>' %}`.
6. Push. Test on the unpublished theme. Name the regression checks before stopping.
