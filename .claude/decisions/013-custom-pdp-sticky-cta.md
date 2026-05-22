# 013 — custom-pdp-sticky-cta: sticky CTA per la PDP

**Date:** 2026-05-22
**Status:** Active

## Context

Serviva, sulla pagina prodotto, lo stesso sticky CTA del buy box homepage: barra
nera in basso, bottone "si, le voglio", scivola su dopo 200px di scroll, si
nasconde quando il punto d'acquisto e' in vista. Deve essere una sezione
aggiungibile/posizionabile da editor sotto la PDP.

## Choice

Nuova custom section standalone `sections/custom-pdp-sticky-cta.liquid`
(+ `.css` + `.js`), pattern 004:

- Sezione aggiungibile da editor (preset, prefisso `CUSTOM ·`). `name`
  `"CUSTOM · CTA prodotto"`. Settings: `button_label` (default "si, le voglio"),
  `color_scheme`.
- Il bottone e' un `<a href="#acquista">` — scroll nativo (smooth gia' attivo).
  L'ancora `#acquista` sulla PDP e' un div vuoto creato a parte dal cliente.
- Custom element `<custom-pdp-sticky-cta>`: barra `fixed` nera che scivola su
  (`is-visible`) se `scrollY > 200` E `#acquista` non e' in viewport
  (`IntersectionObserver` su `#acquista`). Se `#acquista` manca, fallback:
  solo soglia di scroll.
- **Non** tocca `main-product.liquid` (file core/critico): la sezione e'
  indipendente, si posiziona da editor.

Stesso meccanismo dello sticky CTA del buy box ([006](006-custom-buy-box-dawn-native-cart.md),
update sticky CTA), qui come sezione a se' stante invece che incorporata.

## Consequences

- Richiede un div `id="acquista"` nella pagina (creato dal cliente) per il
  comportamento "nascondi quando in vista".
- Blast radius: 3 file nuovi `custom-pdp-sticky-cta.*`. CSS scoped.

## Implementation pointers

- `sections/custom-pdp-sticky-cta.liquid`, `assets/custom-pdp-sticky-cta.css`,
  `assets/custom-pdp-sticky-cta.js`.
