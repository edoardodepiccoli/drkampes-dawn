# Project memory — Dr. Kampes Dawn theme

This directory is the project's persistent memory for Claude Code sessions and the human dev (Edoardo). Read it at the start of any non-trivial task — especially anything that touches the B2C / B2B landing pages.

## What lives here

```
.claude/
├── README.md                            ← you are here
├── rules.md                             ← hardened do / don't rules from past sessions
├── architecture/
│   └── landing-pages.md                 ← the LP architecture, end-to-end
├── decisions/
│   ├── 000-index.md                     ← decision log index
│   ├── 001-snippets-not-sections.md
│   ├── 002-rem-scaling-dawn-root.md
│   ├── 003-cart-flow-bypass-drawer.md
│   └── 004-custom-homepage-sections.md
├── changelog/
│   └── custom-hero-v2.md                ← per-commit build log for the homepage hero
└── patterns/
    ├── porting-horizon-section.md       ← step-by-step recipe for porting an LP section
    └── building-custom-homepage-section.md  ← recipe for a custom homepage section
```

## Update policy

When a non-obvious architectural choice is made, add a new file under `decisions/`. Number sequentially. Keep entries short — context, choice, alternatives rejected, consequences. Update `decisions/000-index.md`.

When a session surfaces a new hardened rule, add it to `rules.md`.

When the architecture changes materially, update `architecture/landing-pages.md`.

`changelog/` is the build log, not the decision log: one file per section that went
through enough iteration that the *sequence* matters (what was tried, what failed, what
replaced it). A decision entry says why the code looks like this; a changelog entry says
how it got there. Append to it in the same commit that changes the section.

Do not let decisions live only in chat history. If it took thought, write it down here.

## Out-of-band memory

User-scope auto-memory lives at `~/.claude/projects/-Users-edoardo-main-repos-drkampes-dawn/memory/`. It captures user preferences and reference pointers that persist across all of this project's sessions but should not ship in the repo (e.g. "pull / push means git, never `shopify theme pull/push`"). Project-scope (this folder) captures decisions that ship with the code.
