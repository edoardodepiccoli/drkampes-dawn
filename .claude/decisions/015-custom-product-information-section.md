# 015 — custom-product-information: sezione PDP clonata + galleria per variante

**Date:** 2026-05-22
**Status:** Active

## Context

La PDP usava la sezione Dawn stock `main-product`. Il cliente vuole che, sulle
scarpe trucker, scegliendo il colore (Nero / Testa di moro) la galleria mostri
solo le immagini di quella variante. La feature non puo' stare nei file Dawn
stock: i commit "Update from Shopify" li sovrascrivono.

## Choice

Clone completo della sezione prodotto in file `custom-*`, stabili dai sync Shopify:

- `sections/custom-product-information.liquid` — clone fedele di `main-product.liquid`.
  Modifiche: schema `name` `"CUSTOM · Prodotto"`, `class` con
  `custom-product-information-section`, `enabled_on` template `product`, `presets`
  che replica i block di `templates/product.json`. Renderizza gli snippet clonati
  e carica `custom-product-information.js`. Tutto il resto identico (`<product-info>`,
  Acquista, JSON-LD).
- `snippets/custom-product-media-gallery.liquid` e `custom-product-media-modal.liquid`
  — cloni con filtro per variante: dal metafield `custom.variant_gallery` della
  variante selezionata (stesso meccanismo di `custom-buy-box` / `lp-offerta`,
  match per `image.src`) si rende solo quella galleria; variante senza metafield
  -> tutte le immagini (degradazione morbida).
- Filtro fatto in Liquid: Dawn ri-renderizza la sezione via Section Rendering API
  a ogni cambio variante, quindi il filtro si ri-valuta da solo.
- `assets/custom-product-information.js` — Dawn `updateMedia()` sincronizza solo
  il viewer principale, non le thumbnail. Lo script, su `variantChange`,
  ricostruisce la `<ul>` thumbnail dall'HTML ri-renderizzato e riaggancia i click.
- CSS: si riusano `section-main-product.css` + gli stylesheet component di Dawn
  (markup identico). Niente `custom-*.css`: duplicare ~2000 righe sarebbe solo
  debito. Deroga consapevole al pattern building-custom-homepage-section, che vale
  per sezioni nuove, non per cloni di sezioni Dawn gia' stilizzate.

Posizionamento: la sezione si scambia dall'editor (rule 4), `product.json` non
toccato a mano. `main-product.liquid` resta intatto: revert = swap nell'editor.

## Alternatives rejected

| Alternativa | Perche' scartata |
|---|---|
| Modificare `main-product.liquid` / `product-media-gallery.liquid` stock | Sovrascritti dai sync "Update from Shopify". |
| Filtro solo in JS (come `custom-buy-box`) | Il primo paint mostrerebbe tutte le immagini poi filtrate (flash). Liquid filtra lato server. |
| Solo Liquid, niente JS | `updateMedia()` non sincronizza le thumbnail al cambio variante. |
| Editare `product.json` a mano | Auto-generato; lo swap si fa dall'editor (rule 4). |

## Consequences

- La PDP dipende dal metafield `custom.variant_gallery` per il comportamento
  ottimale; degrada a "tutte le immagini" se assente.
- La sezione clonata porta il bottone Acquista (path critico): testare l'add to
  cart dopo lo swap.
- Blast radius: 1 sezione + 2 snippet + 1 JS, tutti `custom-*`. `main-product.liquid`
  e gli snippet Dawn stock restano intatti.

## Vincolo: solo gallery layout "Elencato"

La sezione funziona solo con il gallery layout **"Elencato"** (`gallery_layout:
stacked`, `options__1`). Con `stacked` non c'e' striscia thumbnail ne' slider sul
viewer principale: la galleria e' una sola `<ul>` di immagini impilate che Dawn
`updateMedia()` sincronizza interamente al cambio variante, quindi il filtro per
variante regge end to end. Con `thumbnail` / `thumbnail_slider` / `columns` la
striscia thumbnail e lo slider rompono il filtro.

Lo schema ha gia' `gallery_layout` `default: stacked`: una nuova istanza nasce
corretta. Non cambiare `gallery_layout` dall'editor. `custom-product-information.js`
resta caricato ma con `stacked` non trova thumbnail e fa no-op (innocuo).
