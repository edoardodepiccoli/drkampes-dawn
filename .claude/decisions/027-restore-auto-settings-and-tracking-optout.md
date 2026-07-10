# 027 — Ripristinato auto-settings.js e aggiunto toggle tracking opt-out

**Data:** 2026-07-10
**Status:** Active (Supersedes 026)

## Contesto

Richiesto di riportare indietro il meccanismo di auto-apertura del pannello
Impostazioni rimosso in ADR 026, e di risolvere lo "step 2 potenziale" lasciato
aperto da quell'ADR: `data-blocking-mode="auto"` blocca tutti gli script di
tracciamento finché il visitatore non dà consenso esplicito (opt-in), il che
è corretto per GDPR/normativa e-privacy ma impedisce il tracciamento delle
conversioni finché il tasso di consenso non è alto.

## Scelta

**Auto-apertura pannello (ripristino incondizionato):** re-inseriti in
`layout/theme.liquid`, dentro lo stesso blocco `{% unless request.design_mode %}`,
sia il tag `<style>` che nasconde `lb-cookie-banner` (`opacity: 0`) sia il tag
`<script>` che carica `assets/cookie-banner-auto-settings.js` — esattamente come
prima della rimozione in ADR 026. Il file JS non è stato modificato: la versione
su disco include già la reveal-on-click e il failsafe a 15s aggiunti dopo ADR 017,
quindi anche se il selettore per bottone "Impostazioni" non matcha più (stesso
rischio di rottura silenziosa segnalato in ADR 017/026), il banner torna comunque
visibile entro 15s invece di restare invisibile per sempre.

Rischio accettato consapevolmente, senza toggle: la fragilità (match per testo su
shadow DOM di terze parti) è la stessa di prima. Va verificato manualmente sullo
storefront live dopo il deploy (vedi checklist test in coda a questo task).

**Tracking opt-out (nuovo setting):** aggiunto `cookie_tracking_optout`
(`config/settings_schema.json`, gruppo "Cookie consent"), checkbox con
**default `true`**. Controlla `data-blocking-mode` sul loader LegalBlink:
- `true` → `data-blocking-mode="manual"`: LegalBlink blocca solo gli script
  esplicitamente taggati `type="text/plain"` con la classe dedicata. Questo tema
  non tagga nessuno script in questo modo, quindi in pratica **nessun tracciamento
  viene bloccato** — gli script partono per ogni visitatore indipendentemente dal
  consenso.
- `false` → `data-blocking-mode="auto"`: comportamento originale, opt-in, blocco
  finché non c'è consenso.

Il default `true` è una decisione di business esplicita (confermata con l'utente),
non una raccomandazione di LegalBlink/Shopify: normativa GDPR/e-privacy italiana
richiede generalmente consenso preventivo per cookie non essenziali/di
profilazione. Il toggle vive nel theme editor (Impostazioni tema → Cookie
consent), quindi il cliente può tornare a opt-in senza deploy di codice.

## Alternative scartate

- **Gate dell'auto-settings.js dietro un proprio toggle** — scartata: l'utente ha
  scelto esplicitamente il ripristino incondizionato, accettando lo stesso profilo
  di rischio dell'implementazione originale.
- **Rimuovere del tutto `data-blocking-mode`** — non documentato da LegalBlink
  come valore valido; usare `manual` senza script taggati ottiene lo stesso
  effetto pratico (nessun blocco) restando dentro l'API supportata.
- **Default `false` per `cookie_tracking_optout`** — scartata: l'utente ha chiesto
  esplicitamente che l'opt-out sia live subito al deploy, non un'opzione dormiente.

## Conseguenze

- Tocca `layout/theme.liquid` (critical path) e `config/settings_schema.json`
  (critical path) — entrambi toccati su istruzione esplicita dell'utente.
- Stesso rischio di rottura silenziosa di ADR 017/026 per l'auto-apertura, ora
  mitigato solo dal failsafe a 15s del JS, non da un re-check del selettore prima
  del deploy.
- Tracciamento ora attivo di default senza attesa del consenso: trade-off di
  compliance consapevole, da rivalutare se cambiano i requisiti legali del
  negozio.
- Se in futuro serve tornare a opt-in senza toccare codice, basta deselezionare
  "Opt-out tracking mode" in Impostazioni tema.
