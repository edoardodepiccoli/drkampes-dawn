# 044 — B2B quiz: Meta/Google tracking and `/pages/grazie-flotte` thank-you page

**Date:** 2026-10-29
**Status:** Active

## Context

Alessandro (ads) needs the B2B quiz to report `SubmitApplication` to Meta from both the
browser (custom pixel) and the server (Make → Conversions API), deduplicated by a shared
`event_id`, plus Google Ads click ids saved for offline conversions. He also wants a
dedicated thank-you URL for audiences and GA4. Brief: `_istruzioni-cliente/alessandro/`
(gitignored). Full work log and next steps: `docs/2026-10-29-b2b-tracking-handoff.md`.

## Choice

- His patch came as a minified copy of `assets/lp-b2b-quiz-form.js`. Both files were
  normalized (esbuild syntax-minify + prettier) and diffed: only his additions differed.
  The additions were ported by hand into the readable source instead of replacing it.
- `meta.ip` is read from `/cdn-cgi/trace` (Cloudflare, same origin): Make's CAPI module
  rejects a user agent without an IP, the browser can't read its public IP, and Make's
  webhook doesn't expose request headers. Rejected: a third-party IP service (ipify).
- Thank-you page is an LP template (`templates/page.grazie_flotte.liquid`, layout `lp`)
  rendering `snippets/lp-b2b-thanks.liquid` + `lp-b2b-footer`.
- `noindex` lives in `layout/lp.liquid`, keyed on `template.suffix == 'grazie_flotte'`:
  a template can't write into `<head>`.
- `data-thankyou` on `#lpQuizModal` is emitted only when `pages['grazie-flotte']` exists and has
  `published_at` (`pages` also returns hidden pages, which 404: shipped without this check
  first and caught on the live site).
  Without it the JS keeps the in-modal success step, so deploying before the page is
  created in the admin can't send a successful submit to a 404.
- Copy marked "DA CONFERMARE" in the brief (response times) is left out
  until Claudio confirms it. Bonus delivery by email was confirmed on 29/10. The WhatsApp block sits right after the intro so it's above
  the fold on mobile.

## Alternatives rejected

- Dropping in the minified file: unreadable diffs and edits from then on.
- Always emitting `data-thankyou`: a 404 after every submit until someone creates the page.
- `seo.hidden` metafield for noindex: depends on an admin setting nobody will remember.
