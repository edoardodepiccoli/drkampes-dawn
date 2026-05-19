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
│   └── 003-cart-flow-bypass-drawer.md
└── patterns/
    └── porting-horizon-section.md       ← step-by-step recipe for porting an LP section
```

## Update policy

When a non-obvious architectural choice is made, add a new file under `decisions/`. Number sequentially. Keep entries short — context, choice, alternatives rejected, consequences. Update `decisions/000-index.md`.

When a session surfaces a new hardened rule, add it to `rules.md`.

When the architecture changes materially, update `architecture/landing-pages.md`.

Do not let decisions live only in chat history. If it took thought, write it down here.

## Out-of-band memory

User-scope auto-memory lives at `~/.claude/projects/-Users-edoardo-main-repos-drkampes-dawn/memory/`. It captures user preferences and reference pointers that persist across all of this project's sessions but should not ship in the repo (e.g. "pull / push means git, never `shopify theme pull/push`"). Project-scope (this folder) captures decisions that ship with the code.
