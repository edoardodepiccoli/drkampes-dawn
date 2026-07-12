# 031 — custom-hero-v2: nuovo hero homepage, sostituisce custom-hero (012)

**Date:** 2026-07-12
**Status:** Active

## Context

Il cliente ha fornito un nuovo design di riferimento per l'hero della homepage
(mockup tablet): overline, headline su due righe, sottotitolo, lista di 4
feature con icona, due CTA, e una riga trust di 4 badge con icona. Il layout
non ha nulla in comune con `image-banner` (da cui `custom-hero`, decision 012,
e' clonata 1:1) — non e' ottenibile modificando la sezione esistente, serve
una sezione nuova.

## Choice

`sections/custom-hero-v2.liquid` + `assets/custom-hero-v2.css`, nuovi file
(non si sovrascrive `custom-hero.liquid`):

- **File nuovo, non overwrite**: `custom-hero.liquid`/`custom-hero.css`
  (decision 012) restano intatti e inutilizzati dopo lo swap — reversibile
  dall'editor in qualsiasi momento, eliminabili in futuro dopo conferma del
  cliente (non in questo task).
- **Contenuto interamente hardcoded** (`"settings": []`), come da decision 004
  e regola 7 ("solo le impostazioni realmente usate"). Nessun blocco richtext
  editabile — stesso pattern di `custom-garanzie` per contenuto strutturale
  fisso.
- **Color scheme**: riuso di `scheme-4` (gia' usata da `custom-hero` per lo
  stesso hero: sfondo nero, testo bianco, bottone arancione `#fb6e06`) via
  classe hardcoded `color-scheme-4 gradient` sul wrapper — nessuna picker
  `color_scheme`, nessun hex nuovo. Font: `var(--font-heading-family)` /
  `var(--font-body-family)`, come in tutto il tema.
- **Immagine di sfondo**: URL CDN hardcoded in `style="background-image:..."`
  sul wrapper (non e' un `image_picker`, stesso approccio dei badge di
  `custom-garanzie`, decision 025), con overlay scuro via gradient CSS per
  leggibilita' del testo.
- **Icone**: 9 SVG nuovi disegnati a mano (stroke, `currentColor`) —
  `icon-clock`, `icon-shield`, `icon-flag-it` (unico a colori fissi, tricolore
  italiano), `icon-medal`, `icon-users`, `icon-chevron-down` — piu' riuso delle
  icone stock Dawn gia' presenti `icon-truck.svg`, `icon-return.svg`,
  `icon-lock.svg` (non duplicate).
- **Copy**: locale-gated IT/EN/FR con lo stesso pattern inline di decision 024
  (`if request.locale.iso_code == 'en' … elsif == 'fr' … else …`, mai
  `assign x = a == b`). Non esisteva una traduzione precedente per questo copy,
  EN/FR sono state redatte ex novo e vanno confermate dal cliente.
- **CTA**: "Acquista Ora" -> `#acquista` (ancora gia' presente su
  `<custom-buy-box id="acquista">`), "Scopri di più" -> `#intro` (ancora
  esistente) — nessun nuovo anchor introdotto.

## Alternatives rejected

| Alternativa | Perche' scartata |
|---|---|
| Overwrite di `custom-hero.liquid` | Distrugge subito il pattern decision 012; rollback richiederebbe git revert invece di un click editor. |
| Blocchi richtext editabili per headline/sottotitolo | Contenuto va bene hardcoded per ora (scelta esplicita); si puo' aggiungere in futuro se il cliente lo richiede (regola 7). |

## Consequences

- Due sezioni hero coesistono nel progetto (`custom-hero` e `custom-hero-v2`)
  finche' lo swap non avviene dall'editor (fuori scope di questo task —
  richiede sessione admin autenticata).
- Blast radius: `custom-hero-v2.liquid`, `custom-hero-v2.css`, 6 nuovi asset
  icona (`icon-clock`, `icon-shield`, `icon-flag-it`, `icon-medal`,
  `icon-users`, `icon-chevron-down`). Nessun file critico toccato.

## Implementation pointers

- `sections/custom-hero-v2.liquid`
- `assets/custom-hero-v2.css`
- `assets/icon-clock.svg`, `icon-shield.svg`, `icon-flag-it.svg`, `icon-medal.svg`,
  `icon-users.svg`, `icon-chevron-down.svg` (nuovi); `icon-truck.svg`,
  `icon-return.svg`, `icon-lock.svg` (riusati, stock Dawn)

## Update — 2026-07-12

Il primo render (CSS as shipped sopra) risultava completamente nero, sia su
mobile che desktop — la foto hero e' gia' molto scura (fotografia low-key),
e l'overlay uniforme `linear-gradient(180deg, rgba(0,0,0,.55) 0%, .72 55%,
.9 100%)` la appiattiva a nero pieno. Fix, solo CSS (`assets/custom-hero-v2.css`,
nessuna modifica al liquid):

- **Overlay a due layer**: gradient orizzontale (90deg, nero 0.92 sopra il
  testo -> trasparente al 100% sopra la scarpa) per rivelare la foto sul lato
  destro, piu' un gradient verticale leggero (0.1 -> 0.7) solo per leggibilita'
  della trust row in fondo. Sostituisce il singolo overlay verticale uniforme.
- **`background-position: center 45%`** sul layer `__media` — la scarpa nella
  foto occupa circa il 23%-72% dell'altezza; 45% la mantiene in frame sia su
  crop stretti (mobile) che larghi (desktop, dove `cover` scala sulla
  larghezza e ritaglia forte in verticale).
- **Breakpoint feature-grid/CTA-row spostato da 750px a 1100px**: il mockup
  cliente (tablet, ~863px) mostra ancora feature in colonna singola e CTA
  impilate a quella larghezza — il breakpoint 750px le passava a 2 colonne /
  riga troppo presto, disallineato dal riferimento.
- **Trust row: icona sopra testo (non piu' icona-sinistra/testo-destra),
  4 colonne fisse da mobile in su, divider verticali tra le colonne** — il
  mockup mostra questo layout a tutte le larghezze mostrate, non solo da
  tablet in su (prima era 2 colonne su mobile, 4 da 750px).

Verificato renderizzando l'markup/CSS reale (liquid risolto lato IT, icone
SVG inline) in Chrome headless via Playwright a 375px / 834px / 1440px prima
del push — non e' stato possibile un preview Shopify live nella sessione.
