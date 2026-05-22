# 012 — custom-hero: hero custom, doppia altezza su mobile

**Date:** 2026-05-22
**Status:** Active

## Context

L'hero della homepage e' una sezione Dawn stock `image-banner` (altezza "large").
Il cliente voleva un hero identico nell'aspetto MA alto il doppio su mobile.
`image-banner` non permette un'altezza mobile indipendente da quella desktop.

## Choice

Nuova custom section `sections/custom-hero.liquid` (+ `.css`), pattern 004/005
(contenuto editabile da editor):

- Riproduce l'hero stock: immagine di sfondo `cover` + overlay nero (opacita'
  editabile) + titolo / sottotitolo / 2 bottoni, contenuto in basso al centro.
- Settings: `image`, `overlay_opacity`, `color_scheme`, `heading`, `text`,
  `button_label_1/link_1`, `button_label_2/link_2`. Niente blocks.
- **Altezze**: desktop `min-height: 72rem` (come `image-banner` "large"),
  mobile `min-height: 78rem` = **2x** i `39rem` dell'`image-banner` "large"
  mobile (valori verificati in `section-image-banner.css`).
- Niente JS. Immagine `loading="eager"` + `fetchpriority="high"` (above the fold).

## Alternatives rejected

| Alternativa | Perche' scartata |
|---|---|
| Override CSS dell'`image-banner` stock | Regola globale su una sezione Dawn core; non scoped, fragile. |
| Tenere `image-banner` | Nessun controllo separato dell'altezza mobile. |

## Consequences

- Il cliente sostituisce l'`image-banner` "hero" con `CUSTOM · Hero` dall'editor.
- Blast radius: `custom-hero.liquid` + `.css`. CSS scoped.
- Se l'altezza mobile target cambia, e' un solo valore in `custom-hero.css`.

## Implementation pointers

- `sections/custom-hero.liquid`, `assets/custom-hero.css`.
- Altezze hero stock di riferimento: `assets/section-image-banner.css`
  (`banner--large`: 72rem desktop, 39rem mobile).
