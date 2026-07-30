# 041 — Work moved to `staging` branch, pushed to GitHub for client preview

## Context

Client (Claudio) wants to see edits before approving them, instead of changes landing
directly on `main`. Edoardo's review workflow: push a branch to GitHub, then pull that
branch into the Shopify dashboard's theme list to preview it live, before publishing.

## Choice

Created `staging` off `main` (`0ec306b`-equivalent tip at time of creation, i.e. same as
`main` post-040) and pushed it to `origin` with upstream tracking
(`git push -u origin staging`). All work from 2026-07-21 onward happens on `staging`
until told otherwise — commits are not made directly to `main`.

## Alternatives rejected

- Per-feature branches, PR'd into `main`: rejected for now — client wants a single
  ongoing preview surface pulled into the Shopify theme dashboard, not a PR review flow.
  Simpler to keep one long-lived `staging` branch until told otherwise.

## Consequences

- Future commits should target `staging`, not `main`, unless the user explicitly says
  a change should go straight to `main`.
- `main` stays a clean mirror of what's actually published/approved.
- Before any future push to `main` (merge/fast-forward from `staging`), treat it as a
  publish-equivalent action — confirm with the user first, same as any other action
  visible to the client.
- Remember to keep pushing `staging` (not `main`) as work continues, so the client's
  Shopify preview picks up new commits.
