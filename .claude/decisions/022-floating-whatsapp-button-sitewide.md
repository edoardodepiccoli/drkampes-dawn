# 022 — Floating WhatsApp button, site-wide

**Date:** 2026-06-16
**Status:** Active

## Context
Client wanted a floating WhatsApp contact button, bottom-right, on every page of the store, linking to `wa.me/393447703171`.

## Choice
- New snippet `snippets/floating-whatsapp-button.liquid` + scoped CSS `assets/component-floating-button.css`. Snippet loads its own CSS via `stylesheet_tag` (mirrors Dawn component pattern).
- `position: fixed`, `z-index: 900` — deliberately below the cart drawer (1000) and all modals/overlays (8500–9999) so it tucks behind them when open, never on top.
- `env(safe-area-inset-*)` so it clears the iPhone home bar.
- **Rendered in BOTH layouts:** `layout/theme.liquid` (after `footer-group`) AND `layout/lp.liquid` (before `</body>`). `lp.liquid` intentionally drops `footer-group`, so a render hooked only into `theme.liquid` is invisible on every landing page. This is the key gotcha — see rules.md "Site-wide elements".

## Alternatives rejected
- Single render in `theme.liquid` only → misses landing pages (they use `lp.liquid`).
- A section instead of a snippet → would appear in the theme editor; not wanted for a fixed global element.

## Consequences
- The WhatsApp logo SVG is shared via `snippets/icon-whatsapp.liquid` (rendered with a `class` param), reused by this button and the "Chiedi info" CTA (decision 023).
- Any future site-wide fixed element must be added to both layout files.
- Touching `theme.liquid` / `lp.liquid` is normally off-limits; here the change was a single `render` line each, no structural edit.
