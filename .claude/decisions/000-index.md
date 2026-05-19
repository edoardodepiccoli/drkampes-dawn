# Decision log

Append-only record of non-obvious architectural choices made on this project. New decisions get the next sequential number. Format: short context, choice, alternatives rejected, consequences.

| # | Title | Date | Status |
|---|---|---|---|
| 001 | Snippets, not sections, for LP elements | 2026-05-19 | Active |
| 002 | Rem values from Horizon multiplied by 1.6x for Dawn root | 2026-05-19 | Active |
| 003 | Cart-add bypasses Dawn cart-drawer (fetch + redirect) | 2026-05-19 | Active |

## Conventions

- Numbered three-digit prefix (`001-…`, `002-…`).
- Filename slugged from the title.
- Short — context, choice, rejected alternatives, consequences. No prose for prose's sake.
- Status: `Active` (in force), `Superseded by NNN` (still in code's history but replaced), `Deprecated` (no longer in code).

When superseding, do not delete — mark old as `Superseded by NNN` and link.
