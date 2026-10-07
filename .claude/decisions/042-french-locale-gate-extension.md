# 042 — French locale gate extended to buy-box, reviews, WhatsApp CTAs, ambassadors

**Date:** 2026-10-07
**Status:** Active — extends 024

## Context

Audit of French-readiness: `locales/fr.json` is complete, but custom sections gated only on
`iso_code == 'en'` with Italian in `else`, so `/fr` rendered Italian.

## Choice

Same inline gate as 024/025, adding an `is_fr` boolean (built with `if`/`elsif`/`endif`, since
`assign` can't take a comparison) and `{% if is_en %}…{% elsif is_fr %}…{% else %}IT{% endif %}`.
Italian stays the default branch. Applied to:
- `sections/custom-buy-box.liquid` — installment, info buttons, 4 trust accordions, WhatsApp
  message, both dialogs, placeholder.
- `sections/custom-reviews.liquid` — labels + FR translation of all 21 reviews (translated from IT).
- `snippets/whatsapp-info-button.liquid`, `snippets/floating-whatsapp-button.liquid` (the latter
  was ungated Italian, EN included).
- `templates/index.json` ambassadors `custom_liquid_RUa7aM` — heading, subheading, 11 aria-labels.

Also: buy-box option detection now matches translated option names (`couleur`, `taille`,
`pointure`) and swatch fallbacks match `noir`, `marron`, `tête de maure`. Without this, a
translated "Couleur" option would not be detected as the colour option and swatches would vanish.

## Not covered

- Buy-box infographic slides 1-5: need `-fr` images from the client (see 038).
- LP snippets (`lp-*`): hardcoded Italian, ungated.
- Section/block settings stored in JSON (PDP tabs, garanzie descriptions, video feature,
  footer, sticky CTA label): translate in Shopify Translate & Adapt.

## Consequences

- Reviews are translations of real Google reviews; copy changes must be made in 3 branches.
