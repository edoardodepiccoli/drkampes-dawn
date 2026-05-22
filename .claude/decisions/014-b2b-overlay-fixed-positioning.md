# 014 — B2B quiz overlay: position fixed, niente portal

**Date:** 2026-05-22
**Status:** Active

## Context

Sulla LP B2B, all'apertura del quiz form il dialog appariva (card centrata) ma
la pagina dietro restava chiara: l'overlay scuro non veniva dipinto. Desktop.

Il commit `6e159b4` ("portal B2B quiz modal to body") aveva diagnosticato un
problema di containing-block del `position: fixed` e spostava `#lpQuizModal` su
`<body>` via JS. Non risolveva: `base.css` non mette `transform` / `contain` /
`filter` su `html` / `body` / `.content-for-layout`, quindi il `position: fixed`
del modale risolveva gia' sul viewport. Il portal era un no-op e in piu' rompeva
il selettore fratello `.lp-b2b-quiz-form.is-open ~ .lp-b2b-sticky-cta` (modale e
sticky CTA non piu' fratelli) -> la sticky CTA non si nascondeva all'apertura.

Causa reale: `.lp-b2b-quiz-form__overlay` era `position: absolute`, clippato
dentro il box `overflow: hidden` del modale, con `backdrop-filter`. Questa
combinazione (elemento con `backdrop-filter` clippato da un antenato
`overflow: hidden` posizionato) e' un fallimento di rendering noto: l'elemento
non viene dipinto affatto, sfondo incluso.

## Choice

- `.lp-b2b-quiz-form__overlay` passa da `position: absolute` a `position: fixed`.
  Come layer `fixed` il suo containing block e' il viewport e non e' piu'
  clippato dal `overflow: hidden` del modale: `backdrop-filter` ha un contesto
  pulito e l'elemento viene dipinto. Resta discendente DOM di `.lp-b2b-quiz-form`,
  quindi i selettori `.is-open` e reduced-motion continuano a combaciare; l'ordine
  DOM lo dipinge sotto al dialog.
- Revert del portal in `lp-b2b-quiz-form.js`: era un no-op e rompeva la sticky CTA.

## Alternatives rejected

| Alternativa | Perche' scartata |
|---|---|
| Tenere il portal su `<body>` | No-op per l'overlay; rompe il selettore `~` della sticky CTA. |
| Togliere `backdrop-filter` | Non necessario: con l'overlay `fixed` il blur ha un contesto valido. Se un browser lo rompesse ancora, lo sfondo `rgba(0,0,0,0.78)` da solo basta a oscurare. |

## Consequences

- Gli overlay dei modali full-screen in questo tema vanno `position: fixed`, mai
  `absolute` dentro un contenitore `overflow: hidden` quando portano `backdrop-filter`.
- Su mobile il dialog resta full-screen (100%x100%) per design: l'overlay c'e' ma
  non e' visibile perche' coperto. Nessun cambiamento.
