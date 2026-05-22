# 011 — custom-video-feature: sezione video singola, semplice

**Date:** 2026-05-22
**Status:** Active

## Context

La sezione `custom-video-rows` (3 righe video alternate, [010](010-custom-video-rows.md))
e' stata rimossa perche' non gradita. Serviva una versione **semplice**: una sola
riga, video verticale a sinistra (sopra su mobile) + titolo/descrizione/CTA a
destra, centrati, poco spazio tra i due.

## Choice

Nuova custom section `sections/custom-video-feature.liquid` (+ `.css`), pattern
004/005 (editor-editable):

- **Niente blocks**: un solo contenuto -> settings di sezione flat (`video`,
  `poster`, `heading`, `text`, `button_label`/`button_link`, `color_scheme`).
- **Video**: caricato su Shopify, click-to-play via `<deferred-media>` (componente
  Dawn in `global.js`, gia' globale). Nessun JS proprio. Markup come `video.liquid`.
- **Riquadro ad aspect ratio reale**: `--cvr-ratio` da `video.aspect_ratio`; il
  riquadro e' guidato dall'altezza (`height: min(72vh, 60rem)`, larghezza
  derivata) -> i video verticali restano compatti e non tagliati. Ottimizzata
  per video verticali (il caso d'uso dichiarato).
- **Layout**: desktop riga (video sx, testo dx, centrati verticalmente, gap
  piccolo 2.5rem); mobile colonna (video sopra). Media prima del content nel DOM.
- CSS scoped `.custom-video-feature-section`.

## Consequences

- Sostituisce concettualmente `custom-video-rows` (010, Deprecated) con una
  versione minimale a riga unica.
- Niente JS custom. Blast radius: `custom-video-feature.liquid` + `.css`.
- L'utente posiziona la sezione dall'editor.

## Implementation pointers

- `sections/custom-video-feature.liquid`, `assets/custom-video-feature.css`.
- Riferimento markup `deferred-media`: `sections/video.liquid`.
