# 009 — custom-gallery: gallery editoriale con parallax

**Date:** 2026-05-22
**Status:** Active

## Context

Serviva una sezione gallery editoriale: fino a 6 foto scelte da editor, layout a
colonne sfalsate, parallax (colonne che scorrono a velocita' diverse) e reveal
animato. Dawn ha `animations.js` (reveal-on-scroll via IntersectionObserver) ma
**nessun parallax**.

## Choice

Nuova custom section `sections/custom-gallery.liquid` (+ `.css` + `.js`),
applicazione del pattern 004/005 (contenuto editabile via `image_picker`, come
[005](005-custom-garanzie-editable-blocks.md)):

- **Blocks** tipo `photo` (`max_blocks: 6`), ognuno `image_picker` + `text`
  didascalia. Settings sezione: `heading`, `color_scheme`. Preset con 6 block.
- **Layout**: 3 colonne, i block distribuiti a **coppie sequenziali**
  (`forloop.index0 | divided_by: 2`) cosi' su mobile (colonne impilate) l'ordine
  delle foto resta naturale. Colonna centrale sfalsata in basso (desktop).
- **Parallax**: JS custom (`<custom-gallery>` custom element). Dawn non ha
  parallax, quindi tecnica nuova:
  - solo desktop (`matchMedia('(min-width: 750px)')`);
  - scroll throttled con `requestAnimationFrame`;
  - ogni colonna trasla in base al progresso della sezione nel viewport
    (`getBoundingClientRect`) per il suo `data-speed` (col1 drifta in verso
    opposto a col0/col2);
  - drift contenuto, `progress` clampato a [-1, 1].
- **Reveal**: IntersectionObserver. Lo stato nascosto iniziale e' attivato dalla
  classe `is-reveal` aggiunta dal JS al root: **senza JS la gallery resta
  visibile** (nessun `opacity:0` orfano).
- **`prefers-reduced-motion`**: niente parallax e niente reveal.
- Self-contained: nessuna dipendenza da `animations.js` di Dawn.

## Alternatives rejected

| Alternativa | Perche' scartata |
|---|---|
| 6 setting `image_picker` fissi invece dei block | I block sono il costrutto Dawn idiomatico per contenuto ripetuto e danno didascalia per foto in modo pulito (come `custom-garanzie`). |
| Distribuzione colonne interlacciata (`index0 mod 3`) | Su mobile (colonne impilate) avrebbe dato ordine foto 1,4,2,5,3,6. Le coppie sequenziali mantengono l'ordine naturale. |
| CSS multi-column (`column-count`) | Niente elementi-colonna indirizzabili -> impossibile il parallax per colonna. |
| Riuso di `animations.js` di Dawn | Copre solo il reveal, non il parallax; il reveal custom tiene la sezione self-contained. |

## Consequences

- Prima sezione del tema con parallax. Tecnica isolata in `custom-gallery.js`.
- Blast radius: `custom-gallery.liquid` + `.css` + `.js`. CSS scoped.
- Le colonne ricevono `transform` inline dal JS; `will-change: transform` in CSS.

## Implementation pointers

- `sections/custom-gallery.liquid`, `assets/custom-gallery.css`, `assets/custom-gallery.js`.
- Velocita' parallax per colonna: attributo `data-speed` (impostato nel Liquid).
