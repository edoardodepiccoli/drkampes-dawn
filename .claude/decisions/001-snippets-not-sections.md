# 001 — Snippets, not sections, for LP elements

**Date:** 2026-05-19
**Status:** Active

## Context

The Dr. Kampes landing pages (B2C + B2B) are migrating from Horizon to Dawn. The user mandate is: **LP elements must not appear anywhere in the Shopify theme editor** — not in the "Add section" picker, not in the page sidebar tree, not as editable settings. Editing happens only via code.

In Shopify, any section referenced from a `.json` template always appears in the editor sidebar when that template is open. There is no `presets` trick, no `enabled_on: { templates: [] }` trick, and no settings-less schema trick that hides it. Empty schemas still show the section in the sidebar — just without anything to edit.

## Choice

- Templates are `.liquid`, not `.json`. (`templates/page.landing.liquid`, `templates/page.landing_b2b.liquid`.)
- LP elements live in `snippets/`, rendered via `{% render 'lp-<name>' %}`.
- Snippets have no `{% schema %}` block, no settings, no blocks, no editor presence at all.
- Editable content (copy, image URLs, discount codes, viewer ranges) is hard-coded in the snippet file or in the associated JS's `CFG` block.

## Alternatives rejected

| Alternative | Why rejected |
|---|---|
| Keep `.json` templates, drop `presets` from each section's schema | Removes from "Add section" picker but section still listed in the page's sidebar. Does not satisfy the user mandate. |
| Keep `.json` templates, give each section an empty schema | Section still listed, just with nothing to edit. Still does not satisfy mandate. Also pollutes the editor visually. |
| Use `enabled_on: { templates: [] }` on each section | Shopify ignores this for sections already wired into a template. Does not solve the problem. |

## Consequences

- Templates lose the Shopify visual editor entirely for LP routes. Acceptable trade — that was the goal.
- No `block`-driven repetition. Adding three trust items means three `<li>` blocks in the snippet file, not three editor blocks. Acceptable — list-like content is small enough to write by hand and the rare reorder is a code edit.
- LP content is now part of the source repo, not part of `settings_data.json`. Commits + GitHub → Shopify sync deploy content changes. Acceptable — same workflow as code.
- Other theme settings (color schemes, typography) still live in the standard Shopify settings. We do not touch `config/settings_schema.json` for LP work.

## Implementation pointers

- `templates/page.landing.liquid` — starts with `{% layout 'lp' %}`, renders LP snippets in order.
- `snippets/lp-<name>.liquid` — markup + content, no schema.
- The previous `sections/lp-placeholder.liquid` was deleted in commit `799466e` along with both `.json` templates.
