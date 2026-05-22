# Pattern — Building a custom homepage section

Recipe for adding new custom content to the homepage as a stable, isolated Dawn section. See [`decisions/004-custom-homepage-sections.md`](../decisions/004-custom-homepage-sections.md) for the reasoning.

## When to use

You need new content on the homepage (`templates/index.json`) that is not a stock Dawn section. The section must be reorderable/removable from the theme editor, but its content is hardcoded and edited via code.

Not for: landing-page elements (those are snippets — see `patterns/porting-horizon-section.md`). Not for site-wide footer/header changes (those are the footer/header groups via `theme.liquid`, a critical path).

The same recipe also applies to **collection-page** custom sections (added on `templates/collection.json`) — see [`decisions/007-custom-section-collection-page.md`](../decisions/007-custom-section-collection-page.md).

## Naming convention

| Thing | Value |
|---|---|
| Section file | `sections/custom-<name>.liquid` |
| CSS | `assets/custom-<name>.css` |
| JS (optional) | `assets/custom-<name>.js` |
| Schema `name` | `"CUSTOM · <Name>"` |
| Preset `name` | `"CUSTOM · <Name>"` |
| Schema `class` | `custom-<name>-section` |

The `custom-` file prefix groups custom work apart from Dawn's stock `section-*` files. The `CUSTOM · ` prefix on schema `name` and preset `name` makes the section read as `CUSTOM` in the editor section list and the "Add section" picker.

## Step 1 — Create the section file

`sections/custom-<name>.liquid`. Structure:

```liquid
{{ 'custom-<name>.css' | asset_url | stylesheet_tag }}

<div class="custom-<name>">
  {%- comment -%} hardcoded markup + content here {%- endcomment -%}
</div>

{%- comment -%} only if interactive: {%- endcomment -%}
<script src="{{ 'custom-<name>.js' | asset_url }}" defer></script>

{% schema %}
{
  "name": "CUSTOM · <Name>",
  "tag": "section",
  "class": "custom-<name>-section",
  "settings": [],
  "presets": [
    { "name": "CUSTOM · <Name>" }
  ]
}
{% endschema %}
```

- `"settings": []` — empty. Content is hardcoded in the markup. If one setting later proves genuinely needed (e.g. a CTA link), add only that one (CLAUDE.md rule 7).
- `"presets"` present — required for the section to show in the "Add section" picker and be reorderable.
- `"tag": "section"` + `"class"` — Dawn renders `<section class="custom-<name>-section ...">`. That class is the CSS scoping root.

## Step 2 — Scoped CSS

`assets/custom-<name>.css`. Every rule prefixed with the scoping root:

- Singleton section (e.g. a footer): prefix with `.custom-<name>-section` (the schema `class`).
- Section that could appear more than once: prefix with `#shopify-section-{{ section.id }}` instead — but `{{ section.id }}` is Liquid, so for that case put the `<style>` inline in the section file or pass the id via a data attribute. Most custom sections are singletons; the class is enough.

Never style bare `html` / `body` / `button`. No global rules. No `!important` to patch JS-controlled styles.

## Step 3 — JS (only if interactive)

Skip if the section is static. Otherwise `assets/custom-<name>.js`:

- Wrap logic in a Custom Element (`class extends HTMLElement` + `customElements.define`). Dawn pattern.
- Load via `<script src="..." defer></script>` at the bottom of the section file. No immediate inline `<script>`.
- Vanilla JS only. No jQuery, no external libs.

## Step 4 — Place it on the homepage

Theme editor → open the homepage → "Add section" → pick `CUSTOM · <Name>` → drag to position.

Do **not** hand-edit `templates/index.json`. It is auto-generated; the editor overwrites manual edits.

## Step 5 — Push and test

`git push origin main`. GitHub → Shopify sync deploys to the unpublished theme.

Manual checks (always):

- [ ] Section renders in correct position on the homepage (unpublished theme preview)
- [ ] Section appears in the editor as `CUSTOM · <Name>`, is draggable and removable
- [ ] CSS does not leak — inspect `html`/`body`/other sections for unexpected changes
- [ ] Mobile viewport (375px) and desktop (≥1100px)
- [ ] No console errors on the homepage
- [ ] Acquista button on a regular product page still works (regression check — never skip)
- [ ] The homepage `featured-product` section (the homepage Acquista) is untouched

## Common gotchas

- **Section missing from the picker entirely (not even by name)** — the schema `name` exceeds Shopify's **25-character limit**, so the whole schema is rejected. Keep schema `name` AND preset `name` ≤ 25 chars. The `CUSTOM · ` prefix is 9 chars, leaving 16. (Bit us on `custom-related-collection`: `"CUSTOM · Collezione complementare"` = 33 chars → invisible.)
- **Section not in the "Add section" picker** — missing `"presets"` block. Presets are what register a section as addable.
- **Reads as the wrong name in the editor** — the `name` in `index.json` (instance name) overrides the schema `name`. The schema `name` and preset `name` control the picker and default label; an instance renamed in the editor keeps its own name.
- **CSS leaks into other sections** — a rule wasn't prefixed with the scoping root, or it targets a bare element. Re-audit every selector.
- **Custom footer does not replace Dawn's footer** — a `CUSTOM · Footer` section is homepage-only and renders in addition to the site-wide footer. Replacing the global footer means the footer group + `theme.liquid` (critical path) — stop and ask first.
