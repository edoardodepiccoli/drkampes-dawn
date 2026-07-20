# 040 — Buy-box rollback: revert 035/036/038

## Context

Between 2026-07-19 and 2026-07-20 the homepage buy-box (`sections/custom-buy-box.liquid`,
`assets/custom-buy-box.css`, `assets/custom-buy-box.js`) went through three iterations:
a fixed photo carousel with clickable thumbnails (035), a conversion pass adding a
shipping banner / payment chips / static trust rows / custom ATC label via a
`custom-buy-buttons` snippet clone (036), and locale-gated IT/EN infographic slides (038).

Client asked to bring back the buy box as it was before that work.

## Choice

Restored `sections/custom-buy-box.liquid`, `assets/custom-buy-box.css`, and
`assets/custom-buy-box.js` to their state at `0ec306b` (2026-07-09, last commit before 035),
via a new commit (`git checkout <sha> -- <paths>`), not `git revert`. This brings back:

- Static PDP image instead of the carousel.
- Add-to-cart via Dawn's stock `buy-buttons` snippet, not the `custom-buy-buttons` clone.
- Original trust-row accordions (return/shipping/size/care), not the static rows from 036.

Cleanup that followed from the revert:

- Deleted `snippets/custom-buy-buttons.liquid` (only consumer was the reverted section).
- Deleted the `pdp-1..7` (it/en) carousel image assets (only consumer was the reverted section).
- Reset the `CUSTOM · Acquista` block's `color_scheme` setting in `templates/index.json`
  from `scheme-4` back to `""` (the only buy-box-related value 035 changed there).

## Alternatives rejected

- `git revert` of 035/036/038 in sequence: rejected per explicit instruction — the commits
  aren't sequential/adjacent enough to revert cleanly (037/039 touch unrelated homepage
  sections interleaved with the buy-box work), and the client wants a single clean
  restoration commit, not a revert chain in history.

## Consequences

- 035/036/038 are marked `Superseded by 040` in the index, not deleted — the carousel/
  conversion-pass code is still recoverable from history if wanted later.
- 037 (static reviews list) and 039 (homepage section reorder + video WhatsApp CTA) are
  untouched — they don't touch the buy-box files and weren't part of this rollback.
- The ATC microcopy change from 039 ("Scendi dal camion in 1 secondo") lived inside
  `custom-buy-box.liquid` and is gone with the revert to `0ec306b`'s copy ("Le infili in
  1 secondo. Ai piedi in 48 ore.") — flagged here since it wasn't part of the buy-box
  carousel work being rolled back, in case the client wants that copy line re-applied
  on top of the restored section.
