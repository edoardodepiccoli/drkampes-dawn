# 003 — `lp-offerta` cart-add bypasses Dawn's cart drawer (fetch + redirect)

**Date:** 2026-05-19
**Status:** Active

## Context

The landing-page Acquista flow on Horizon is intentionally not the standard product-page add-to-cart. It is:

```
[user clicks main CTA "PRENOTA ORA LA TUA TAGLIA"]
  ↓
[gift-tshirt modal opens — user picks t-shirt size]
  ↓
[user clicks "CONFERMA E VAI AL CHECKOUT"]
  ↓
fetch('/cart/add.js', { items: [shoe variant, tshirt variant] })
  ↓
window.location.href = '/discount/BUNDLETSHIRT?redirect=/checkout?discount=SPEDIZIONEGRATIS'
```

The user lands on Shopify checkout with both items in the cart and the free-shipping discount visibly applied. No cart drawer, no LP scroll-back, no chance to reconsider.

Dawn ships a `cart-drawer` Custom Element and a `<product-form>` wrapper that, together, intercept normal form submits and open the drawer instead of redirecting to `/cart`. For a regular product page that is the right UX. For the LP it would be the wrong UX — the LP is a single-conversion funnel and the drawer is a distraction.

## Choice

`lp-offerta`'s add-to-cart uses **direct `fetch('/cart/add.js')` followed by `window.location.href = checkoutUrl`** with no involvement from Dawn's cart code:

- No `<product-form>` Custom Element wrap.
- No `<form action="/cart/add">` browser-native submit.
- No event published on Dawn's pub/sub channels (`cartUpdate`, `cartError`).
- No call into `cart-drawer.open()`.

Implementation lives in `assets/lp-offerta.js`. The Liquid wrapper that would normally be `{% form 'product', product %}` is replaced with a plain `<div class="hps__form">`.

## Alternatives rejected

| Alternative | Why rejected |
|---|---|
| Wrap markup in `<product-form>` and let Dawn handle submit | Opens the cart drawer instead of redirecting to checkout. Wrong UX for this LP. Also couples LP to Dawn's cart code, exactly what the user mandate avoids. |
| Use `<form action="/cart/add" method="post">` with no JS | Standard Shopify endpoint, but the response is HTML for `/cart` and Dawn would handle render. Same UX problem as above. Also no way to chain `/discount/<code>` after. |
| Apply discounts as cart-line properties instead of URL redirect | Cart-line properties are visible to the customer in the cart. Discount-via-URL is invisible and auto-applies at checkout. Better UX. |
| Open Dawn cart drawer first, then redirect on a separate CTA | Two-step UX, lower conversion. The whole point is one click → checkout. |

## Consequences

- **Zero risk to Dawn's cart code.** `product-form.js`, `cart.js`, `cart-drawer.js`, `layout/theme.liquid` are not modified. The Acquista button on every regular product page continues to use Dawn's native cart-drawer flow, untouched.
- **No cart-drawer integration on the LP.** If someone adds a `cart drawer trigger` to the LP later, they must do it from scratch — there is no hook.
- **Discount codes are session-bound.** `/discount/BUNDLETSHIRT` sets a session-level discount, then the redirect target `/checkout?discount=SPEDIZIONEGRATIS` applies the shipping discount. If a customer clicks the URL twice or has session expiry mid-flow, behavior is well-defined by Shopify but documented here for context.
- **Quantity is fixed at 1 for the shoe** (no quantity selector on the LP). Multi-quantity orders go through the regular product page.
- **`/cart/add.js` errors are silently ignored — the redirect fires in both `.then` and `.catch`.** Rationale: getting the user to checkout matters more than blocking on an HTTP failure that would already have been transient. Shopify will reject the order at checkout if the variant is unavailable.

## Implementation pointers

- `assets/lp-offerta.js` — top of file: `CFG = { discountCode, bundleDiscountCode, … }`. Cart fetch happens in the `confirmBtn` click handler.
- `snippets/lp-offerta.liquid` — comment block at the form wrapper explains the dropped `{% form %}`.
- `decisions/004-…` (future) — if we ever switch to a different cart UX, supersede this entry rather than mutate it.
