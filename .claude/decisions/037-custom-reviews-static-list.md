# 037 — custom-reviews: lista statica recensioni Google, sostituisce il marquee

**Date:** 2026-07-19
**Status:** Active

## Context

Le recensioni homepage erano un marquee auto-scorrevole dentro un blob `custom-liquid` in
`templates/index.json` (20 recensioni hardcoded, testo troncato a 5 righe, non leggibile in
movimento, nessun link al profilo Google = prova non verificabile). Il cliente ha chiesto una
lista statica con avatar a iniziali, stelle, testo completo e bottone "vedi tutte su Google".

## Choice

- **Nuova sezione vera** `sections/custom-reviews.liquid` + `assets/custom-reviews.css`
  (niente JS), al posto del blob. Il blob (`custom_liquid_CDG7FM`) e l'intro
  (`rich_text_K4RX8T`, il cui heading e' migrato nella sezione) restano in `index.json` ma
  `disabled` — recuperabili da editor, non eliminati.
- **Stesse 20 recensioni bilingui del marquee**, hardcoded. Dati compatti: un `capture` con
  record `nome|testo` separati da `§`, split in loop — evita 20 blocchi di markup duplicato
  per locale. I testi non contengono mai `|` o `§`.
- **Avatar a iniziali** su cerchio colorato (palette 10 colori material, ciclica per indice),
  stesso pattern di `lp-reviews`. Niente foto profilo Google: hotlink instabile e il cliente
  ha scelto le iniziali.
- **Masonry senza JS**: CSS `columns` (1 / 2 a 750px / 3 a 990px) + `break-inside: avoid`.
  Le card hanno altezze molto diverse: columns le impila senza buchi.
- **CTA "Vedi tutte le recensioni su Google"** con chevron in giu' (richiesta esplicita),
  stessa URL di ricerca Google gia' usata da `lp-reviews`
  (`google.com/search?q=Dr+Kampes+Italian+Trucker+Shoes+Recensioni`) — nel progetto non
  esiste una URL corta g.page del profilo; se il cliente la fornisce, sostituirla qui e in
  `lp-reviews`.
- Card bianche con bordo grigio hardcoded (come il vecchio marquee): leggibili a prescindere
  dal color scheme.

## Rejected alternatives

- **CSS grid** per le card — righe ad altezza uniforme = buchi enormi con testi da 1 a 6 righe.
- **Espansore "mostra altre" su mobile** — proposto (20 recensioni ≈ 4-5 schermate), il
  cliente ha scelto la lista completa senza espansore. Richiederebbe JS; ripensarci se il
  bounce mobile sale.
- **Foto profilo reali da Google** — URL avatar Google scadono/cambiano; fallback brutto.

## Consequences

- Aggiornare le recensioni = editare il `capture` in `custom-reviews.liquid` (entrambi i
  locali). Il conteggio/rating (4.9) e' hardcoded nell'header della sezione.
- Il vecchio marquee e' morto ma presente in `index.json`: se si riattiva per errore
  dall'editor compaiono due sezioni recensioni.
