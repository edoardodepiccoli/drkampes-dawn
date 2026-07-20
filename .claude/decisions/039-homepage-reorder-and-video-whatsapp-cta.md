# 039 — Homepage reorder (ambassadors/video after reviews) + video section WhatsApp CTA restyle

**Date:** 2026-07-20
**Status:** Active

## Context

Client requests: move the ambassador section right after reviews, move the video section
right after ambassadors, make the ambassador grid 2 columns on mobile with the 11th card
centered on its own row, change the buy-box ATC benefit microcopy, and restyle the video
section's WhatsApp CTA to match the buy box's WhatsApp button instead of Dawn's default
`button button--primary`.

## Choice

- **Reorder** (`templates/index.json` `order` array): `custom_reviews_hQx3Tn` ->
  `custom_liquid_CDG7FM` (disabled marquee, kept adjacent to its replacement) ->
  `custom_liquid_RUa7aM` (ambassadors) -> `custom_video_feature_DQUpAY` -> `image_with_text_YK7wAE`
  ("chi siamo", pushed to the end since it wasn't part of the requested ordering).
- **Ambassador 2-col mobile**: in the `amb-card` CSS (inline `<style>` inside the
  `custom_liquid_RUa7aM` block), `width` at both the 768px and 480px breakpoints changed to
  `calc(50% - Npx)` (2 columns). The 340px override (previously the only 2-column rule) is
  now redundant and removed. **No JS/markup change needed for centering the 11th card**:
  `.amb-grid` already has `flex-wrap: wrap; justify-content: center`, and CSS flexbox applies
  `justify-content` per flex line — the last (lone) line auto-centers with no extra code.
- **ATC microcopy**: "Le infili in 1 secondo. Ai piedi in 48 ore." -> "Scendi dal camion in 1
  secondo." (EN: "Off the truck in 1 second.") in `custom-buy-box.liquid`.
- **Video section WhatsApp CTA**: replaced the generic `class="custom-video-feature__cta
  button button--primary"` anchor with a **new, section-scoped copy** of the buy box's
  `whatsapp-info-btn` style — new classes `custom-video-feature__whatsapp-btn` /
  `__whatsapp-icon` in `custom-video-feature.css`, values copied 1:1 from
  `component-whatsapp-info-button.css` (white bg, `#25d366` border, `#128c3e` text, green
  fill on hover). Markup renders the shared `icon-whatsapp` snippet (just an inline SVG path,
  not a styling dependency) but does **not** render or edit
  `snippets/whatsapp-info-button.liquid` itself, and does not touch
  `component-whatsapp-info-button.css` — client explicitly asked for an independent copy, not
  a shared/reused component, and not an edit to Dawn's default button classes (those are used
  elsewhere in the theme). Added `target="_blank" rel="noopener noreferrer"` (missing before)
  since the link is a `wa.me` deep link, matching the buy box CTA's behavior.

## Rejected alternatives

- **Rendering `whatsapp-info-button` snippet directly in the video section** — architecturally
  simpler (one snippet, no duplication) but explicitly rejected by the client's "copy it, use
  a new custom one" instruction; also that snippet's default WhatsApp number is the store's
  general line, while this section deep-links to Claudio's personal number via
  `section.settings.button_link` — reusing the snippet without a number override would need
  extra params anyway.
- **Full-width button (`width: 100%`) matching the buy box exactly** — the buy box button
  sits in a narrow single-column form stack; the video section's CTA sits in a wider
  `max-width: 44rem` text column next to a heading/paragraph, so it stays `inline-flex`
  sized to its content instead of stretching edge-to-edge.

## Consequences

- Ambassador card width is now purely percentage-based below 768px; if a photo aspect ratio
  ever changes, `aspect-ratio: 5/6` + `object-fit: cover` on `.amb-photo` still governs crop,
  unaffected by this change.
- `custom-video-feature.css` now duplicates ~25 lines of `component-whatsapp-info-button.css`.
  If the buy box's WhatsApp button style changes, this copy will not follow automatically —
  intentional per the client's request, but worth remembering if a future "make WhatsApp
  buttons consistent site-wide" ask comes in.
