# 008 — Smooth scroll sui link ancora, esteso a tutto il sito

**Date:** 2026-05-22
**Status:** Active

## Context

Cliccando un link ancora interno (es. `#acquista`, aggiunto al buy box della
homepage) la pagina saltava istantaneamente al target.

Il layout delle landing page (`layout/lp.liquid`) aveva gia'
`html { scroll-behavior: smooth }`, con un commento che diceva esplicitamente
"Scoped to LP layout only — theme.liquid does not opt into this". Quindi le LP
scrollavano morbide, il resto del sito no.

## Choice

Aggiunto `scroll-behavior: smooth` alla regola `html` nel blocco `<style>` inline
di `layout/theme.liquid`, rispecchiando `lp.liquid`. Lo smooth scroll vale ora su
tutto lo storefront.

- Ogni layout porta la propria regola `html`: `theme.liquid` per lo storefront,
  `lp.liquid` per le landing page. Sono indipendenti (la LP usa `{% layout 'lp' %}`).
- Il commento ormai falso in `lp.liquid` ("theme.liquid does not opt into this")
  e' stato corretto.
- Niente wrap in `@media (prefers-reduced-motion)`, per coerenza con la scelta
  gia' fatta in `lp.liquid`.

## Alternatives rejected

| Alternativa | Perche' scartata |
|---|---|
| Smooth scroll via JS (intercettare i click `#`) | Piu' codice, comunque comportamento globale; `scroll-behavior` CSS e' 1 riga. |
| Lasciarlo solo sulle LP | Il cliente lo vuole su tutto il sito (notato sulla homepage con `#acquista`). |

## Consequences

- `layout/theme.liquid` (path critico, CLAUDE.md regola 4) e' stato toccato: una
  singola proprieta' CSS, a basso rischio, richiesta esplicitamente.
- Tutti i link ancora interni del sito ora scrollano in modo fluido.

## Implementation pointers

- `layout/theme.liquid` — regola `html` nel `<style>` inline.
- `layout/lp.liquid` — regola `html` analoga (gia' presente), commento aggiornato.
