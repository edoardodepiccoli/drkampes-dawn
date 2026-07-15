# 034 — Fast Wear step images re-split from new infographic

**Date:** 2026-07-15
**Status:** Active

## Context

The client supplied a new infographic (`infografica_fast_wear_dito.png`, 941×1672px) showing
the Fast Wear heel-drop sequence as three stacked panels (numbered 1/2/3, same composition as
the original step photos it replaces). The theme's `custom-features-fastwear.liquid` section
does not support one tall image — it renders each step as its own `<img>`
(`fastwear-step-1.jpg` / `-2.jpg` / `-3.jpg`) inside an `<ol>`, per decision referenced in the
section's inline comment (each step needs its own alt/heading pairing and independent
scroll-reveal timing via `data-cascade`).

## Choice

Split the new PNG into three equal horizontal thirds (941×557, 941×557, 941×558) with Pillow,
saved as JPEGs, and overwrote the three existing `assets/fastwear-step-*.jpg` files in place.
Updated the `width`/`height` attributes on each `<img>` in `custom-features-fastwear.liquid`
to match the new crop dimensions (previously 900×414, a different aspect ratio from the old
source photos).

No CSS changes were needed: `.custom-features-fastwear__step-media` uses `object-fit: contain`
with a `max-height` cap on desktop, not a hardcoded `aspect-ratio`, so it accommodates the new
(taller) ratio without layout changes.

## Rejected alternatives

- **Rendering one full-height image and cropping via CSS `object-position` per step** — would
  require three copies of the same asset anyway (one `<img>` per step in the markup) and adds
  CSS complexity for no benefit over splitting the file once at build time.

## Consequences

- If the client supplies another revision of this infographic, re-run the same equal-thirds
  split (see this session's approach: Pillow crop at `h // 3`, `h // 3 * 2`, `h`) rather than
  reintroducing a single tall asset into the markup.
- `width`/`height` on these three `<img>` tags must stay in sync with the source file's actual
  crop dimensions to avoid layout shift; they are not derived automatically.
