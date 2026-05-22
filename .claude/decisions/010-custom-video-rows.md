# 010 — custom-video-rows: righe video + testo alternate

**Date:** 2026-05-22
**Status:** Deprecated — sezione rimossa su richiesta dell'utente (non gradita).
File `sections/custom-video-rows.liquid` + `assets/custom-video-rows.css` eliminati
e istanza tolta da `templates/index.json`. Decision conservata come storico.

## Context

Serviva una sezione sotto "chi siamo" (ultima sezione homepage): 3 righe, ognuna
video + titolo + descrizione + CTA. Desktop: video sinistra/destra/sinistra
(alternato). Mobile: video sempre sopra il testo.

## Choice

Nuova custom section `sections/custom-video-rows.liquid` (+ `.css`), applicazione
del pattern 004/005 (contenuto editabile via block):

- **Blocks** tipo `row` (`max_blocks: 3`): `video` (Shopify-hosted) + `poster`
  (image_picker opzionale, fallback `video.preview_image`) + `heading` + `text`
  + `button_label`/`button_link`. Settings sezione: `color_scheme`. Preset 3 righe.
- **Video**: caricati su Shopify (scelta utente). Riproduzione **click-to-play**:
  `<deferred-media>` (componente Dawn in `global.js`, gia' globale) con poster +
  `<template>` contenente `{{ video | video_tag: controls:true, muted:false }}`.
  Markup modellato su `sections/video.liquid`. **Nessun JS proprio.**
- **Layout alternato**: classe `--reverse` sulle righe pari
  (`forloop.index | modulo: 2`); desktop `flex-direction: row-reverse`.
- **Mobile**: il media e' prima del content nel DOM -> con `flex-direction:
  column` il video resta sempre sopra il testo, su ogni riga.
- CSS: solo `component-deferred-media.css` (Dawn) + `custom-video-rows.css` scoped.

## Alternatives rejected

| Alternativa | Perche' scartata |
|---|---|
| Setting `video_url` (YouTube/Vimeo) | L'utente ha scelto video caricati su Shopify. |
| Autoplay muto in loop | L'utente ha scelto click-to-play con controlli/audio (video da guardare). |
| JS proprio per il play | `<deferred-media>` di Dawn lo fa gia', ed e' globale. |

## Consequences

- Niente JS custom: play = `deferred-media`, alternanza e stack = CSS.
- L'utente posiziona la sezione sotto "chi siamo" dall'editor; `index.json`
  non si tocca.
- Blast radius: `custom-video-rows.liquid` + `.css`. CSS scoped.

## Implementation pointers

- `sections/custom-video-rows.liquid`, `assets/custom-video-rows.css`.
- Riferimento markup `deferred-media`: `sections/video.liquid`.

## Update — 2026-05-22 (supporto video verticali)

Il riquadro media non e' piu' fisso 16/9: segue l'**aspect ratio reale del video**
(`video.aspect_ratio`, passato come `--cvr-ratio` inline), quindi i video
verticali non vengono tagliati. Riga con `ratio < 1` -> classe
`custom-video-rows__media--portrait`: su desktop il riquadro e' guidato
dall'altezza (`height: min(68vh, 56rem)`, larghezza derivata) e centrato nella
sua meta' colonna; su mobile resta a larghezza piena.
