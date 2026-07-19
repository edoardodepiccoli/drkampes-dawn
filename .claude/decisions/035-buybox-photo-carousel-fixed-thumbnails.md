# 035 — Buy-box home: fixed photo carousel with clickable thumbnails, replaces static image

**Date:** 2026-07-19
**Status:** Active

## Context

`custom-buy-box.liquid`'s media column had regressed to a single static `<img>` (hardcoded CDN
URL, `landing_page_PDP.png`) with a `transform: scale(1.3)` zoom and a black fade overlay
(`__media::before`) so the title could overlap the bottom of the image. That was a deliberate
simplification from an earlier variant-color-driven carousel (see decision 006), but the client
wanted a simple carousel back — multiple PDP photos, scrollable, **not** tied to the selected
color/size (unlike the old `variant_gallery`-driven carousel that decision 006 originally
described, whose JS scaffolding — `slidesEl` / `dotsEl` / `filterGallery` — still lives in
`custom-buy-box.js` but is now dead code, guarded by `if (!this.slidesEl) return`).

## Choice

- **Images are hardcoded files in `assets/`**, not product media or metafields: `pdp-1.png`
  through `pdp-5.png` (currently 5 photos, supplied by the client one at a time over this
  session via local Downloads folder paths, copied in with `cp`). Same "hardcoded content in
  the snippet/section" pattern as the rest of the custom homepage sections — no schema setting
  added, per rules.md "only what's used."
- **Markup:** `.custom-buy-box__slides[data-photo-slides]` — a flex row of `.custom-buy-box__slide`
  divs, one `<img class="custom-buy-box__pdp-image">` each, CSS `scroll-snap-type: x mandatory`.
  Below it, `.custom-buy-box__thumbs` — a horizontally-scrollable row of
  `<button data-photo-thumb="N">` wrapping a small `<img class="custom-buy-box__thumb">`.
- **New, independent JS**: `CustomBuyBox.initPhotoCarousel()` in `custom-buy-box.js`. Deliberately
  NOT reusing `filterGallery`/`renderDots`/`goToSlide` (those are wired to `vgMap`, the per-color
  media-id gallery, and assume the JSON variant blob drives slide visibility). The new method:
  thumbnail click → `scrollTo` the matching slide's `offsetLeft`; a `scroll` listener on the
  slides container finds the slide closest to the container's left edge and toggles
  `.is-active` on the matching thumbnail. Both wired via `data-photo-*` attributes, kept
  separate from the `data-slides`/`data-dots` attributes the old (now-dead) carousel code
  expects, so the two systems can't collide if the dead code is ever revived by accident.
- **Removed:** the `scale(1.3)` zoom and the `__media::before` black-fade overlay, along with the
  negative `margin: -5rem` on `.custom-buy-box__title` that existed only to tuck the title into
  that fade. The title now sits with plain `margin: 0` below the thumbnail row — client
  explicitly rejected the overlap/fade look ("i dont want that").
- **Mobile peek**: `.custom-buy-box__slide` is `flex: 0 0 92%` with `2%` side padding on
  `.custom-buy-box__slides` (not 100%), so a sliver of the next photo is visible at rest — a
  deliberate "you can scroll" affordance the client asked for explicitly, then tuned twice
  (94% → 98% → back to 92%) balancing "image feels big" against "hint must stay visible." On
  desktop (`min-width: 750px`) this resets to `flex: 0 0 100%`, no gap/padding — no peek needed
  once the two-column layout gives the image column room.
- **Thumbnails scroll horizontally** (`overflow-x: auto`, hidden scrollbar, same technique as
  `__slides`) rather than wrapping or shrinking further — added once there were too many (5) to
  fit one row at the original `6rem` size. Thumbnail size settled at `8rem` (started at `6rem`,
  bumped once).

## Rejected alternatives

- **Reusing the existing `slidesEl`/`dotsEl`/`filterGallery` carousel machinery** — rejected
  because it's structurally coupled to per-variant color filtering (`vgMap`, `lastColor` diffing
  in `sync()`); repurposing it for a fixed, color-independent photo set would mean stripping out
  or short-circuiting most of its logic, which is more fragile than writing ~25 lines of new,
  independent code.
- **Dots instead of / in addition to thumbnails** — client asked specifically for clickable
  thumbnails as the navigation UI, not dots.

## Consequences

- `custom-buy-box.js` now contains two unrelated carousel implementations: the dead
  `slidesEl`/`dotsEl`/`filterGallery` path (inert, no matching markup) and the live
  `initPhotoCarousel` path. If a future session removes the dead code, only `initPhotoCarousel`
  and its `data-photo-*` markup need to survive.
- Adding a 6th+ photo is a 3-line change (one slide `<div>`, one thumb `<button>`, bump the
  `data-photo-thumb` index) — no CSS/JS changes needed, both are index-driven and iterate over
  `children`.
- The old CDN-hardcoded PDP infographic URL (`landing_page_PDP.png`) is no longer referenced from
  this section (still used elsewhere — the "schede tecniche" dialog links a different CDN PDF,
  unaffected).
