# 032 — custom-features-intro: prima delle due sezioni "features" della homepage

**Date:** 2026-07-13
**Status:** Active

## Context

Il cliente ha fornito un design di riferimento (mockup mobile, generato con
ChatGPT) per una nuova sezione "features" della homepage, in due parti:
**introduzione** e **fast-wear**. Questa decision copre solo l'introduzione;
fast-wear e' un task separato.

Il layout: banda nera, overline arancione, headline grande, foto top-down della
scarpa che sfuma nel nero, paragrafo di body, quattro righe beneficio con icone
stroke arancioni separate da hairline. Sta sotto `custom-hero-v2` (decision 031)
e ne riusa il linguaggio visivo.

## Choice

`sections/custom-features-intro.liquid` + `assets/custom-features-intro.css`,
pattern standard di decision 004 (`settings: []`, contenuto hardcoded, preset,
prefisso `CUSTOM · `). Copy locale-gated IT/EN/FR con il gate inline di
decision 024. Nessun JS: la sezione e' interamente statica.

### Due sezioni sorelle, non una sola

`custom-features-intro` ora, `custom-features-fastwear` poi. Ognuna aggiungibile
e riordinabile indipendentemente dall'editor. Entrambe nere: in pagina leggono
comunque come un'unica banda continua.

### Immagine: asset derivato nel tema, non URL CDN

**Questa e' l'eccezione alla convenzione.** Ogni altra sezione custom hardcoda un
URL della CDN Files (rules.md). Qui l'immagine e' `assets/features-intro-sole.jpg`,
servita con `asset_url`, perche' **sulla CDN esiste solo l'originale grezzo**
(`dr_kampes_nere_suola.jpg`, 2000x2000, scarpa nera su fondo **bianco**): la
versione lavorata non esiste altrove. Tenerla nel repo la versiona insieme al CSS
che la maschera e la deploya con lo stesso `git push`.

Resta comunque un `<img src>`, mai un `background-image` inline: quello non ha mai
renderizzato su questo storefront (rules.md, decision 031).

### Come e' stato rimosso il fondo bianco

Ruotata 90° antiorario, poi **flood fill dai bordi del frame** sui pixel
near-white: e' background **solo il bianco connesso al bordo**.

Il motivo e' che il sottopiede porta il **logo Dr Kampes stampato in bianco**, ed
e' il punto focale del design. Una soglia di luminanza ("rendi trasparente il
bianco") lo avrebbe cancellato, insieme alla scritta "KAMPES" sul tallone e alle
strisce argento della suola. Il logo e' racchiuso dalla pelle scura, quindi il
flood non lo raggiunge mai e sopravvive.

Il taglio e' poi **sfumato di 1.2px**: il bordo bianco→pelle e' antialiasato, e un
taglio binario netto lascia una frangia grigio chiaro, evidentissima sul nero.

Appiattita su `#000000` ed esportata **JPEG, non PNG con alpha**: lo sfondo della
sezione e' esattamente `#000000` (scheme-4), quindi trasparente-su-nero e nero
sono identici, e il JPEG pesa circa un ordine di grandezza in meno (348 KB) senza
frange di alpha. Prezzo: **questo asset puo' vivere solo su fondo nero.**

Script in `scratchpad`, non versionato: e' una trasformazione one-shot.

### Font della headline

`var(--font-heading-family)` = Archivo Black. Il mockup usa una **condensed
pesante**; Archivo Black e' pesante ma molto piu' larga, quindi **la headline va a
4 righe dove il mockup ne fa 3**. Accettato consapevolmente dal cliente per non
introdurre un webfont fuori brand.

### Icone

Tre nuove stroke (`icon-leaf-line`, `icon-waves-line`, `icon-cushion-line`) piu'
**riuso di `icon-shield.svg`**, che hero-v2 usa gia' per la stessa claim S3S: le
due sezioni non devono dissentire sul simbolo.

Nessun `fill` dichiarato da nessuna parte: gli attributi di presentazione SVG
perdono contro qualsiasi regola CSS, quindi un `fill` sul contenitore riempirebbe
di colore pieno le icone stroke (rules.md).

### Desktop: grid-areas, non riordino del markup

Da 1100px: copy a sinistra, foto a destra, benefici a tutta larghezza sotto. La
foto sta a **destra** apposta — hero-v2 mette la sua scarpa a **sinistra**, e le due
sezioni sono adiacenti: due layout image-left impilati leggerebbero come la stessa
slide due volte.

Il posizionamento usa `grid-template-areas`, **non** un riordino del markup: su
mobile la foto sta tra headline e body (e' il design) e il DOM mantiene
quell'ordine. Solo il desktop la sposta, quindi solo il CSS desktop lo sa.

### Mask dell'immagine

La foto e' rifilata al bounding box della scarpa, quindi **tagliata su tutti e
quattro i lati**: senza trattamento leggerebbe come un rettangolo incollato sul
nero. Due layer di `mask-image` intersecati (fade orizzontale forte — la scarpa
esce da entrambi i lati e quei tagli sono i piu' rumorosi — piu' uno verticale
piu' morbido). `mask-composite` va scritto **in entrambe le sintassi**: senza,
i layer fanno union invece di intersect e non sfuma nulla.

## Alternatives rejected

- **Key del bianco via CSS/SVG filter a runtime**: fragile, costo di paint, e
  comunque incapace di distinguere il logo interno dal fondo.
- **Soglia di luminanza globale** invece del flood dai bordi: cancella il logo.
- **PNG con alpha**: ~10x piu' pesante, nessun beneficio su fondo nero fisso.
- **Webfont condensed** per avvicinarsi al mockup: peso extra e deviazione dal
  brand, scartata dal cliente.
- **Una sola sezione con entrambe le parti**: file lungo, parti non riordinabili
  singolarmente.

## Consequences

- `assets/features-intro-sole.jpg` **e' utilizzabile solo su sfondo nero**. Se la
  sezione dovesse mai cambiare color scheme, l'immagine va ri-esportata (PNG con
  alpha, o flatten sul nuovo colore).
- Se serve il logo **dritto** e non ruotato di 90°, non basta cambiare rotazione:
  nell'originale la scarpa e' verticale e il logo orizzontale, quindi orizzontale
  la scarpa ⇒ ruotato il logo. Serve **un'altra foto**, non un'altra rotazione.
  (Nel mockup sono entrambi dritti perche' la scarpa e' ridisegnata da ChatGPT.)
- Il mockup e' anche **speculare** rispetto alla rotazione antioraria richiesta
  (punta a destra invece che a sinistra). Confermata l'antioraria dal cliente.
- Precedente aperto: `asset_url` per immagini **derivate**, CDN Files per immagini
  **originali**. Se si ripete, va promosso a regola in `rules.md`.
