# 028 — Selettore auto-settings.js rotto di nuovo, reso multilingua + strutturale

**Data:** 2026-07-10
**Status:** Active

## Contesto

Poche ore dopo il ripristino in ADR 027, l'utente ha segnalato lo stesso sintomo di
ADR 026: il banner appariva dopo troppi secondi (il failsafe da 15s) e il pannello
Impostazioni non si apriva da solo. Markup reale osservato sullo storefront:

```html
<div data-slot="card-footer">
  <button data-slot="button" class="...bg-secondary...">Settings</button>
  <button data-slot="button" class="...bg-primary...">Accept all</button>
</div>
```

LegalBlink ha rifatto il widget (classi in stile shadcn/ui, `data-slot`) e il
bottone non si chiama più "Impostazioni" ma "Settings" (inglese). Il match esatto
`buttons[i].textContent.trim().toLowerCase() === 'impostazioni'` in
`assets/cookie-banner-auto-settings.js` non trovava mai il bottone → stesso
fallimento silenzioso di ADR 026, questa volta assorbito dal failsafe (il banner
torna visibile dopo 15s invece di restare invisibile per sempre, ma l'apertura
automatica del pannello non funziona più).

## Scelta

Riscritto `findSettingsButton()` in `assets/cookie-banner-auto-settings.js` con due
euristiche in cascata invece del match esatto singola-lingua:

1. **Match testo multilingua** — lista di label note ("impostazioni", "settings",
   "preferenze", "preferences", "configuración", "einstellungen", ecc., una per
   ciascuna lingua tra quelle presenti in `locales/*.schema.json`), confronto per
   sottostringa (non uguaglianza esatta) così varianti come "Cookie settings" o
   "Manage preferences" continuano a matchare.
2. **Fallback strutturale** — se nessun testo combacia, sceglie il bottone che
   *non* ha la classe `bg-primary` (il CTA "Accept all"/"Accetta tutto") e ha
   `bg-secondary` (l'azione secondaria "Impostazioni"/"Settings"). Sopravvive a un
   cambio di lingua/label anche se la lista sopra non lo copre, finché LegalBlink
   mantiene la convenzione primario/secondario.

Nessuna modifica al resto del meccanismo (MutationObserver, failsafe 15s, reveal
via opacity) — restano quelli di ADR 017/026/027.

## Alternative scartate

- **Aggiungere solo "settings" alla lista di match esatto** — risolve solo il
  sintomo di oggi, non il pattern: LegalBlink ha già cambiato label due volte.
  Un fallback strutturale copre anche cambi futuri non previsti.
- **Selettore per ordine posizionale fisso (`buttons[0]`)** — scartato: non è
  garantito che "Impostazioni/Settings" sia sempre il primo bottone nel DOM;
  il fallback per classe (`bg-secondary` vs `bg-primary`) è un segnale più
  esplicito dell'intento del bottone.

## Conseguenze

- Riduce ma non elimina la fragilità intrinseca segnalata fin da ADR 017: se
  LegalBlink cambia *anche* la convenzione di stile primario/secondario insieme
  al testo, questo meccanismo torna a fallire silenziosamente (mitigato dal
  failsafe 15s, mai da un errore visibile).
- Nessun toggle è stato aggiunto per disattivare il meccanismo (scelta
  confermata in ADR 027): il rischio resta accettato.
- Va ri-verificato manualmente sullo storefront live dopo il deploy.
