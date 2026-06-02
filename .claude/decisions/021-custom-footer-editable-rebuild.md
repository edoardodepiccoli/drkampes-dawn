# 021 — custom-footer: editor-editable footer rebuild (image + text + linked image)

**Date:** 2026-06-02
**Status:** Active

## Context

The client wanted a simpler, fully editable site-wide footer: an image on top, the
legal/company text below it, then a second image that links to a URL they can set —
all stacked and centered — keeping the payment icons.

A `CUSTOM · Footer` was attempted once before and reverted on visual-quality grounds
(see [004](004-custom-homepage-sections.md) Update — commit `84f1213`). The pattern
itself (hybrid custom section, `CUSTOM ·` prefix, scoped CSS, `enabled_on` footer
group) was confirmed sound; only the rendered result was rejected. This is a fresh
application of that pattern with editor-editable content.

## Choice

New `sections/custom-footer.liquid` + `assets/custom-footer.css`. Follows [004](004-custom-homepage-sections.md)
naming/scoping, with **genuine editor settings** per the [005](005-custom-garanzie-editable-blocks.md)
escape hatch (client edits images, link and text without a deploy):

- `image_top` (`image_picker`), `text` (`richtext`, default = the current footer's
  legal HTML carried verbatim), `image_bottom` (`image_picker`),
  `image_bottom_link` (`url`), `color_scheme` (default `scheme-4`),
  `show_payment` (`checkbox`, default `true`).
- Markup: stacked, centered column — top image → text → bottom image (wrapped in
  `<a>` only when a link is set) → payment icons. Payment icons reuse Dawn's
  `list-payment` markup + `component-list-payment.css`.
- `"enabled_on": { "groups": ["footer"] }` — addable only inside the footer group.
- CSS rooted on `.custom-footer-section`; background/foreground from the
  `color-{scheme}` class. No JS.

**Swap is editor-driven, not JSON-driven.** `sections/footer-group.json` and
`layout/theme.liquid` are NOT edited. The client removes the stock footer and adds
`CUSTOM · Footer` in the theme editor. Until they do, adding it without removing the
stock footer renders both.

## Alternatives rejected

| Alternative | Why rejected |
|---|---|
| Edit `footer-group.json` to swap section type in code | Touches a critical-path / auto-generated file (CLAUDE.md rule 4). Client preferred doing the swap in the editor. |
| Hardcoded content (`"settings": []`, per 004 default) | Client needs to change both images, the link and the text themselves. Settings are genuine — the 005 escape hatch applies. |
| Keep Dawn's stock footer, restyle it | Stock footer is block/feature-heavy (newsletter, localization, policies); client wanted a minimal image/text/image layout. |

## Consequences

- Footer content is now editor-editable; image/link/text changes need no deploy.
- Blast radius = one `.liquid` + one `.css`. Scoped CSS, cannot leak.
- The swap depends on a manual editor step; not reproducible from git alone. If the
  client wants it versioned later, that means editing `footer-group.json` — a
  separate, critical-path decision.
- Reuses the previously-reverted `custom-footer.*` filenames (the old files were
  removed in `84f1213`); this is a clean rebuild, not a revert-of-revert.

## Implementation pointers

- Pattern: [`patterns/building-custom-homepage-section.md`](../patterns/building-custom-homepage-section.md).
- Stock footer reference (text source, payment markup): `sections/footer.liquid`,
  `sections/footer-group.json` (block `text_AGKUFN.subtext`).
