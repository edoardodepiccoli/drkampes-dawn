# 018 — PDP: selettori circolari, solo ATC, sticky mobile

**Data:** 2026-05-29
**Status:** Active

## Contesto

Sulla PDP custom ([[015-custom-product-information-section]]), il cliente voleva:
selettori taglia circolari + colore circolare colorato (come la sezione "acquista" home,
[[006-custom-buy-box-dawn-native-cart]]); per gli altri prodotti varianti circolari; per
tutti solo il bottone "Aggiungi al carrello" primary, con una sticky CTA mobile che compare
scrollando giu' quando l'ATC esce dalla viewport.

C'e' **un solo** template prodotto (`templates/product.json`): nessuno split scarpe/altri.
Lo store **non ha** swatch colore Shopify configurati, quindi il picker nativo Dawn
(`picker_type: button`) rende **ogni** opzione come pillola di testo (radio + label).

## Scelta

**Niente fork dello snippet variante, niente JS sulla logica variante.** Solo CSS scoped su
`.custom-product-information-section`, nuovo file `assets/custom-product-information.css`
(caricato in sezione dopo `component-product-variant-picker.css` per ordine di cascata).

1. **Pillole circolari** (taglia + generiche): override geometria su
   `.product-form__input--pill input[type='radio'] + label` (4.4rem, border-radius 50%,
   padding 0). L'invert su `:checked` e lo strikethrough su `.disabled` sono gia' nativi e
   coincidono con gli stati `is-on`/`is-unavailable` del buy-box.
2. **Cerchi colore colorati**: lo store non ha swatch, quindi mappa **fallback hardcoded**
   (scelta utente) replicata via selettori d'attributo a sottostringa case-insensitive
   `input[value*='ner' i]`, `black`, `testa di moro`, `marron`, `brown` -> `--sw` colore,
   cerchio 3.6rem, testo nascosto (`color: transparent; font-size: 0`, resta nel DOM per gli
   screen reader), anello su `:checked`. Le taglie (numeri) non matchano -> restano pillole.
3. **Solo ATC primary**: `show_dynamic_checkout: false` sul blocco buy_buttons attivo
   (`buy_buttons_7jL3Jq` in `product.json`) -> il ternario in `buy-buttons.liquid:77` rende
   il bottone `button--primary` e salta `payment_button`. `show_pickup_availability: false`
   nel render del blocco in sezione -> via il blocco "ritiro in negozio".
4. **Sticky mobile scroll-to-button** (scelta utente: tap = scrolla, non aggiunge): custom
   element `<pdp-sticky-cta>` + `assets/pdp-sticky-cta.js`, pattern mutuato da
   `custom-buy-box.js` (IntersectionObserver sull'ancora `#pdp-buy` + scroll throttled rAF,
   classe `.is-visible` se `scrollY > 200` E ATC fuori viewport). Mobile-only via `matchMedia`
   + `@media (min-width:750px){ display:none }`. Tap = `<a href="#pdp-buy">` (smooth scroll
   globale [[008-sitewide-smooth-scroll]]).

## Alternative scartate

- **Swatch Shopify nativi in admin** (sarebbe la via pulita, cerchi colore senza hardcoded):
  scartata su scelta utente (non si vuole toccare l'admin ora).
- **Fork di `product-variant-picker`/`product-variant-options`** per rendere il colore come
  swatch vuoto: piu' pulito nel markup ma duplica snippet Dawn e mette a rischio variant-change
  + sync gallery. Il CSS-only e' a rischio quasi zero sulla logica.
- **Sticky che aggiunge al carrello** (come prima ipotesi): scartata, l'utente vuole solo lo
  scroll. Evita anche di toccare il product-form.
- Sticky come **sezione editor standalone** ([[013-custom-pdp-sticky-cta]], deprecata): qui e'
  incorporata nella PDP, non riposizionabile da editor.

## Conseguenze e limiti noti

- **Colore fuori mappa resta pillola di testo**: un colore nuovo non presente nei selettori
  (es. "Blu") NON diventa cerchio colorato finche' non lo si aggiunge al CSS. Stesso limite del
  buy-box. Se in futuro si configurano gli swatch Shopify, conviene migrare al picker nativo
  swatch e togliere questa mappa.
- **Match a sottostringa**: `[value*='ner' i]` prende qualsiasi valore che contiene "ner". Per i
  colori prodotto attuali va bene; valori taglia numerici non collidono. Da rivedere se si
  aggiungono valori testuali che contengono quelle sottostringhe per caso.
- **Testo colore nascosto con `font-size: 0`**: hack accettabile, la label resta associata
  all'input (nome accessibile preservato). Niente `visually-hidden` perche' il testo e' dentro
  la stessa label che fa da swatch.
- **Sticky senza target**: se manca `#pdp-buy` (es. prodotto a variante singola che non rende
  il blocco? no, il buy_buttons c'e' sempre), `pdp-sticky-cta.js` esce e la barra resta nascosta
  (CSS). Nessun errore.
- `product.json` modificato a mano: in editor il toggle "Show dynamic checkout buttons" del
  blocco Buy buttons risultera' off, coerente.

## File

- Nuovi: `assets/custom-product-information.css`, `assets/pdp-sticky-cta.js`.
- Modificati: `sections/custom-product-information.liquid`, `templates/product.json`.
- Non toccati (critici): `buy-buttons.liquid`, `product-form.js`, snippet `product-variant-*`,
  logica gallery di `custom-product-information.js`.

## Verifica

Da testare in preview tema (vedi piano): scarpe (taglie+colori), altri prodotti (varianti
circolari), solo ATC primary senza express/pickup, add-to-cart nativo funzionante, sticky
mobile compare/sparisce e scrolla, console pulita.
