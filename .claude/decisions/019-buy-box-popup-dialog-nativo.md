# 019 — Buy-box home: popup "Guida taglie" + "Schede tecniche" con <dialog> nativo

**Data:** 2026-05-29
**Status:** Active

## Contesto

Il vecchio tema Horizon (`theme-horizon/sections/home-buy-section.liquid`) aveva nella sezione
acquista due bottoni che aprivano due popup: **Guida taglie** (tabella IT ↔ cm soletta) e
**Schede tecniche** (link PDF a certificazioni e schede prodotto per modello). La sezione
acquista Dawn ([[006-custom-buy-box-dawn-native-cart]]) non li aveva. Richiesta: riportarli.

Scelte utente: contenuto **hardcoded** (coerente con [[004-custom-homepage-sections]]), link PDF
**identici** a Horizon (incluso "Testa di Moro" che punta al PDF nero, come nell'originale).

## Scelta

Popup costruiti con **`<dialog>` nativo** invece del pattern Horizon (div + attributo `hidden` +
JS manuale di open/close).

- Markup in `sections/custom-buy-box.liquid`: due bottoni
  `.custom-buy-box__info-btn[data-open-dialog="size|specs"]` tra le taglie e l'ATC; due
  `<dialog class="custom-buy-box__dialog" data-dialog="size|specs">` con contenuto copiato 1:1
  da Horizon (tabella taglie 37-48; gruppi di link PDF), classi rinominate scoped.
- CSS in `assets/custom-buy-box.css` (append), scoped sotto `.custom-buy-box-section`: bottoni
  come `hbs__info-btn`, `<dialog>` reset UA, `::backdrop` scuro, bottom-sheet su mobile /
  centrato 48rem su desktop, righe doc + tabella portate da Horizon. Colori del modale espliciti
  (bianco/grigi) per leggibilita' a prescindere dal color scheme.
- JS in `assets/custom-buy-box.js` (append): metodo `bindDialogs()` chiamato da `bind()`. I
  trigger `[data-open-dialog]` fanno `showModal()` del `<dialog>` con `[data-dialog]` corrispondente;
  chiusura via bottone X, click sul backdrop (`event.target === dialog`) ed ESC nativo. Lock
  scroll body con la classe Dawn `overflow-hidden`, rimossa sull'evento `close` del dialog (copre
  ogni via di chiusura). Logica dentro il custom element `<custom-buy-box>` esistente.

## Alternative scartate

- **Pattern Horizon** (div+`hidden`+JS manuale, overlay con z-index alto): piu' codice, niente
  focus-trap, e l'overlay ad alto z-index puo' confliggere con la sticky CTA (`z-index:5`) e il
  cart drawer. Il `<dialog>` apre nel **top layer** del browser -> nessun conflitto, ESC e
  focus-trap nativi.
- **`ModalDialog`/`details-modal` di Dawn**: piu' macchinosi (spostano il nodo nel body, focus
  trap custom) per due popup statici. Il `<dialog>` nativo basta. (Cfr. overlay B2B
  [[014-b2b-overlay-fixed-positioning]], che usa classList su un fixed: li' serviva un form
  multi-step a tutto schermo.)
- **Contenuto editabile da editor (richtext)**: scartato su scelta utente, contenuto hardcoded.

## Conseguenze e limiti noti

- **Link "Testa di Moro" = PDF nero**: replicato com'era in Horizon (probabile bug originale).
  Da correggere quando si avra' l'URL giusto del PDF Testa di Moro.
- **Contenuto hardcoded**: tabella taglie e link PDF si cambiano editando il Liquid, non da editor.
- **`<dialog>` nativo**: supporto ottimo sui browser moderni; il fallback `typeof d.showModal !==
  'function'` evita errori su browser vecchissimi (il bottone semplicemente non apre nulla).
- Tutto scoped nella sezione: nessun tocco a `buy-buttons`/`product-form`/carrello ne' alla
  logica variante/sticky esistente.

## File

- Modificati: `sections/custom-buy-box.liquid`, `assets/custom-buy-box.css`,
  `assets/custom-buy-box.js`.
- Nessun nuovo asset (css/js della sezione gia' caricati).

## Verifica

Home, sezione acquista: i due bottoni aprono i rispettivi `<dialog>`; chiusura via X/backdrop/ESC;
body bloccato da aperto; nessun conflitto con sticky CTA/cart drawer; mobile sheet dal basso,
desktop centrato; ATC e selettori invariati; console pulita.

## Update — 2026-05-29 (desktop centrato + bottoni stile link)

- **Bug specificita' desktop**: la media query desktop usava `.custom-buy-box__dialog` (0,1,0),
  meno specifica della regola base `.custom-buy-box-section .custom-buy-box__dialog` (0,2,0),
  quindi non si applicava e il modale restava bottom-sheet a tutta larghezza anche su desktop.
  Fix: scopare i selettori della media query con `.custom-buy-box-section`. Ora desktop =
  modale centrato 48rem, mobile = sheet dal basso.
- **Bottoni stile link**: da box grigi (port Horizon `hbs__info-btn`) a stile link
  (`color-foreground`, testo sottolineato, no box) con icona SVG inline a sinistra (righello per
  "Guida taglie", documento per "Schede tecniche"). Markup nel `.liquid`, stile nel `.css`.
