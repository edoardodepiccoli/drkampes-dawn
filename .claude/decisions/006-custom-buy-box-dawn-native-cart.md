# 006 — custom-buy-box: buy box homepage con carrello nativo Dawn

**Date:** 2026-05-22
**Status:** Active

## Context

La homepage usava una sezione Dawn stock `featured-product` ("sezione acquista")
come blocco d'acquisto. Il cliente ha chiesto un "buy box" custom modellato sulla
LP B2C (`snippets/lp-offerta.liquid`) — titolo, recensioni, prezzo, riga
Klarna/PayPal, selettore colore, selettore taglia, avviso disponibilita', add to
cart — ma **piu sobrio e allineato allo stile Dawn**.

`lp-offerta` non e' riusabile cosi' com'e': e' uno snippet LP, fuori dall'editor
([001](001-snippets-not-sections.md)), e bypassa il carrello con fetch + redirect
a checkout ([003](003-cart-flow-bypass-drawer.md)) — comportamento da funnel di
conversione, non adatto a una sezione homepage che deve sembrare nativa.

## Choice

Nuova sezione custom homepage `sections/custom-buy-box.liquid` (+ `.css` + `.js`),
secondo [004](004-custom-homepage-sections.md) per naming e prefisso `CUSTOM ·`,
con due scelte specifiche:

- **Carrello nativo Dawn, non il bypass LP.** L'add to cart usa `<product-form>`
  + `{% form 'product' %}` (struttura minima copiata da `snippets/buy-buttons.liquid`)
  e il cart drawer del tema. `product-form.js` viene caricato dalla sezione
  (e' guarded con `if (!customElements.get('product-form'))`, doppio load sicuro)
  e usato **senza modifiche**. Questo e' l'opposto di decision 003: contesto
  diverso (homepage nativa vs LP funnel).
- **Settings di sezione genuine.** `product` (product picker), `color_scheme`,
  `reviews_text`, `stock_label`. Estende la regola case-by-case di
  [005](005-custom-garanzie-editable-blocks.md) ai setting a livello sezione
  (non solo block). Tutte usate (rule 7).
- **Selettori variante custom, JS proprio.** Colore = swatch, taglia = pill,
  rilevati per nome opzione (come `lp-offerta`). Il custom element
  `<custom-buy-box>` aggiorna prezzo/rata/disponibilita'/immagine e scrive
  `input[name=id]`; il submit lo gestisce `product-form.js`.

`decision 002` (×1.6 rem) non si applica: CSS scritto direttamente per il root
10px di Dawn, non e' un port da Horizon.

## Alternatives rejected

| Alternativa | Perche' scartata |
|---|---|
| Tenere la `featured-product` stock | Il cliente voleva un buy box su misura (recensioni fake, riga Klarna, avviso stock) non coperto dai block stock. |
| Bypass carrello LP (fetch + redirect) | Comportamento da funnel. La homepage deve usare il carrello nativo (cart drawer), coerente col resto del tema. |
| Renderizzare gli snippet Dawn `product-variant-picker` / `buy-buttons` | Il variant picker Dawn dipende dalla macchina `<product-info>`/`<variant-selects>` (re-render di sezione); fuori da `featured-product` non funziona standalone. Solo la struttura `<product-form>` e' stata copiata. |

## Consequences

- L'add to cart e' a rischio path critico (CLAUDE.md). Mitigazione: `<product-form>`
  e `product-form.js` usati come da contratto, senza modifiche; classi
  `product-form__*` mantenute per la gestione errori/loading.
- Il cliente sostituisce la vecchia `featured-product` "sezione acquista" con
  `CUSTOM · Acquista` dall'editor. `templates/index.json` non viene toccato.
- La selezione variante e' gestita da JS custom, non da `product-info.js` di Dawn:
  niente aggiornamento URL variante, niente re-render di sezione. Accettato — la
  sezione e' un buy box autonomo in homepage.
- Blast radius: `custom-buy-box.liquid` + `.css` + `.js`. CSS scoped
  `.custom-buy-box-section`.

## Implementation pointers

- `sections/custom-buy-box.liquid`, `assets/custom-buy-box.css`, `assets/custom-buy-box.js`.
- Riferimento struttura `<product-form>`: `snippets/buy-buttons.liquid`.
- Riferimento logica selezione variante: `assets/lp-offerta.js`.

## Update — 2026-05-22

Carousel immagini rifinito: dots su mobile (suggeriscono lo scroll), thumbnail
desktop su una riga scrollabile, e **filtro galleria per colore** via il metafield
`variant.metafields.custom.variant_gallery` (stesso meccanismo di `lp-offerta`,
righe 33-54). Scegliendo un colore il carousel mostra solo le immagini di quella
galleria. La sezione dipende ora da quel metafield per il comportamento ottimale,
ma degrada con grazia: variante senza `variant_gallery` -> mostra tutte le immagini.

## Update — 2026-05-22 (salto scroll all'add to cart)

L'add to cart faceva saltare la pagina in cima. Causa: la sezione `recensioni`
(`custom_liquid` in `index.json`) inietta `html, body { overflow-x: hidden }`,
che forza `overflow-y: auto` su `<body>` rendendolo uno scroll container; quando
il cart drawer apre, Dawn mette `overflow:hidden` sul body e fa `.focus()` su
`.drawer__inner` (tabindex -1) -> la pagina salta. E' il leak CSS gia' segnalato
come tech debt in [004](004-custom-homepage-sections.md).

Workaround: `custom-buy-box.js` riancora lo scroll per ~800ms al submit del form
(`pinScroll`), senza toccare `index.json` / `cart-drawer.js` / `product-form.js`.
Il fix di radice (togliere `body` da quella regola nella sezione `recensioni`)
resta un task separato: risolverebbe lo stesso salto anche aprendo il carrello
dall'icona header.

## Update — 2026-05-22 (carrello: da `<product-form>` a fetch self-contained)

Il vero problema non era uno scroll ma un **reload**: il `<product-form>` non
intercettava il submit, quindi il form faceva un submit nativo (`POST /cart/add`
-> redirect -> ricaricamento pagina). Il `pinScroll` della nota precedente era
inutile per un reload ed e' stato rimosso.

Scelta rivista: **niente `<form>` / `<product-form>`**. Il bottone e'
`type="button"` e `custom-buy-box.js` gestisce l'add to cart con
`fetch('/cart/add.js')` + Section Rendering API, poi apre il popup nativo Dawn via
`cart-notification.renderContents()` (`cart_type` del tema = `notification`).
Niente form = nessun submit nativo = reload impossibile. Stile vicino a
[003](003-cart-flow-bypass-drawer.md), ma apre il popup invece di redirigere al
checkout. `product-form.js` non e' piu' caricato dalla sezione.

Resta valido il principio di 006: carrello nativo Dawn, nessuna modifica a
`cart.js` / `cart-notification.js` / `product-form.js` — usato solo il loro
contratto pubblico (`getSectionsToRender`, `renderContents`).
