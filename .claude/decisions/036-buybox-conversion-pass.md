# 036 — Buy-box home: conversion pass (banner spedizione, chip pagamenti, trust rows statiche, label ATC custom, slide lifestyle)

**Date:** 2026-07-19
**Status:** Active

## Context

Revisione CRO della homepage richiesta dal cliente: piu' elementi interattivi/di fiducia nel
buy box, colori brand per Klarna/PayPal, copy del bottone ATC piu' benefit-driven, dropdown
garanzie da rimuovere o migliorare, gallery da integrare nel buy box.

## Choice

- **Banner spedizione** (`__shipping-banner`): strip evidenziata (arancio brand a bassa
  opacita' + bordo) tra prezzo e selettori. Copy allineato alla LP ("SPEDIZIONE GRATIS 1-2
  GIORNI" in lp-offerta/lp-garanzie): "Spedizione gratis in 1-2 giorni · reso e cambio taglia
  gratuiti". Prima il claim spedizione stava SOLO dentro un accordion chiuso.
- **Chip Klarna/PayPal** (`__pay-badge--klarna/--paypal`): pillole con sfondo nei colori brand
  (Klarna #ffb3c7 + testo nero, PayPal #003087 + testo bianco). Il cliente chiedeva testo
  colorato; bocciato perche' il rosa Klarna su bianco non passa il contrasto — la linea guida
  Klarna stessa e' testo nero su pillola rosa.
- **Trust rows statiche** (`__trust`): i 4 accordion (`product__accordion` + `<details>`)
  sostituiti da una lista sempre visibile icona + claim bold + coda breve (reso, spedizione,
  garanzia 3 anni, S3S). Contenuto nascosto in un `<details>` chiuso non converte.
  `component-accordion.css` non piu' caricata dalla sezione. Icone stroke inline (niente stock
  Dawn fill-based, rules.md). La versione lunga resta in custom-garanzie: ripetizione voluta.
- **Label ATC custom**: nuovo `snippets/custom-buy-buttons.liquid`, clone fedele di
  `buy-buttons` (stessi id/classi/`<product-form>`, product-form.js invariato) con parametro
  `label`. Label: "Acquista Ora"/"Buy Now". Il gancio emozionale richiesto dal cliente
  ("scendi dal camion in un secondo") sta nel microcopy sopra il bottone
  (`__atc-benefit`: "Le infili in 1 secondo. Ai piedi in 48 ore."), non nel bottone: CTA
  lunghe vanno a capo a 375px e diluiscono il verbo. Rami gift-card/dynamic-checkout/pickup
  omessi dal clone (gia' morti nel contesto buy box, chiamato senza block).
- **Slide lifestyle 6-8**: le 3 foto migliori della ex sezione gallery (dsc01880/01813/01889)
  appese in coda al carousel foto (decision 035), URL CDN hardcoded `<img src>` con `?width=`.
  Ordine marketplace-standard: infografiche prima, contesto reale dopo. La sezione
  custom-gallery e' disabilitata in templates/index.json (non eliminata: recuperabile da
  editor).
- **Pulizia JS**: rimosso da custom-buy-box.js il codice morto del vecchio carousel per
  variante (`vgMap`/`slidesEl`/`dotsEl`/`filterGallery`/`renderDots`/`goToSlide`/`setActive`
  + blob JSON `__vg` nel liquid), come anticipato dalle consequences di decision 035. Restano
  `initPhotoCarousel` e la logica varianti/prezzo/sticky/dialog.

## Rejected alternatives

- **Testo Klarna rosa / PayPal blu** — contrasto insufficiente (Klarna) e resa "link blu" (PayPal).
- **Copy lungo dentro il bottone ATC** — wrapping su mobile, verbo diluito.
- **Override della locale string `products.product.add_to_cart`** — avrebbe cambiato ogni ATC
  dello store, non solo il buy box.
- **Merge di custom-garanzie nel buy box** — la ripetizione del claim vicino alla CTA e a
  meta' pagina e' struttura persuasiva corretta, non duplicazione da eliminare.

## Consequences

- `custom-buy-buttons.liquid` e' una copia: se Dawn aggiorna `buy-buttons`, il clone va
  riallineato a mano. Diff di riferimento: solo label + rami omessi.
- Test obbligatorio dopo ogni deploy che tocca questa sezione: flusso add-to-cart completo
  (variante, submit, cart notification/drawer, checkout).
