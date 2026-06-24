# 026 — Rimosso meccanismo di nascondimento banner cookie

**Data:** 2026-06-24
**Status:** Active (Supersedes 017)

## Contesto

Il banner LegalBlink non appariva su nessun browser (incognito, mobile, desktop).
`cookie-banner-auto-settings.js` cercava il bottone "Impostazioni" nel shadow DOM di
LegalBlink per cliccarci sopra prima di rivelare il banner. LegalBlink ha aggiornato
il proprio markup in silenzio, il click non avveniva più, e `lb-cookie-banner` restava
a `opacity:0` per sempre (il failsafe da 15s non la recuperava).

Risultato: nessun visitatore vedeva il banner → nessuno dava il consenso →
`data-blocking-mode="auto"` teneva i tracking script bloccati → Shopify non contava
sessioni → tasso di conversione a 0%.

## Scelta

Rimossi dal blocco `{% unless request.design_mode %}` in `layout/theme.liquid`:

- Il tag `<style>` che impostava `lb-cookie-banner { opacity: 0 }`
- Il tag `<script>` che caricava `cookie-banner-auto-settings.js`

LegalBlink ora mostra il suo banner di default senza interferenze custom.
Il file `assets/cookie-banner-auto-settings.js` è lasciato nel repo per la storia.

## Alternative scartate

- **Aggiornare il selettore in `cookie-banner-auto-settings.js`** — stesso problema alla
  prossima release di LegalBlink. ADR 017 aveva già segnalato la fragilità intrinseca.
- **Aumentare il timeout del failsafe** — non risolve la causa, maschera solo il sintomo.

## Conseguenze

- Tocca `layout/theme.liquid` (critical path), ma è una rimozione pura: zero logica aggiunta.
- Il banner mostra l'UI default di LegalBlink, non più il pannello Impostazioni immediato.
- Se in futuro si vuole riaprire automaticamente il pannello, bisogna prima verificare che
  il selettore funzioni con la versione corrente di LegalBlink prima di re-introdurre il meccanismo.
- Step 2 potenziale (rimozione `data-blocking-mode="auto"`) resta da valutare dopo aver
  verificato che il banner sia visibile e che i tracking script tornino a funzionare.
