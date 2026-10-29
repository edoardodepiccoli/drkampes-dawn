# B2B quiz tracking, thank-you page and FR copy — work log and next steps

**Date:** 2026-10-29
**Who:** Edoardo (with Claude Code)
**Source brief:** Alessandro's notes in `_istruzioni-cliente/alessandro/` (`PER_EDOARDO.md`,
`PAGINA_GRAZIE_FLOTTE.md`, `lp-b2b-quiz-form.CON_TRACCIAMENTO.js`). The folder is gitignored on
purpose: `PER_EDOARDO.md` contains the Meta Conversions API token in plain text.
**Architecture decision:** `.claude/decisions/044-b2b-quiz-tracking-and-thankyou-page.md`

---

## 1. Why this work exists

Meta and Google Ads need to know when a visitor does something valuable, so the campaigns can
optimise for it and find similar people. For Dr Kampes there are two such actions:

| Action | Where | Meta event | Google Ads conversion |
|---|---|---|---|
| Fleet application from the B2B quiz | `/pages/landing-b2b` | `SubmitApplication` | "Candidatura B2B" |
| Signup to the PRIMO10 popup | every page (Shopify Forms) | `Lead` | "Iscrizione popup" |

The B2B campaign can't work without the application event: Meta has nothing to optimise for.

Each event reaches Meta by two routes, deduplicated by a shared `event_id`:

```
Action on the site → event_id generated in the browser
   ├─ Shopify.analytics.publish → custom pixel (Settings > Customer events) → Meta   (browser)
   └─ POST to the Make webhook  → Conversions API module                      → Meta   (server)
Meta sees the same event_id twice → counts it once
```

The browser route only runs with cookie consent and loses adblock / Safari users; the server
route (Make → Conversions API) fills that gap. Make is used because Shopify can't send custom
events server-side on our plan (Meta's app only covers e-commerce events, Flow's HTTP action
isn't available).

**Already done by Alessandro before today:** the three custom pixels ("Meta B2B quiz",
"Meta Lead popup", "Google Ads conversioni") and the popup tracking script in
`sections/footer-group.json` (custom liquid). The popup script still has the placeholder
`INCOLLA_QUI_URL_WEBHOOK_MAKE`, so its server-side POST doesn't fire yet.

---

## 2. What changed in the theme, and why

All commits are on `staging` and merged to `main` (auto-deployed to the live theme).
Merge to `main` was explicitly requested by Edoardo for this batch, instead of the usual
staging-only review (decision 041).

### 2.1 French page `/fr-fr/` — `96fe1e9`

Alessandro's 26/10 review listed Italian strings on the French page. Most had already been
translated (buy box, reviews, WhatsApp button). Fixed in code:

| File | Before (FR) | After (FR) | Why |
|---|---|---|---|
| `sections/custom-buy-box.liquid` | "Livraison rapide en 1 à 2 jours" + "recevez-les en 1 à 2 jours ouvrés" | "Livraison rapide" + "Expédition rapide et avec suivi." | Delivery times to France not verified: no days |
| `sections/custom-features-intro.liquid` | "Semelle résistante à la chaleur jusqu'à 300°C, embout anti-rayures" | "Semelle antidérapante et résistante aux huiles, semelle anti-perforation, embout en fibre de verre" | The 300 °C claim isn't in the Italian copy nor in the spec sheets |
| `sections/custom-hero-v2.liquid` | "INDESTRUCTIBLES" | "GARANTIES 3 ANS" | Match the Italian "3 ANNI DI GARANZIA" |

Not code (theme editor settings, handled in Translate & Adapt): the four tabs on the product
page. See next steps: the shipping tab still shows days.

### 2.2 Quiz tracking — `76c4c73`

Alessandro delivered his patch as a **minified** copy of `assets/lp-b2b-quiz-form.js`. Instead of
dropping it in (the repo file is the readable 575-line source), both files were normalised
(esbuild syntax-minify + prettier) and diffed: the base code was identical, the only differences
were his additions. Those were ported by hand into the readable file, then re-diffed to confirm
the result is equivalent.

What the quiz now does:

- `dkPublish()` — wrapper around `Shopify.analytics.publish`, never throws.
- `dkGclid()` — reads `gclid` / `gbraid` / `wbraid` from the URL, keeps them in `localStorage`
  (`dk_gclid`, `dk_gbraid`, `dk_wbraid`) so they survive navigation; `gclid` falls back to the
  `_gcl_aw` cookie. Needed later for Google Ads offline conversions (which clicks became
  signed fleets).
- Every numeric step change → `dk_b2b_quiz_step` `{ step }` (Meta `B2BQuizStep`).
- Successful submit → `dk_b2b_application` with `event_id`, email, phone, autisti, camion
  (Meta `SubmitApplication`, Google "Candidatura B2B").
- New fields inside `meta` of the payload sent to Make (field names unchanged, Make/Brevo/
  Telegram keep working):

| `meta` field | Content |
|---|---|
| `event_id` | `b2b_<timestamp>_<random>`, same value as the browser event |
| `gclid`, `gbraid`, `wbraid` | Google click ids (usually only one is filled) |
| `fbp`, `fbc` | Meta cookies `_fbp`, `_fbc` |
| `ip` | Visitor IP (added later, see 2.6) |

Existing `meta` fields still there: `submittedAt`, `pageUrl`, `pageTitle`, `userAgent`,
`referrer`, `source`. Top-level `whatsapp` is already digits with country code
(e.g. `393331234567`), the format Meta wants.

### 2.3 Thank-you page `/pages/grazie-flotte` — `283635c`

Wanted by Alessandro for URL-based audiences and GA4. It doesn't replace the events: they fire
before the redirect.

- `templates/page.grazie_flotte.liquid` (layout `lp`) → `snippets/lp-b2b-thanks.liquid` +
  `assets/lp-b2b-thanks.css` + the existing `lp-b2b-footer`.
- Copy from `PAGINA_GRAZIE_FLOTTE.md`. Parts marked "DA CONFERMARE" left out (response times).
  The WhatsApp block was moved right under the intro so it's above the fold on mobile
  (checked at 375px).
- `noindex` added in `layout/lp.liquid`, keyed on `template.suffix == 'grazie_flotte'`
  (a template can't write into `<head>`).
- `#lpQuizModal` gets `data-thankyou="/it-it/pages/grazie-flotte"` (built from
  `routes.root_url`, so it follows the market prefix) only when the page exists and is published.

### 2.4 Incident: redirect to a 404 — `6688440`, `86f1d83`

Right after the merge to `main`, the live landing had `data-thankyou` set while
`/it-it/pages/grazie-flotte` answered **404**: the page already existed in the admin but wasn't
visible. Liquid's `pages['grazie-flotte']` also returns hidden pages, and adding a
`published_at` check didn't remove the attribute either. For a few minutes, a real applicant would have landed on a
404 after submitting (events and Make were not affected: they fire before the redirect).

Fix: before redirecting, the JS does a `HEAD` request to the thank-you URL and redirects only
on 200; otherwise the in-modal success step shows, as before. The check can never reject, so it
can't trigger the retry/resubmit logic. Edoardo then published the page; it answers 200 with
`noindex`.

### 2.5 Thank-you page tweaks — `1eb4f72`, `df1a8ff`

- **Bonus copy:** the "Il tuo bonus" box had no explanation and looked clickable. Added
  "Te lo inviamo all'indirizzo email che hai indicato." (decided by Edoardo).
  ⚠️ Nothing sends that email yet, see next steps.
- **Direct redirect:** after submit, the in-modal "Candidatura ricevuta" screen flashed before
  the redirect. Now the button keeps its spinner and the page goes straight to
  `/pages/grazie-flotte`. The 1.2 s delay (from Alessandro's patch) is kept, so the custom
  pixels have time to send the event before the page unloads. The `HEAD` check now starts in
  parallel with the POST to Make, so it's usually already answered.

### 2.6 Visitor IP for the Conversions API — `3526730`

Make's Conversions API module refuses to send the user agent without the IP
("You must provide both Client User Agent and Client IP Address"), and Meta requires the user
agent for website events. The browser can't read its public IP and Make's custom webhook
doesn't expose request headers. The shop domain is behind Cloudflare, and
`drkampes.com/cdn-cgi/trace` returns the visitor IP (`ip=` line), same origin and never cached.
The quiz reads it once on load and sends it as `meta.ip`. A third-party IP service (ipify) was
rejected: extra external request and the IP sent to a third party.

### Files touched

```
assets/lp-b2b-quiz-form.js          tracking, redirect, IP
assets/lp-b2b-thanks.css            new
snippets/lp-b2b-thanks.liquid       new
snippets/lp-b2b-quiz-form.liquid    data-thankyou on the modal
templates/page.grazie_flotte.liquid new
layout/lp.liquid                    noindex for grazie_flotte
sections/custom-buy-box.liquid      FR shipping copy
sections/custom-features-intro.liquid FR sole copy
sections/custom-hero-v2.liquid      FR hero badge
.gitignore                          _istruzioni-cliente/ (secrets)
.claude/decisions/044-*.md          decision record
```

---

## 3. What was verified, and what wasn't

Verified on the live site (`drkampes.com`):

- Landing with `?gclid=TEST123` → `localStorage.dk_gclid = TEST123`; `Shopify.analytics.publish`
  available.
- Full quiz run with the Make webhook **faked** and `Shopify.analytics.publish` **silenced**
  (no real lead, no fake conversion): spinner, no success screen, redirect to
  `/it-it/pages/grazie-flotte`, `dk_b2b_application` published.
- `/it-it/pages/grazie-flotte` → 200, `<meta name="robots" content="noindex">`.
- `/cdn-cgi/trace` returns a valid IP from the browser; live JS contains the IP code.

**Not verified yet:**

- That browser and server `SubmitApplication` are deduplicated in Meta (needs Meta access).
- That the Make Conversions API module accepts the event with the new `meta.ip`.
- The popup flow server-side (scenario not built).

Gotcha found while testing: **in the Shopify theme preview the `gclid` parameter is stripped**
(other parameters survive). Test click-id capture on the live domain, not in preview.

---

## 4. Done outside the repo today (by Edoardo)

- Page `grazie-flotte` published in Shopify, template `page.grazie_flotte`.
- Brevo contact attributes `GCLID`, `GBRAID`, `WBRAID` (type Text).
- Make: Facebook Conversions API connection via Facebook Business Extension (business
  "Dr Kampes", EUR, Europe/Rome, external business ID `drkampes`). This connection logs in
  with Facebook: the token from Alessandro's notes isn't used by it.
- Make: Conversions API module in the quiz scenario, being configured (see 5.1).

---

## 5. Next steps

### 5.1 Finish the quiz scenario in Make — Edoardo, now

- [ ] Run the scenario once with a real test submission so the webhook learns `meta.ip`
      ("Redetermine data structure" if needed).
- [ ] Brevo module: map `GCLID ← meta.gclid`, `GBRAID ← meta.gbraid`, `WBRAID ← meta.wbraid`.
      **Urgent:** every application since the deploy already carries these ids; until they are
      saved they are lost.
- [ ] Conversions API module, item 1:

| Field | Value |
|---|---|
| Event ID | `meta.event_id` (never generate it in Make) |
| Event Name | `SubmitApplication` (Map on, typed, if not in the list) |
| Event Time | `{{now}}` |
| Action Source | Website |
| Event Source URL | `meta.pageUrl` |
| Email | `email` (plain text, the module hashes it) |
| Phone | `whatsapp` |
| Client IP Address | `meta.ip` |
| Client User Agent | `{{if(meta.ip; meta.userAgent; "")}}` (only sent when there's an IP, avoids the module error if the IP lookup ever fails) |
| Browser ID (fbp) | `meta.fbp` |
| Click ID (fbc) | `meta.fbc` |
| Content Name | `Candidatura B2B` |
| Everything else | empty (no first name: `nome` is often a full name) |
| Test Event Code | **empty** (no Meta access to read the test view) |

- [ ] Test: open the landing with `?gclid=TEST123`, submit. In the Make run history the CAPI
      module output should show `events_received: 1`. Brevo contact has `GCLID = TEST123`.
      Brevo and Telegram receive the application as before.
- [ ] Delete the test contacts from Brevo and Shopify.

### 5.2 Popup PRIMO10 scenario in Make — Edoardo

- [ ] Custom webhook. Incoming: `email`, `event_id`, `event_time`, `fbp`, `fbc`, `user_agent`,
      `page_url`, `source`.
- [ ] Shopify → Search customers `email:{{email}}`; filter: customer exists **and** has tag
      `shopify-forms-887516` (anti-spam: the webhook URL is public in the page source). Add a
      ~10 s Sleep before the search if the customer isn't found yet.
- [ ] Conversions API: `Lead`, `event_id`, `event_time`, Website, `page_url`, email,
      user agent, fbp, fbc, Content Name `Popup PRIMO10`.
- [ ] **Theme (Claude/Edoardo):** the popup script doesn't send an IP either, so the module will
      throw the same error. Add `ip` (same `/cdn-cgi/trace` approach) to the script in
      `sections/footer-group.json`.
- [ ] Put the webhook URL in place of `INCOLLA_QUI_URL_WEBHOOK_MAKE` in the same script,
      keeping the quotes.

### 5.3 Final test with Alex — needs Meta access

In Meta → Events Manager → Test events, while Edoardo submits once each:

- [ ] Quiz: `B2BQuizStep` ×5, then `SubmitApplication` from **browser and server**, deduplicated.
- [ ] Popup: `Lead` from browser and server, deduplicated.
- [ ] Remove any Test Event Code from the Make modules afterwards.

### 5.4 Bonus email — Claudio / Edoardo

The thank-you page promises "2 strategie pratiche per ridurre sprechi e sostituzioni DPI" by
email. The content doesn't exist and nothing sends it.

- [ ] Write the content (e.g. a short PDF).
- [ ] Send it automatically, e.g. a Brevo automation triggered by the quiz scenario.

### 5.5 Shopify admin — Edoardo

- [ ] Translate & Adapt, French product page: the shipping tab still says
      "Expédition rapide 1-2 jours" and its text "recevez-les en 1-2 jours ouvrables". Remove the days.
- [ ] French footer menu: the warranty link still has `title="Garanzia 3 Anni"`.
- [ ] Optional: page title of `grazie-flotte` is "Grazie Flotte"; brief suggested
      "Candidatura ricevuta".

### 5.6 Open questions

For **Claudio**:
- Klarna active for France? Free returns / size exchange valid for France?
- 300 °C claim: removed from French; English still says "Heat-resistant sole up to 300°C" and
  "INDESTRUCTIBLE".
- Thank-you page: response time for step 2 ("entro X giorni lavorativi")? Is the product-page
  WhatsApp number right for fleets?

For **Alex**:
- Consent: the browser pixels only fire with cookie consent, the Make → Conversions API path
  sends data regardless. OK, or should Make forward only when consent is given? (Needs a
  consent flag in the payload, small theme change.)
- The CAPI token is in plain text in `PER_EDOARDO.md`. If that file went through chat or email,
  rotate it. (The Make connection doesn't use it.)

### 5.7 Repo housekeeping

- [ ] `run.sh` shows as deleted in the working tree, not committed: commit the deletion or
      restore the file.
