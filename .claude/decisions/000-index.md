# Decision log

Append-only record of non-obvious architectural choices made on this project. New decisions get the next sequential number. Format: short context, choice, alternatives rejected, consequences.

| # | Title | Date | Status |
|---|---|---|---|
| 001 | Snippets, not sections, for LP elements | 2026-05-19 | Active |
| 002 | Rem values from Horizon multiplied by 1.6x for Dawn root | 2026-05-19 | Active |
| 003 | Cart-add bypasses Dawn cart-drawer (fetch + redirect) | 2026-05-19 | Active |
| 004 | Custom homepage sections: editor-reorderable, hardcoded content, CUSTOM prefix | 2026-05-22 | Active |
| 005 | custom-garanzie: block editor-editable (image_picker + richtext) | 2026-05-22 | Active |
| 006 | custom-buy-box: buy box homepage con carrello nativo Dawn | 2026-05-22 | Active |
| 007 | Custom section su collection page + collezione complementare | 2026-05-22 | Active |
| 008 | Smooth scroll sui link ancora, esteso a tutto il sito | 2026-05-22 | Active |
| 009 | custom-gallery: gallery editoriale con parallax | 2026-05-22 | Active |
| 010 | custom-video-rows: righe video + testo alternate | 2026-05-22 | Active |

## Conventions

- Numbered three-digit prefix (`001-…`, `002-…`).
- Filename slugged from the title.
- Short — context, choice, rejected alternatives, consequences. No prose for prose's sake.
- Status: `Active` (in force), `Superseded by NNN` (still in code's history but replaced), `Deprecated` (no longer in code).

When superseding, do not delete — mark old as `Superseded by NNN` and link.
