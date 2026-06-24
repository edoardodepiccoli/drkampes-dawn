# 025 — custom-garanzie: badge images locale-gated CDN URLs, image_picker rimosso

**Data:** 2026-06-24
**Status:** Active — supersede parzialmente la 005

## Contesto

Decision 005 aveva reso i badge di `custom-garanzie` editabili dall'editor via
`image_picker` per block. Il client ha ora tre set di icone (IT/EN/FR) come file
statici sul CDN Shopify. Gestire questo con `image_picker` richiederebbe 9 picker
per block (3 colonne × 3 lingue) — ingestibile.

## Scelta

Badge sostituiti con URL CDN hardcoded, selezionati a render-time con lo stesso
gate locale di decision 024 (`request.locale.iso_code`). IT è il ramo `{% else %}`
(default). FR aggiunto come terzo ramo (`elsif`) — la 024 copriva solo EN/IT.

`forloop.index0` usato nel loop dei block per mappare la posizione della colonna
(0 = S3S, 1 = Made in Italy, 2 = Garanzia) all'URL corretto per locale.

`image_picker` rimosso dallo schema block. La `richtext` description rimane
editabile dall'editor (decision 005 resta valida per quella parte).

## Alternative scartate

- **9 image_picker per block (3 per locale):** schema esplosivo, errore umano facile
  (mettere l'icona sbagliata nel picker sbagliato), nessun vantaggio rispetto a
  hardcodare gli URL già fissi sul CDN.
- **Tenere un solo image_picker + logica JS lato client per lo swap:** introduce JS
  per qualcosa che Liquid gestisce server-side, e rompe il principio HTML-first di Dawn.

## Conseguenze

- Le icone non sono più editabili dall'editor: cambiarle richiede un deploy.
- Aggiungere una nuova lingua richiede un nuovo `elsif` nel gate locale.
- Decision 005 è parzialmente superseded: `image_picker` non è più parte della
  sezione, ma il blocco `richtext` per la descrizione resta invariato.
