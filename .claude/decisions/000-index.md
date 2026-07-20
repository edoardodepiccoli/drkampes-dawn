# Decision log

Append-only record of non-obvious architectural choices made on this project. New decisions get the next sequential number. Format: short context, choice, alternatives rejected, consequences.

| # | Title | Date | Status |
|---|---|---|---|
| 001 | Snippets, not sections, for LP elements | 2026-05-19 | Active |
| 002 | Rem values from Horizon multiplied by 1.6x for Dawn root | 2026-05-19 | Active |
| 003 | Cart-add bypasses Dawn cart-drawer (fetch + redirect) | 2026-05-19 | Active |
| 004 | Custom homepage sections: editor-reorderable, hardcoded content, CUSTOM prefix | 2026-05-22 | Active |
| 005 | custom-garanzie: block editor-editable (image_picker + richtext) | 2026-05-22 | Superseded by 025 |
| 006 | custom-buy-box: buy box homepage con carrello nativo Dawn | 2026-05-22 | Active |
| 007 | Custom section su collection page + collezione complementare | 2026-05-22 | Active |
| 008 | Smooth scroll sui link ancora, esteso a tutto il sito | 2026-05-22 | Active |
| 009 | custom-gallery: gallery editoriale con parallax | 2026-05-22 | Active |
| 010 | custom-video-rows: righe video + testo alternate | 2026-05-22 | Deprecated |
| 011 | custom-video-feature: sezione video singola, semplice | 2026-05-22 | Active |
| 012 | custom-hero: hero custom, doppia altezza su mobile | 2026-05-22 | Active |
| 013 | custom-pdp-sticky-cta: sticky CTA per la PDP | 2026-05-22 | Deprecated |
| 014 | B2B quiz modal a tutto schermo, niente overlay | 2026-05-22 | Active |
| 015 | custom-product-information: sezione PDP clonata + galleria per variante | 2026-05-22 | Active |
| 016 | LegalBlink CMP non caricato nel theme editor (request.design_mode) | 2026-05-29 | Active |
| 017 | Apertura automatica del pannello Impostazioni del CMP | 2026-05-29 | Superseded by 029 |
| 018 | PDP: selettori circolari, solo ATC, sticky mobile | 2026-05-29 | Active |
| 019 | Buy-box home: popup guida taglie + schede tecniche (<dialog> nativo) | 2026-05-29 | Active |
| 020 | Buy-box home: righe trust comprimibili (accordion Dawn statico) | 2026-05-29 | Active |
| 021 | custom-footer: footer editabile (image + text + linked image), swap da editor | 2026-06-02 | Active |
| 022 | Floating WhatsApp button, site-wide (reso in theme.liquid + lp.liquid) | 2026-06-16 | Active |
| 023 | "Chiedi info su WhatsApp" CTA in buy-box + PDP (PDP spacing aperto) | 2026-06-16 | Active |
| 024 | Sezioni custom: traduzione EN via locale gate inline (`request.locale.iso_code`) | 2026-06-17 | Active |
| 025 | custom-garanzie: badge images locale-gated CDN URLs, image_picker rimosso | 2026-06-24 | Active |
| 026 | Rimosso meccanismo di nascondimento banner cookie (opacity:0 + auto-settings.js) | 2026-06-24 | Superseded by 027 |
| 027 | Ripristinato auto-settings.js (incondizionato) + toggle tracking opt-out | 2026-07-10 | Active |
| 028 | Selettore auto-settings.js rotto di nuovo, reso multilingua + strutturale | 2026-07-10 | Superseded by 029 |
| 029 | Banner cookie nascosto permanentemente via CSS, auto-click ritirato | 2026-07-10 | Active |
| 030 | Auto-click "Accept all" per visitatore (consenso fabbricato, confermato) | 2026-07-10 | Active |
| 031 | custom-hero-v2: nuovo hero homepage, sostituisce custom-hero (012) | 2026-07-12 | Active |
| 032 | custom-features-intro: sezione features, parte 1 (immagine derivata in assets/) | 2026-07-13 | Active |
| 034 | custom-features-fastwear: nuove step images, re-split da nuova infografica | 2026-07-15 | Active |
| 035 | custom-buy-box: carousel foto fisso (non variant-dependent) con thumbnail cliccabili, sostituisce immagine statica | 2026-07-19 | Active |
| 036 | custom-buy-box: conversion pass (banner spedizione, chip Klarna/PayPal, trust rows statiche, label ATC custom, slide lifestyle, gallery disabilitata) | 2026-07-19 | Active |
| 037 | custom-reviews: lista statica recensioni Google con avatar a iniziali, sostituisce il marquee | 2026-07-19 | Active |
| 038 | Buy-box carousel: slide 1-5 infografiche locale-gated IT/EN | 2026-07-20 | Active |
| 039 | Homepage reorder (ambassadors/video dopo reviews) + CTA WhatsApp video section restyled | 2026-07-20 | Active |

## Conventions

- Numbered three-digit prefix (`001-…`, `002-…`).
- Filename slugged from the title.
- Short — context, choice, rejected alternatives, consequences. No prose for prose's sake.
- Status: `Active` (in force), `Superseded by NNN` (still in code's history but replaced), `Deprecated` (no longer in code).

When superseding, do not delete — mark old as `Superseded by NNN` and link.
