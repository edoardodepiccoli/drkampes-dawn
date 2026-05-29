# 016 — LegalBlink CMP non caricato nel theme editor

**Data:** 2026-05-29
**Status:** Active

## Contesto

Il banner cookie LegalBlink (CMP) è iniettato da uno script esterno in `layout/theme.liquid`
(`app.legalblink.it/.../loader.js`, license `6a060314708d320024331f08`). Lo script renderizza
`<lb-cookie-banner>` in shadow DOM con `z-[1000000000]`, fixed bottom/center. Dentro l'editor
di Shopify il banner copre le sezioni e impedisce di editarle.

## Scelta

Avvolto il blocco `<script>` di LegalBlink in `{% unless request.design_mode %}`.
`request.design_mode` è `true` solo dentro il theme editor, quindi lo script non viene caricato
lì e il banner non appare. Sullo storefront reale il CMP funziona invariato.

## Alternative scartate

- **JS che nasconde il banner dopo il render** — fragile, deve forare shadow DOM di terze parti,
  selettori offuscati (`base-ui-_r_8_`), si rompe a ogni loro update. Combatte il JS esterno
  invece di non caricarlo.
- **Configurazione dashboard LegalBlink** — nessuna opzione per disattivarlo in design mode.

## Conseguenze

- Tocca `layout/theme.liquid` (critical path), ma modifica chirurgica: un solo `unless` attorno
  a uno script che era già lì.
- Il CMP non si testa più dentro l'editor. Per verificarlo va aperto lo storefront vero.
- Se in futuro serve testare il banner in design mode, rimuovere il wrapper.
