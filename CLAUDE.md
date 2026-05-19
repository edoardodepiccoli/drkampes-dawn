# CLAUDE.md — Dr. Kampes Shopify Theme

## What this project is

**Store:** Dr. Kampes
**Theme:** Dawn (Shopify official, open-source)
**Developer:** Edoardo — freelance, client: Claudio
**Stack:** Liquid, vanilla JS, CSS. No frameworks. No jQuery. No build step.
**Store type:** Few-products. B2C and B2B.

### Pages in scope
| Page | Complexity | Notes |
|------|-----------|-------|
| Homepage | Medium | Brand-first, conversion-focused |
| Contact + standard pages | Low | Minimal customization |
| Landing page A | High | Popup form, advanced interactions |
| Landing page B | High | Popup form, advanced interactions |

---

## Non-negotiable rules

These are not suggestions. Every single session, every single task.

### 1. One unit at a time — always
Never generate a complete feature, section, or page in one shot.
Break every task into the smallest deployable unit. Build it. Stop. Wait for confirmation. Then continue.

```
Building a popup form means:
  → Step 1: trigger button only         ✋ stop
  → Step 2: modal shell, no content     ✋ stop
  → Step 3: form fields                 ✋ stop
  → Step 4: submit + state handling     ✋ stop
```

If you're about to generate more than ~50 lines without a checkpoint — stop. You're moving too fast.

### 2. Every session starts with a read
Before writing any code, read the relevant section file(s) in full.
Understand what already exists before adding anything.

### 3. Test checkpoint before every handoff
After each unit of work, name exactly what needs to be tested manually:

```
✅ Test checkpoint:
- Open product page, click Acquista → confirm cart updates
- Open the modal trigger → confirm modal opens and closes cleanly
- Confirm no console errors
```

Do not skip this. Do not assume it works.

### 4. Never touch critical paths without an explicit instruction
These files are off-limits unless the task explicitly requires it:

- `layout/theme.liquid`
- `assets/cart.js` / anything cart-related
- Any file containing `product-form` Custom Element logic
- Checkout templates
- `config/settings_schema.json` (unless adding a new section's settings)

If a task *seems* to require touching one of these: **stop and ask first.**

### 5. Explain every non-obvious decision
After any logic that isn't immediately self-evident, add an inline comment explaining *why*, not just *what*.

```liquid
{% comment %}
  Using section.settings instead of block.settings here because this value
  controls the layout of the entire section, not individual blocks.
{% endcomment %}
```

```js
// Using a MutationObserver instead of a click listener because the cart drawer
// is injected dynamically by Shopify's Section Rendering API and doesn't exist on DOMContentLoaded.
```

### 6. No global CSS
Never write rules that target bare HTML elements unless scoped inside a section-specific selector.

```css
/* ❌ wrong — affects the entire store */
button { font-size: 14px; }

/* ✅ correct — scoped to this section */
.section-hero__cta button { font-size: 14px; }
```

No `!important` to override JS-controlled styles. If you need `!important`, something else is wrong — find it.

### 7. Schema settings: only what's used
Never add speculative schema settings ("in case the client wants to change this later").
Add a setting when it's needed. Not before.

---

## Dawn architecture — how this theme works

Dawn's philosophy: **HTML-first. JS only when CSS can't do the job.**
Follow it. Every feature starts as "no JavaScript" until proven otherwise.

### File structure
```
├── assets/           → CSS + JS files. One per section: section-hero.css, section-hero.js
├── config/           → settings_schema.json, settings_data.json
├── layout/           → theme.liquid (CAUTION — global layout)
├── locales/          → Translation strings
├── sections/         → One .liquid file per section
├── snippets/         → Reusable partials (render, not include)
└── templates/        → Page templates (.json) — do not modify directly
```

**New section:** create `sections/section-name.liquid` + `assets/section-name.css` (+ `.js` if needed).
**Never dump styles into `base.css`.**

### How Dawn handles interactivity
Dawn uses **Custom Elements** for all interactive components.

```js
// Dawn pattern — follow it
class MyComponent extends HTMLElement {
  connectedCallback() {
    this.button = this.querySelector('[data-trigger]');
    this.button.addEventListener('click', this.handleClick.bind(this));
  }

  handleClick() {
    // logic here
  }
}
customElements.define('my-component', MyComponent);
```

Do not attach event listeners to arbitrary DOM elements from outside a Custom Element.
Do not use `document.querySelector` for things that belong inside a component.

### Section Rendering API
Dawn uses Shopify's Section Rendering API for dynamic updates (cart count, cart drawer, etc.).
**Do not bypass it with direct DOM manipulation.**

If you need to respond to cart events, use Shopify's published event system:
```js
document.addEventListener('cart:updated', (e) => { ... });
```

---

## Liquid conventions

- Output in HTML attributes → always use `| escape`
- Multi-line logic → use `{% liquid %}` blocks
- Partials → `{% render 'snippet-name' %}` not `{% include %}`
- Schema `"name"` fields → sentence case: `"Button label"`, not `"ButtonLabel"` or `"button_label"`
- Never hardcode strings that belong in `locales/`

---

## JavaScript conventions

- Defer all scripts: use `defer` attribute or `DOMContentLoaded`
- No inline `<script>` blocks that execute immediately inside section files
- No jQuery. No external libraries unless explicitly approved.
- No `!important` to patch JS-controlled styles
- Every event listener: comment what it targets, when it fires, and whether it could conflict with Shopify's own JS

---

## The two landing pages — special rules

These are the highest-risk files in the project. Treat them accordingly.

**Isolation:** any popup or modal logic must be fully scoped. It must not interfere with the global cart drawer or any other modal.

**Build order for interactive features:**
1. Page structure and layout — no JS at all
2. Static content confirmed working
3. Trigger mechanism only
4. Modal/overlay shell only
5. Form fields
6. Submit + success/error states
7. End-to-end test before touching anything else

**Template files:** if a landing page uses a custom `.json` template in `/templates/`, do not modify the template file itself — only modify the sections it references.

---

## The Acquista button — business-critical

This is the single highest-risk element in the store.

Any JavaScript that touches:
- `form[action="/cart/add"]`
- The `product-form` Custom Element
- Cart event listeners

...must be treated as **potentially breaking**. Before and after any such change, test the full add-to-cart flow. This is the one thing that cannot break.

---

## Shopify AI Toolkit — how to use it

The toolkit gives Claude Code real-time access to Shopify's developer docs and GraphQL schema validation. Use it.

**For documentation questions:** ask directly — Claude will query current Shopify docs, not training data.

**For Liquid validation:** paste a template snippet and ask Claude to validate it against the current schema before using it.

**For store operations (creating products, modifying theme data via CLI):** always run against a development store first. There is no undo.

---

## What good output looks like

A good response to any development task:

1. Confirms what's being built and why
2. Reads the relevant existing file(s) before writing anything
3. Produces the smallest useful unit of code
4. Explains any non-obvious decision inline
5. Names a test checkpoint before stopping
6. Flags any risk to critical paths
7. Asks before proceeding to the next step

A bad response generates a full feature in one shot, assumes it works, and asks "want me to add anything?"

---

## Checklist before any theme push

- [ ] Acquista button tested on product page
- [ ] Cart drawer opens and updates correctly
- [ ] No console errors on homepage, product page, landing pages
- [ ] New CSS is scoped — no global overrides
- [ ] New JS is inside a Custom Element or explicitly deferred
- [ ] Schema settings are all actually used in the template
- [ ] Tested on mobile viewport (375px)