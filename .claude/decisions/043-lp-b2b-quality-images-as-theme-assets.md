# 043 — `lp-b2b-quality`: images shipped as theme assets, not store Files

**Date:** 2026-10-29
**Status:** Active

## Context

New B2B LP section "Oltre la personalizzazione" (`snippets/lp-b2b-quality.liquid`), placed
between `lp-b2b-system` and `lp-b2b-quiz`. The other `lp-b2b-*` snippets load photos with
`file_url`, which needs a manual upload in Admin > Content > Files before the page renders.

## Choice

- Photos and icons live in `assets/lp-b2b-quality-*` and load with `asset_url`, like
  `fastwear-*.jpg` and `features-intro-sole.jpg`. The section deploys with the git push alone.
- Photos re-encoded from the designer's PNGs to JPEG q80 (desktop 1672px, mobile 1000px):
  no webp encoder on the dev machine. Icons and Fastwear logo downscaled PNGs (alpha kept).
  The shoe icon is the designer's animated GIF, unchanged.
- S3S badge reuses the existing CDN file `IT_-_S3S.png` (same one as `custom-garanzie`).
- Desktop layout from 990px, not 750px: under ~990px the wide photo crop leaves no room
  beside the three-line headline, so tablets get the stacked mobile layout capped at 640px.
- Yellow `#FFD21F` instead of the `#E8B82E` gold of the other B2B snippets, to match the
  designer's icons and mockup.

## Alternatives rejected

- `file_url` like the neighbouring snippets: section would render broken images until
  someone uploads the files by hand.
- Text baked into one exported image: not editable, not accessible, blurry on large screens.

## Consequences

- To swap a photo, replace the file in `assets/` keeping the same name and push.
- Copy is Italian only, like the rest of the B2B LP.
