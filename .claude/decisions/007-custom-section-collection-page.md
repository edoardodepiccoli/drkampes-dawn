# 007 — Custom section su collection page + collezione complementare

**Date:** 2026-05-22
**Status:** Active

## Context

`templates/collection.json` e' un unico template condiviso da tutte le collezioni.
Conteneva una sezione stock `featured-collection` fissata alla collezione
`accessori-trucker-shoes`: mostrata quindi su OGNI pagina collezione, accessori
inclusi (accessori sotto accessori — senza senso).

Serve un cross-sell consapevole della collezione corrente. Il pattern "custom
section" ([004](004-custom-homepage-sections.md), [005](005-custom-garanzie-editable-blocks.md))
finora era solo per la homepage.

## Choice

Nuova sezione `sections/custom-related-collection.liquid` (+ `.css`), che estende
il pattern custom section alle **collection page**:

- Naming come 004: file `custom-<name>`, schema `name` `"CUSTOM · Collezione
  complementare"`, `class` per lo scoping CSS, `presets`.
- **`"enabled_on": { "templates": ["collection"] }`** — la sezione e'
  selezionabile/aggiungibile solo sulle collection page, non altrove.
- **Logica interim a 2 vie, hardcoded in Liquid:** pagina `accessori-trucker-shoes`
  -> mostra `trucker-shoes`; ogni altra collezione -> mostra `accessori-trucker-shoes`.
- Guard: se la collezione target manca, e' vuota o coincide con quella corrente,
  la sezione non rende nulla.
- Card prodotto: riuso dello snippet Dawn `card-product` (con `skip_styles` per
  non duplicare la CSS componente).

Il cliente rimuove la `featured-collection` stock e aggiunge `CUSTOM · Collezione
complementare` dall'editor sul template Collezione. `collection.json` non si tocca.

## Alternatives rejected

| Alternativa | Perche' scartata (per ora) |
|---|---|
| Metafield `custom.featured_collection` per-collezione | Soluzione "giusta" e scalabile, ma richiede definizione metafield + valori per collezione. Rimandata: il cliente per ora voleva la regola semplice a 2 vie. Resta l'evoluzione naturale. |
| Un template `collection.<handle>.json` per collezione | Un template da mantenere per ogni collezione, non scala. |
| Tenere la `featured-collection` stock | Non puo' essere consapevole della collezione corrente: un solo valore per tutto il template. |

## Consequences

- Ogni nuova collezione mostrera' gli accessori finche' non si aggiorna la swap
  map o non si passa al sistema per-collezione (metafield).
- La versione per-collezione basata su metafield resta un'evoluzione futura
  pianificata: la sezione andra' modificata per leggere
  `collection.metafields.custom.featured_collection` al posto della swap hardcoded.
- Pattern custom section ora valido anche per collection page (via `enabled_on`).
- Blast radius: `custom-related-collection.liquid` + `.css`. CSS scoped.

## Implementation pointers

- `sections/custom-related-collection.liquid`, `assets/custom-related-collection.css`.
- Handle collezioni: `accessori-trucker-shoes`, `trucker-shoes`.
- Riferimento card: snippet Dawn `card-product`, come `sections/featured-collection.liquid`.
