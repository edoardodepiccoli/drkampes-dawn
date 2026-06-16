# 023 — "Chiedi info su WhatsApp" CTA in buy-box (home) + PDP

**Date:** 2026-06-16
**Status:** Active

## Context
A secondary CTA below the Acquista button, in the home buy-box and the PDP, opening WhatsApp with a product-specific pre-filled message.

## Choice
- One shared snippet `snippets/whatsapp-info-button.liquid` + scoped CSS `assets/component-whatsapp-info-button.css`. Snippet loads its own CSS via `stylesheet_tag`.
- Params: `message` (plain text, built by each caller), optional `number` (default `393447703171`).
- Link: `https://wa.me/{{ number }}?text={{ message | url_encode }}`. `url_encode` turns newlines into `%0A`, which WhatsApp renders as line breaks — so the captured message keeps its blank lines.
- Message capture is **left-aligned at column 0** inside `{% capture %}` (looks odd amid indented Liquid) so no leading whitespace leaks into the WhatsApp text.
- Rendered after the `buy-buttons` snippet in:
  - `sections/custom-buy-box.liquid` (home) — message uses **hardcoded name** `Dr Kampes Trucker Shoes`, price from `first_variant`, **no product URL** (per client).
  - `sections/custom-product-information.liquid` (PDP) — message uses **dynamic** `product.title`, selected-variant price, and **URL** (`product.url | prepend: request.origin`, same pattern as the existing `share_url` at ~line 480).
- Price/text is static at page load; does not follow variant JS changes (accepted by client).

## Alternatives rejected
- Inlining markup in each section → duplication; the only difference is the message string.
- JS to keep price in sync with variant selection → declined, not worth the moving parts.

## Consequences / OPEN ISSUE
- **PDP vertical spacing between Acquista and the WhatsApp button is unresolved.** Root cause: `.product__info-container > * + *` (section-main-product.css:220) sets `margin: 1.5rem 0` on every direct child, and the snippet's `stylesheet_tag` injects a `<link>` (display:none) into the flow right before the button — which defeats adjacent-sibling (`+`) selectors. Attempted fix in `custom-product-information.css` (`> div:has(> product-form) { margin-bottom: 0 }` + button `margin-top: 0.4rem`) did **not** visibly close the gap in the client's testing. Left as-is on the client's "nevermind". Next session: inspect the live DOM in devtools to confirm the actual box generating the space (could be `.product-form__buttons` padding, sticky-CTA spacer, or stale synced CSS) before trying another selector. See rules.md "stylesheet_tag mid-body".
