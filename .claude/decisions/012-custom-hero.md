# 012 — custom-hero: copia della image-banner nativa, mobile alta il doppio

**Date:** 2026-05-22
**Status:** Active

## Context

L'hero della homepage e' una sezione Dawn stock `image-banner` (altezza "large").
Il cliente voleva un hero **identico** ma alto il doppio su mobile. `image-banner`
non permette un'altezza mobile indipendente da quella desktop.

Un primo tentativo (hero riscritto da zero, semplificato) e' stato rifiutato: il
cliente vuole esattamente il codice della sezione nativa.

## Choice

`sections/custom-hero.liquid` = **copia verbatim** di `sections/image-banner.liquid`,
con 4 sole modifiche:

1. Carica anche `assets/custom-hero.css` (oltre a `section-image-banner.css`).
2. Schema `name` -> `"CUSTOM · Hero"`.
3. Schema `class` -> `"section custom-hero-section"` (la classe extra serve allo
   scoping CSS).
4. `presets` -> un preset che porta i valori dell'hero attuale (testi, bottoni,
   settings: overlay 40, height `large`, bottom-center, scheme-4, ecc.).
   L'immagine resta da selezionare in editor (un `image_picker` non puo' avere
   default nel preset).

`assets/custom-hero.css`: unico override — su mobile l'altezza "large" passa da
`39rem` a `78rem` (2x). Regole scoped a `.custom-hero-section`, che alza la
specificita' e vince su `section-image-banner.css`. Desktop invariato (72rem).

Tutto il resto (markup, blocchi `{% style %}`, settings, blocks) e' identico al
nativo: il comportamento e l'aspetto restano quelli di `image-banner`.

## Alternatives rejected

| Alternativa | Perche' scartata |
|---|---|
| Hero riscritto da zero (semplificato) | Non fedele al nativo; rifiutato dal cliente. |
| Override CSS della `image-banner` stock | Regola globale su una sezione core, non scoped. |

## Consequences

- `custom-hero` resta allineata a `image-banner`: se un giorno si aggiorna Dawn,
  vale la pena ri-sincronizzare il markup copiato.
- Il cliente sostituisce l'`image-banner` "hero" con `CUSTOM · Hero` dall'editor
  e seleziona l'immagine `hero_image.jpg`.
- Blast radius: `custom-hero.liquid` + `custom-hero.css`.

## Implementation pointers

- `sections/custom-hero.liquid` (copia di `sections/image-banner.liquid`).
- `assets/custom-hero.css` — override altezza; valori da `section-image-banner.css`
  (`banner--large`: 72rem desktop, 39rem mobile -> 78rem).
