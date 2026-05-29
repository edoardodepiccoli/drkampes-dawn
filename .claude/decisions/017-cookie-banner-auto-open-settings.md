# 017 — Apertura automatica del pannello Impostazioni del CMP

**Data:** 2026-05-29
**Status:** Active

## Contesto

Richiesto che, al load del banner cookie LegalBlink, si apra subito il pannello
"Impostazioni Cookie" (tab Consensi/Vendor) invece del banner semplice. LegalBlink
non espone un'opzione dashboard per la vista iniziale, e renderizza tutto in shadow
DOM (`<lb-cookie-banner>`, `shadowrootmode="open"`) con classi offuscate.

## Scelta

Script standalone deferred `assets/cookie-banner-auto-settings.js`, caricato in
`layout/theme.liquid` dentro lo stesso `{% unless request.design_mode %}` del loader
CMP. Un `MutationObserver` aspetta che `<lb-cookie-banner>` e il suo `shadowRoot`
esistano, trova il bottone per testo visibile ("Impostazioni"), lo clicca una volta
sola, poi `disconnect()`. Timeout di sicurezza a 15s.

## Alternative scartate

- **Custom Element** — `lb-cookie-banner` è definito dal loader.js di LegalBlink,
  non possiamo agganciare il loro `connectedCallback`.
- **Selettore CSS sulle classi** — offuscate (`base-ui-_r_8_`), instabili.
- **Dashboard LegalBlink** — nessuna opzione per la vista iniziale.

## Conseguenze

- Fragile per definizione: fora la shadow DOM di terze parti, match per testo
  "Impostazioni". Se LegalBlink cambia markup o label, smette di funzionare in
  silenzio (ma non rompe il CMP). Vedi [[016-legalblink-cmp-skip-design-mode]].
- Non testabile nell'editor (gated dallo stesso `unless`).
- Va verificato sullo storefront reale con sessione senza consenso.
