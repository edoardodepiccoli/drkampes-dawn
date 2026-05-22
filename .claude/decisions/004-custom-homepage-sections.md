# 004 — Custom homepage sections: editor-reorderable, content hardcoded, "CUSTOM" prefix

**Date:** 2026-05-22
**Status:** Active

## Context

The homepage (`templates/index.json`) is a `.json` template built from stock Dawn sections plus two `custom-liquid` blobs (`recensioni` review marquee, `ambassadors`). The `custom-liquid` approach is unstable: CSS/JS is unscoped, no isolation, and `recensioni` leaks global CSS (`html, body { overflow-x: hidden }`). New custom homepage content needs a stable, isolated pattern.

The homepage is the **opposite case** to the landing pages. LP elements are snippets deliberately hidden from the theme editor (see [001](001-snippets-not-sections.md)). The homepage already uses a `.json` template with editor-visible sections, and the client may want to reorder content. So custom homepage content should be real Dawn sections, not LP-style snippets.

The user wants a **hybrid**: sections reorderable/removable from the theme editor UI, but their content (copy, images) hardcoded in the `.liquid` file and edited via code, not via editor settings.

## Choice

Each custom homepage section is a real Dawn section file with a `{% schema %}`:

- **File naming, `custom-` prefix.** `sections/custom-<name>.liquid` + `assets/custom-<name>.css` + `assets/custom-<name>.js` (JS optional). The prefix groups custom work and separates it from Dawn's stock `section-*` / built-in files.
- **`"CUSTOM · "` prefix on schema `name` and preset `name`.** Schema `name` is the editor section-list label; preset `name` is the "Add section" picker label. Prefixing both makes every custom section read as `CUSTOM · <Name>` throughout the editor.
- **`"settings": []` — empty.** No editable content settings. Copy, images, links are hardcoded in the `.liquid`. This is the "hybrid": reorderable, not content-editable.
- **`"presets"` block present.** Makes the section appear in the "Add section" picker, draggable, removable.
- **`"tag"` + `"class"` in schema.** Dawn wraps the section in `<section class="...">`; the class is the stable CSS scoping root.
- **Placement via the theme editor UI**, not by hand-editing `index.json` (auto-generated; manual edits get clobbered when the editor saves).

## Alternatives rejected

| Alternative | Why rejected |
|---|---|
| Keep using `custom-liquid` sections | No isolation. CSS/JS unscoped, global-leak prone (already happening in `recensioni`). No Custom Element. Not stable. |
| LP-style snippets (`{% render %}`, no schema) | Snippets never appear in the editor, so the client cannot reorder them. The homepage explicitly wants reorderability. |
| Full editor-editable sections (content in schema settings) | More schema surface, more for the client to break, violates "only settings actually used" (CLAUDE.md rule 7). Content is small enough to hardcode. |
| Hand-edit `index.json` to place sections | `index.json` is auto-generated; the theme editor overwrites manual edits. CLAUDE.md rule 4 also forbids modifying templates directly. |

## Consequences

- Custom sections are reorderable/removable in the editor but have nothing editable inside — content changes are code commits, deployed via GitHub → Shopify sync.
- Blast radius per section = one `.liquid` + one `.css` (+ optional `.js`). CSS scoped to the schema `class`; cannot leak.
- If a future custom section genuinely needs one editor setting (e.g. a CTA link), add that single setting then — not speculatively (rule 7). The pattern stays "hybrid", not "no settings ever".
- The two existing `custom-liquid` blobs (`recensioni`, `ambassadors`) are now tech debt. Migrating them to this pattern is a separate, later task — it also fixes the `recensioni` global CSS leak.
- A custom **footer** section built this way is homepage-only. It does not replace Dawn's site-wide footer (`sections/footer.liquid` via `footer-group.json` + `theme.liquid`). Replacing the global footer is a separate decision touching a critical path.

## Implementation pointers

- Step-by-step recipe: [`patterns/building-custom-homepage-section.md`](../patterns/building-custom-homepage-section.md).
- Stock homepage sections and the two `custom-liquid` blobs: `templates/index.json`.
