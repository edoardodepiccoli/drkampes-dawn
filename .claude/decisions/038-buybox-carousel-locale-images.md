# 038 — Buy-box carousel: slide 1-5 infographics locale-gated (IT/EN)

**Date:** 2026-07-20
**Status:** Active

## Context

Slides 1-5 of the buy-box photo carousel (decision 035) are infographics with text baked
into the image (intro, S3S certified, water resistant, warranty, reviews). The client
supplied matching EN versions for all 5, same 1254x1254px sizing as the existing IT-only
files. Slides 6+ (lifestyle + handcrafting photos) have no text and don't need a locale
variant.

## Choice

- **Files renamed** `pdp-N.png` -> `pdp-N-it.png` / `pdp-N-en.png` (N = 1..5). Git recorded
  most as renames since content is byte-identical to what the client re-supplied for IT.
- **Reused the existing `is_en` boolean** already computed at the top of
  `custom-buy-box.liquid` (same pattern as garanzie/reviews: `assign` can't take a
  comparison, so it's built via `if`/`endif`). No new locale-detection logic added.
- **Selection inline in the `src` attribute**: `{% if is_en %}...en.png{% else %}...it.png{% endif %}`,
  once for the slide `<img>` and once for the matching thumbnail `<img>`, for each of the 5
  slides. Kept inline (not a `{%- liquid -%}` capture) to match the terse style already used
  for the other per-slide `<img>` blocks in this section.
- **Slides 6-8 untouched** — dsc01813 (CDN), pdp-6.jpg, pdp-7.jpg keep a single `src`, no
  gate, since those photos carry no text.

## Rejected alternatives

- **3-way IT/EN/FR gate** (like custom-garanzie) — client only supplied EN versions; FR
  storefront falls back to IT like every other ungated homepage copy block. Add an `-fr`
  variant later the same way if the client supplies one.
- **Metafield/product-image driven carousel** — decision 035 already rejected variant/media
  binding for this carousel in favor of hardcoded files; no reason to revisit that for a
  locale swap.

## Consequences

- Adding a 6th text-infographic slide now means supplying both `-it` and `-en` files, not one.
- If the client later wants FR/other locales, replicate the `is_en` `if`/`else` as an
  `if`/`elsif`/`else` chain per slide, same shape as custom-garanzie's badge selection.
