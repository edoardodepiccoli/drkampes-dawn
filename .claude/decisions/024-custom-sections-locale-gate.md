# 024 — Custom sections: traduzione EN via locale gate inline

**Data:** 2026-06-17
**Status:** Active

## Contesto

Lo store vende in Italia ed Europa con locale EN attiva accanto all'IT (default).
Diverse sezioni CUSTOM della homepage avevano copy hardcoded in italiano che
restava in italiano anche con storefront in inglese. La sezione recensioni
("recensioni", `custom_liquid_CDG7FM` in `templates/index.json`) risolveva già il
problema con un gate inline sul locale.

## Scelta

Per tradurre le sezioni custom si replica quel pattern: un gate inline sul locale,
**niente chiavi `locales/*.json`** (coerente con la 004/005 — le sezioni custom
hardcodano il contenuto).

```liquid
{% if request.locale.iso_code == 'en' %}English{% else %}Italian{% endif %}
```

Nei file `.liquid` si assegna una volta `is_en` nel blocco `{%- liquid -%}` e poi si
gate ogni stringa. L'italiano resta sempre il ramo `{% else %}` (default). I nomi
propri (ambassador, "Dr Kampes", "Klarna", "PayPal", "PDF") non si traducono.

**Correzione (2026-07-09):** `assign` non accetta un'espressione di confronto (`==`)
sul lato destro, nemmeno dentro `{%- liquid -%}` — `assign is_en = request.locale.iso_code == 'en'`
lancia `Expected end_of_string but found comparison` a runtime (errore comparso come
testo grezzo in pagina su `custom-buy-box.liquid` e `whatsapp-info-button.liquid`).
Il booleano va costruito con `if`/`endif`:

```liquid
assign is_en = false
if request.locale.iso_code == 'en'
  assign is_en = true
endif
```

Vedi `.claude/rules.md` § Liquid specifics.

Applicato a:
- `sections/custom-buy-box.liquid` — rata, bottoni Guida taglie / Schede tecniche,
  i due `<dialog>` (guida taglie + schede tecniche), le 4 righe trust accordion,
  il messaggio WhatsApp precompilato, il placeholder editor.
- `snippets/whatsapp-info-button.liquid` — label "Chiedi info su WhatsApp"
  (snippet condiviso: tradotto beneficia anche la PDP `custom-product-information`).
- `templates/index.json` → sezione `custom_liquid_RUa7aM` "ambassadors" — heading,
  subheading e gli 11 `aria-label="Instagram di …"`. Editato in place nel JSON,
  stesso precedente della sezione recensioni (il contenuto vive solo lì).
- `sections/custom-garanzie.liquid` — i 3 badge icon (S3S, Made in Italy, Garanzia).
  Gate su EN e FR (non solo EN): `elsif request.locale.iso_code == 'fr'` come terzo
  ramo. URL CDN hardcoded per locale; `image_picker` rimosso dallo schema block.
  `forloop.index0` usato per mappare la posizione della colonna all'icona corretta.

## Alternative scartate

- **Chiavi `locales/*.json` + `| t`**: idiomatico Dawn ma fuori convenzione per le
  sezioni custom di questo progetto, e per i blocchi `custom-liquid` dentro
  `index.json` non è praticabile.
- **Traduzione del titolo prodotto in tema**: il titolo è `product.title` (dato
  prodotto). Si gestisce in Shopify admin (Translate & Adapt), non nel tema — così
  vale ovunque (home buy box + PDP).

## Conseguenze

- Le stringhe esistono in doppia copia nel sorgente; modifiche al copy vanno fatte
  su entrambi i rami.
- `reviews_text` / `sticky_cta_label` (schema text settings), i nomi opzione
  ("Color"/"Number") e "Add to cart" (`products.product.add_to_cart | t`) sono già
  localizzati altrove — non toccati.
