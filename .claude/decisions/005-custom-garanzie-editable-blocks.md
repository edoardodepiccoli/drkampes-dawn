# 005 — custom-garanzie: block editor-editable (image_picker + richtext)

**Date:** 2026-05-22
**Status:** Active

## Context

`CUSTOM · Garanzie` (`sections/custom-garanzie.liquid`) sostituisce la sezione
`garanzie` attuale della homepage — una `multicolumn` stock con 3 colonne
titolo + descrizione. Il cliente vuole, al posto del titolo testuale, un **badge
immagine** e ha chiesto esplicitamente di poter **caricare le immagini dalla UI
Shopify** e di poter **modificare le descrizioni dall'editor**.

[004](004-custom-homepage-sections.md) prescrive `"settings": []` e contenuto
hardcoded per le sezioni custom homepage. Questa richiesta è in tensione con
quella regola.

## Choice

`custom-garanzie` è una sezione custom homepage secondo 004 (prefisso `custom-`,
`name` `CUSTOM · Garanzie`, `class` per lo scoping CSS, `presets`, posizionata
via editor) **ma con contenuto editabile a livello di block**:

- `blocks` di tipo `column`, `max_blocks: 3`.
- Ogni block: `image_picker` (badge) + `richtext` (descrizione).
- `"settings": []` a livello sezione resta vuoto — nessun setting di sezione.
- Le 3 descrizioni attuali sono i default dei block nel `preset`.

Questo invoca l'escape hatch già scritto in 004: *"If a future custom section
genuinely needs one editor setting, add that single setting then."* Qui i setting
sono genuini — il cliente cambia badge e copy senza deploy, esattamente ciò che
faceva con la `multicolumn` stock che questa sezione rimpiazza.

## Alternatives rejected

| Alternativa | Perché scartata |
|---|---|
| Contenuto hardcoded puro (004 alla lettera) | Il cliente ha chiesto esplicitamente immagini e testi editabili da UI. Hardcoded = ogni cambio badge è un commit. |
| Riusare la `multicolumn` stock lasciando il titolo vuoto | Resa "badge" non controllabile: l'immagine multicolumn è larga quanto la colonna, non un badge compatto centrato. Niente prefisso `CUSTOM`. |
| Setting a livello sezione invece che block | I 3 badge sono contenuto ripetuto: i block sono il costrutto Dawn idiomatico (come fa `multicolumn`), riordinabili e con `max_blocks`. |

## Consequences

- 004 resta `Active`. La regola operativa diventa: sezioni custom homepage =
  hybrid di default (`"settings": []`); i setting si aggiungono **case-by-case
  quando genuini**, a livello di block o sezione. `custom-garanzie` è il primo
  caso applicato.
- `templates/index.json` non viene toccato: il cliente aggiunge `CUSTOM · Garanzie`
  e rimuove la vecchia `garanzie` (multicolumn) dall'editor.
- Blast radius: `sections/custom-garanzie.liquid` + `assets/custom-garanzie.css`.
  Nessun JS. CSS scoped sotto `.custom-garanzie-section`.

## Implementation pointers

- `sections/custom-garanzie.liquid`, `assets/custom-garanzie.css`.
- Sezione rimpiazzata: blocco `multicolumn_83pCGA` (`name: "garanzie"`) in
  `templates/index.json`.
