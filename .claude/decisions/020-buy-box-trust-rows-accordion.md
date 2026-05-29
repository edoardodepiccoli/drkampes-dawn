# 020 — Buy-box home: righe trust comprimibili (accordion Dawn statico)

**Data:** 2026-05-29
**Status:** Active

## Contesto

La PDP custom mostra 3 righe comprimibili native Dawn (`collapsible_tab`: Reso, Garanzia,
Conformi), aggiunte dal cliente via editor in `templates/product.json`
([[018-pdp-selettori-circolari-solo-atc-sticky]]). Richiesta: portare le stesse righe nella
sezione acquista home (`sections/custom-buy-box.liquid`), sotto il pulsante Acquista, riusando
markup e icone native del tema, piu' una 4a riga "Spedizione rapida 1-2 giorni".

## Scelta

Il buy-box e' una sezione custom a contenuto hardcoded ([[004-custom-homepage-sections]],
[[006-custom-buy-box-dawn-native-cart]]), non block-based. Quindi le righe sono **HTML statico**
che replica la struttura del `collapsible_tab` Dawn (`<div class="product__accordion accordion">`
+ `<details>/<summary>` + `.summary__title` con icona + `.accordion__content rte`). Puro
HTML/CSS, nessun JS (il toggle e' nativo di `<details>`).

- Icone **dal tema** via snippet `icon-accordion` (`{% render 'icon-accordion', icon: '...' %}`):
  `return`, `truck`, `shoe`, `clipboard`. Caret via `'icon-caret.svg' | inline_asset_content`.
- Stile: caricato `component-accordion.css` (gia' nel tema) nella sezione; usa i token
  `--color-foreground`/`--font-heading-scale`, quindi si adatta al color scheme del buy-box.
- Spaziatura: unica regola scoped `.custom-buy-box__accordions { margin-top: 1.6rem }` in
  `custom-buy-box.css` per staccare dall'ATC.
- Ordine **rischio-first**: Reso → Spedizione → Garanzia → Conformi.
- Contenuti: copy delle 3 righe PDP copiata 1:1; spedizione **solo tempi, niente costo**
  ("Ordini oggi, le ricevi in 1-2 giorni lavorativi. Spedizione tracciata.") perche' la policy
  di costo non e' confermata.

## Alternative scartate

- **Blocchi `collapsible_tab` da editor** (come in PDP): il buy-box non e' block-based e segue
  la filosofia hardcoded delle sezioni home. Replica statica = coerente e zero schema nuovo.
- **Accordion custom da zero**: inutile, `<details>` + `component-accordion.css` bastano.

## Conseguenze e limiti noti

- Contenuto hardcoded: si cambia editando il Liquid (non da editor). Se in futuro cambia la copy
  della PDP, va riallineata a mano qui (duplicazione voluta, due contesti diversi).
- "1-2 giorni" e "reso 14 giorni a nostro carico" sono claim: devono restare veri (policy reale).
- Nessun tocco a buy-buttons/product-form/carrello ne' alla logica variante/sticky/popup.

## File

- Modificati: `sections/custom-buy-box.liquid` (load `component-accordion.css` + 4 righe statiche),
  `assets/custom-buy-box.css` (margin scoped).

## Verifica

Home, sotto l'ATC: 4 righe (Reso/Spedizione/Garanzia/Conformi) con icone return/truck/shoe/clipboard,
caret che ruota, apri/chiudi nativo, coerenti con la PDP; mobile + desktop; ATC/selettori/popup
invariati; console pulita.
