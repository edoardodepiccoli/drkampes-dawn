# 029 — Banner cookie nascosto permanentemente via CSS, auto-click ritirato

**Data:** 2026-07-10
**Status:** Active (Supersedes 017, 028)

## Contesto

Dopo il secondo fallimento silenzioso dello stesso giorno (ADR 028: label bottone
cambiata da "Impostazioni" a "Settings", markup ricostruito in stile shadcn/ui),
l'utente ha deciso di abbandonare l'approccio "clicca il bottone giusto nel
momento giusto" — intrinsecamente fragile perché dipende da markup di terze parti
fuori dal nostro controllo, segnalato come tale fin da ADR 017 — e ha chiesto
di nascondere il banner in modo permanente, a patto che il tracciamento continui
a funzionare.

Questo è possibile senza compromessi tecnici perché `data-blocking-mode` è già in
modalità `manual` di default (`cookie_tracking_optout = true`, ADR 027): nessuno
script è taggato per il blocco manuale, quindi il tracciamento non dipende in
alcun modo dall'interazione col banner o dal consenso del visitatore.

## Scelta

In `layout/theme.liquid`, sostituito il meccanismo di auto-click con una singola
regola CSS permanente:

```css
lb-cookie-banner { display: none; }
```

Perché `display: none` e non `opacity: 0` (usato in ADR 017/026)? LegalBlink
imposta via JS solo custom properties e `opacity` inline sull'host
(`style="--background: ...; opacity: 1;"`, osservato nel markup reale) — mai
`display`. Una regola su `display` non entra quindi mai in conflitto con quello
che il loro script scrive, e non può essere "ripristinata" da un loro
re-render. Niente `!important` necessario (coerente con `.claude/rules.md`).

Rimossi da `theme.liquid`:
- Il tag `<script src="{{ 'cookie-banner-auto-settings.js' | asset_url }}">`.

Il file `assets/cookie-banner-auto-settings.js` resta nel repo, non referenziato
(stessa scelta fatta in ADR 026 per la cronologia).

Il loader LegalBlink (`loader.js`, `data-license-id`, `data-blocking-mode`,
`data-consent-mode`, `data-tcf-enabled`) resta invariato e continua a caricarsi:
serve comunque per i segnali di Google Consent Mode v2/TCF anche se il banner
non è visibile.

## Alternative scartate

- **Continuare a raffinare il selettore del bottone** — scartata: due rotture
  nello stesso giorno (026, 028) dimostrano che qualunque euristica su markup di
  terze parti è intrinsecamente instabile. Nascondere il banner elimina la
  classe di problema alla radice invece di rincorrerla.
- **`opacity: 0` invece di `display: none`** — scartata: è lo stesso approccio
  che ha causato la rottura di ADR 026 (LegalBlink scrive `opacity` inline via
  JS, quindi può sovrascrivere o essere in conflitto con una regola CSS sulla
  stessa proprietà). `display` è una proprietà che il loro script non tocca mai.

## Conseguenze

- **Nessun visitatore vede più alcun banner cookie o notizia di consenso.**
  Questo va oltre il trade-off di compliance già accettato in ADR 027
  (tracciamento opt-out): ora non c'è più nemmeno l'apparenza di un meccanismo
  di consenso visibile. Decisione di business esplicita dell'utente, presa
  consapevolmente dopo due rotture consecutive del meccanismo precedente.
- `cookie_tracking_optout` deve restare `true` finché il banner resta nascosto:
  se in futuro qualcuno lo imposta a `false` (tornando a `data-blocking-mode="auto"`),
  il tracciamento si blocca per sempre perché non esiste più alcuna UI con cui
  un visitatore possa dare consenso. Stesso identico esito di ADR 026, ma questa
  volta senza bisogno che LegalBlink cambi nulla — basterebbe quel singolo
  flip di impostazione.
- `assets/cookie-banner-auto-settings.js` non è più referenziato da nessun file:
  candidato per una futura pulizia (rimozione fisica), lasciato per ora per
  coerenza con la convenzione "si lascia per la cronologia" di ADR 026.
