# 002 — Rem values from Horizon multiplied by 1.6x for Dawn root

**Date:** 2026-05-19
**Status:** Active

## Context

When `lp-navbar` and `lp-hero` first shipped to the unpublished Dawn theme, every text size and spacing value rendered roughly 60% smaller than on the live Horizon page, despite using identical `Nrem` values copied verbatim.

Root cause: Dawn's `layout/lp.liquid` sets

```css
html { font-size: calc(var(--font-body-scale) * 62.5%); }
```

This is the classic "10px root" pattern — `1rem = 10px` when `--font-body-scale = 1`, so values like `1.5rem` read intuitively as "15 pixels". Dawn's own components are sized against this 10px root.

Horizon's `html` selector does not override font-size, so it inherits the browser default (16px root). Horizon's `Nrem` values are sized against 16px.

Ratio: `16 / 10 = 1.6`. Horizon's `1rem` (= 16px) needs to become Dawn's `1.6rem` (= 16px at 10px root) for visual parity.

## Choice

When porting CSS from a Horizon section / snippet:

1. Copy the `{% stylesheet %}` body verbatim into `assets/lp-<name>.css`.
2. Run the canonical Python rescaler over the file, multiplying every `Nrem` value by 1.6:

   ```python
   import re
   path = 'assets/lp-<name>.css'
   with open(path) as f:
       content = f.read()
   def repl(m):
       n = float(m.group(1)) * 1.6
       return (f"{int(n)}rem" if n == int(n)
               else f"{n:.4f}".rstrip('0').rstrip('.') + 'rem')
   new = re.sub(r'(\d+(?:\.\d+)?)rem', repl, content)
   with open(path, 'w') as f:
       f.write(new)
   ```

3. Other units (`px`, `em`, unitless line-heights, `vw`, `%`) are untouched.

## Alternatives rejected

| Alternative | Why rejected |
|---|---|
| Override `html { font-size: 100% }` inside each LP CSS file | Would break Dawn's native components used inside `lp.liquid` (cart drawer, color-scheme tokens) since they assume the 10px root. |
| Convert all rem → em on the section root | Em values compound through nested elements, easy to break, requires audit of every nested font-size in the section. Mechanical multiplication is simpler and predictable. |
| Hard-code in `px` instead of `rem` | Loses user-zoom and accessibility scaling. Visual parity yes, accessibility regression no. |
| Tweak Horizon-side first and copy over | Out of scope — we are porting to Dawn, not refactoring Horizon. |

## Consequences

- Every new LP CSS port must run the 1.6x rescaler before committing. Forgetting it produces a visually-correct-on-Horizon, way-too-small-on-Dawn render.
- Manual tweaks after the rescaler are fine (we have already done a few — see `lp-navbar` text-size tuning).
- If Dawn's `--font-body-scale` setting changes from 1.0 to something else via Shopify settings, the effective root font-size changes proportionally. Our scaled values still hold relative proportion. No code change required.

## Implementation pointers

- The rescaler is reproduced in `architecture/landing-pages.md` and `patterns/porting-horizon-section.md`.
- Initial fix shipped in commit `60214c8` (`lp-navbar.css` + `lp-hero.css`).
- Applied preemptively to `lp-benefits.css`, `lp-offerta.css`, `lp-size-guide.css` during their respective ports.
