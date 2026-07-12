# Changelog — custom-hero-v2

Every commit that has touched `sections/custom-hero-v2.liquid`, `assets/custom-hero-v2.css`
or the section's own icon assets, oldest first. The design rationale lives in
`decisions/031-custom-hero-v2-redesign.md`; this file is the build log — what
changed, in which commit, and why the previous attempt was not enough.

Regenerate the raw list with:

```
git log --date=short --pretty=format:'%h|%ad|%s' -- sections/custom-hero-v2.liquid assets/custom-hero-v2.css
```

---

## Phase 1 — the section exists

### `2a2121c` — feat(homepage): add custom-hero-v2 section

The initial build, from the client's tablet reference mockup: overline, two-line
headline, subheading, 4-item icon feature list, two CTAs, 4-item trust row.
Content fully hardcoded (`"settings": []`), locale-gated IT/EN/FR inline, reusing
`scheme-4` and the theme's font tokens. Hero photo delivered as a CSS
`background-image` in an inline `style` attribute. Six hand-drawn stroke icons
added (`icon-clock`, `icon-shield`, `icon-flag-it`, `icon-medal`, `icon-users`,
`icon-chevron-down`), plus the stock Dawn `icon-truck` / `icon-return` /
`icon-lock` reused for the trust row. Not yet placed on the homepage template —
that swap happens in the theme editor. See decision 031.

New files: `sections/custom-hero-v2.liquid` (151 lines), `assets/custom-hero-v2.css` (236 lines).

## Phase 2 — making it actually render

### `0080a4c` — fix(homepage): fix custom-hero-v2 overlay and layout to match design ref

First render came back solid black. The photo is low-key to begin with, and the
uniform `rgba(0,0,0,.55 → .9)` vertical overlay flattened it to nothing. Replaced
with a horizontal fade (dark over the copy, transparent over the shoe) plus a light
vertical gradient for trust-row legibility, fixed `background-position` to keep the
shoe in frame, restyled the trust row to icon-above-text with dividers, and moved
the feature-grid / CTA-row breakpoint from 750px to 1100px so tablet still matches
the single-column mockup. CSS only.

### `3347531` — fix(homepage): render custom-hero-v2 image as img and fix invisible trust icons

Still black, and three of four trust icons missing. Two independent bugs, both
present since `2a2121c`:

1. **The photo never painted.** It was the only style on the page delivered via an
   inline `style` attribute rather than the stylesheet. CSP, URL, paint order and
   CSS overrides all checked out. Every other one of the theme's 44 hardcoded CDN
   images is an `<img src>`, so it became one — `object-fit: cover`,
   `object-position: center 45%`, overlay moved onto its own `__overlay` element.
   Bonus: it is the idiomatic Dawn pattern and lets the LCP element preload
   (`loading="eager"`, `fetchpriority="high"`).
2. **Black icons on black.** The three stock Dawn icons are fill-based with no
   `fill` attribute, so they defaulted to black. A CSS `fill` rule was *not* the
   fix — SVG presentation attributes lose to any CSS rule, so it would have
   solid-filled the five stroke icons too. Replaced with new stroke icons
   (`icon-truck-line`, `icon-return-line`, `icon-lock-line`). This is now a
   hardened rule in `rules.md`.

## Phase 3 — art direction

### `6f1c655` — feat(homepage): art-direct custom-hero-v2 image and compact the layout

Desktop got the studio profile shot via a `<picture>` source, placed left with the
copy on the right. That source is a square cut-out on black, so it is `contain`, not
`cover` — cover sliced off the collar and the sole. Mobile got a heavier wash (the
copy runs full width there) and tighter heading, subheading and feature list to leave
the shoe room in the centre. Feature icons pulled closer together, trust icons
enlarged. Trust row reduced to the white label only, and shipping now reads "fast 1-2
day" rather than "free".

## Phase 4 — the mobile image, six passes

On mobile the copy and the photo were fighting for the same space. This took a while.

### `b392fc0` — open up space above the feature list on mobile

Copy and feature list ran back to back, covering the photo end to end. Pushed the list
down (7rem) so a band of shoe shows between them; reset at 750px.

### `0d69202` — widen that gap

7rem left the band too narrow. 18rem.

### `3ef4369` — give the shoe its own band on mobile

The real fix, and the one that changed the markup. As a full-bleed *background* the
photo was always underneath the copy, so no amount of spacing could stop text covering
it. On mobile it is now an **in-flow band** between the copy and the features, bled
past the page gutters and masked top and bottom. From 750px up the CSS lifts it back
out of flow into the background, copy in a column beside it. The content block was
split into `__intro` and `__details` so the image can sit between them, and `__inner`
was left unpositioned so the background still resolves against the section.

### `3f392dd` → `bc0b5df` → `c89579a` — tuning the fade

Three passes on the mask, each fixing the last:

- `3f392dd`: ramp over most of the band's height instead of the outer 14%, edges stop
  at 40% opacity rather than transparent — softens into the section instead of dying
  to black at a hard edge.
- `bc0b5df`: that mask only hit full opacity across a narrow middle strip, so most of
  the photo read as *dimmed* — harsher, not softer. Hold the solid band wide (30–70%)
  and ramp out gradually to near-invisible at the edges. Band squared off so the whole
  shoe fits the visible middle.
- `c89579a`: portrait band, so the ramps have real height to run over and more photo
  shows, with extra gradient midpoints for evenness. More top padding to drop the
  heading and subheading.

### `cda2a8a` — close the gaps around the band

Negative margins slide the band up behind the heading and down behind the features, so
the copy sits over the faded ends of the photo instead of leaving dead black space on
either side. Picture dropped below the copy in the stack so text stays legible over it.

### `037c88b` → `494b851` — top padding

9rem left too big a gap under the header now that the copy overlaps the image. 4rem,
then 2rem.

## Phase 5 — copy

### `d4ce3b6` — copy(homepage): sharpen the hero-v2 trust and feature copy

Client copy pass, IT with EN/FR kept in step:

| Slot | Before (IT) | After (IT) |
|---|---|---|
| Trust — social proof | OLTRE 1.000 CAMIONISTI | 1200+ CAMIONISTI SODDISFATTI |
| Trust — returns | RESO FACILE | RESO 14 GIORNI |
| Feature — FAST WEAR | 2 secondi e pronto | Pronto in 2 secondi |

EN: `1,200+ HAPPY TRUCKERS`, `14-DAY RETURNS`. FR: `1200+ CAMIONNEURS SATISFAITS`,
`RETOURS 14 JOURS`. The FAST WEAR line already led with the payoff in EN/FR
("Ready in 2 seconds"), so only the IT string moved.

**Open question for the client:** the 14-day return window is now stated on the
storefront. Confirm it matches the actual policy page.

## Phase 6 — live

### `770eb92` — Update from Shopify for theme drkampes-dawn/main

Not our commit — this is the theme editor syncing back. The v2 section was enabled on
the homepage and the old `custom-hero` disabled, both in `templates/index.json`. This
is the swap decision 031 left out of scope. From here, `custom-hero-v2` is what
visitors see.

---

## Standing notes

- **It is live.** The editor swap happened on 2026-07-12 and came back into the repo as
  Shopify sync commit `770eb92`: `custom_hero_v2_L9N69X` lost its `"disabled": true` and
  the old `CUSTOM · Hero` gained one. `custom-hero.liquid` / `.css` (decision 012) are
  still in the tree, now unused — deletable once the client confirms they are not going
  back. Anything shipped to `custom-hero-v2` from here is on the storefront.
- **No JS.** The section is Liquid + CSS only. Keep it that way.
- **Icons are stroke-based.** Never mix in a stock Dawn (fill-based) icon — see
  `3347531` and `rules.md`.
