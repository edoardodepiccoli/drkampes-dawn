# Pattern — Porting a Horizon section to a Dawn LP snippet

Recipe for the most common task on this project. Follow it end-to-end; deviating is fine but document why.

## When to use

You have a section in `horizon/sections/<name>.liquid` that needs to become a snippet in `dawn/snippets/lp-<name>.liquid`. The snippet appears on the B2C landing page (or B2B). No theme editor exposure.

## Inputs you'll need

- `horizon/sections/<name>.liquid` — source markup, embedded CSS, embedded JS, schema.
- `horizon/templates/page.landing.json` — the **actual values** for the section's settings and blocks. The schema defaults are unreliable; the JSON is authoritative.

Get the JSON values with:

```bash
python3 -c "
import json, re
with open('/Users/edoardo/main/repos/drkampes/horizon/templates/page.landing.json') as f:
    text = re.sub(r'/\*.*?\*/', '', f.read(), flags=re.DOTALL)
data = json.loads(text)
print(json.dumps(data['sections']['<key>'], indent=2, ensure_ascii=False))
"
```

## Step 1 — Inventory the Horizon section

`grep` the file for block boundaries:

```bash
grep -n "{% stylesheet %}\|{% endstylesheet %}\|<script>\|</script>\|{% schema %}" \
  /Users/edoardo/main/repos/drkampes/horizon/sections/<name>.liquid
```

Note the line ranges for: markup (start to `{% stylesheet %}`), CSS (`{% stylesheet %}` body), JS (`<script>` body), schema (`{% schema %}` body). Schema is read-only reference — never ported.

## Step 2 — Port the CSS

```bash
sed -n '<start>,<end>p' \
  /Users/edoardo/main/repos/drkampes/horizon/sections/<name>.liquid \
  > /Users/edoardo/main/repos/drkampes/dawn/assets/lp-<name>.css
```

Apply the 1.6x rem rescaler (Dawn's `lp.liquid` uses a 10px root — see `decisions/002-rem-scaling-dawn-root.md`):

```bash
python3 << 'PY'
import re
path = 'assets/lp-<name>.css'
with open(path) as f:
    content = f.read()
def repl(m):
    n = float(m.group(1)) * 1.6
    return (f"{int(n)}rem" if n == int(n)
            else f"{n:.4f}".rstrip('0').rstrip('.') + 'rem')
new = re.sub(r'(\d+(?:\.\d+)?)rem', repl, content)
with open(path, 'w') as f:
    f.write(new)
PY
```

Sanity-check the file looks like valid CSS. Commit:

```
feat(landing): scaffold lp-<name> css (scaled 1.6x for dawn root)
```

## Step 3 — Port the JS (if any)

If the Horizon section has no JS, skip. Otherwise:

- Create `assets/lp-<name>.js` with the embedded JS body.
- Replace every `{{ section.id }}` with a fixed string (typical: `'lp'`).
- Replace every `{{ section.settings.X | json }}` and `{{ section.settings.X | default: N }}` with a constant at the top of the file inside a `CFG` block.
- If JS needs variant / product data: do **not** interpolate Liquid into the JS file. Instead emit the data from the snippet as a `<script type="application/json" id="…">…</script>` blob and `JSON.parse` it on `DOMContentLoaded`. This keeps the JS file CDN-cacheable.
- No Dawn imports. Vanilla JS only. No jQuery.

Commit:

```
feat(landing): scaffold lp-<name> js (vanilla, no dawn deps)
```

## Step 4 — Port the markup into a snippet

Create `snippets/lp-<name>.liquid`. Apply all of the following:

1. **Drop `{% stylesheet %}` block.** Replace with `{{ 'lp-<name>.css' | asset_url | stylesheet_tag }}` at the top.
2. **Drop `{% schema %}` block.** Snippets have no schema.
3. **Drop `{% form 'product', … %}` wrapper** if present, unless the form actually submits via native browser POST (rare on LP).
4. **Replace every `section.settings.X` reference with the literal value** from `templates/page.landing.json`.
5. **Replace every `section.blocks` iteration with hard-coded `<li>` / `<div>` blocks**, one per item from the JSON.
6. **Drop `block.shopify_attributes`** — meaningful only for editor-controlled blocks.
7. **Replace `'{{ section.id }}'` suffixes in `id="…"` attributes** with the fixed string used in the JS (e.g. `-lp`).
8. **Resolve products** via `{%- assign product = all_products['<handle>'] -%}` at the top.
9. **Image references**: prefer `{{ '<filename>' | file_img_url: '<size>x' }}` for Shopify admin → Files images, or direct CDN URLs if Horizon already used them.
10. **Append** `<script src="{{ 'lp-<name>.js' | asset_url }}" defer></script>` at the bottom (if a JS file was created).
11. Wrap with a guard if the snippet depends on a product:

    ```liquid
    {% if product == blank %}
      <div style="padding:2rem;text-align:center;color:#888;">
        Nessun prodotto configurato in lp-<name>.liquid
      </div>
    {% else %}
      …
    {% endif %}
    ```

Commit:

```
feat(landing): port lp-<name> snippet (markup + …)
```

## Step 5 — Wire into the template

Add `{% render 'lp-<name>' %}` to `templates/page.landing.liquid` in the position the section occupied on Horizon. B2B template is a separate decision.

Commit:

```
feat(landing): wire lp-<name> into page.landing template
```

## Step 6 — Push and test

`git push origin main`. GitHub → Shopify sync deploys to unpublished theme within ~60 seconds.

Manual checks (always):

- [ ] Section renders in correct position on `/pages/landing` (unpublished theme preview)
- [ ] Visual parity with the live Horizon `/pages/landing` (side-by-side)
- [ ] Mobile viewport (375px) — spacing, gallery scroll, hidden-on-mobile items
- [ ] Desktop viewport (≥1100px) — layout shifts as expected
- [ ] Snippet is **not** in the theme editor sidebar when editing `/pages/landing` (architectural guarantee)
- [ ] No console errors
- [ ] Acquista button on a regular product page still works (regression check — never skip this)

If iteration needed (text too big / small, color wrong, layout broken): edit the snippet or CSS, commit with a `style(lp-<name>): …` or `fix(landing): …` message, push.

## Common gotchas

- **Forgetting the 1.6x rescaler** — everything renders 60% too small. Pick a heading, check pixel size in DevTools; if you see `1rem ≈ 10px`, run the scaler.
- **Snippet shows in editor sidebar** — you used `{% section '…' %}` somewhere or you ported as a section. Snippets never appear in the editor; sections always do.
- **Image references break** — `file_img_url` looks in Shopify admin → Settings → Files. If the image is on the product or in `assets/`, use a different filter (`asset_url`, `image_url` for product image objects).
- **JS references the wrong section.id** — if you forgot to replace `{{ section.id }}` everywhere, the JS will look for ids that don't exist and silently fail. Grep your JS file for `{{ ` after porting to catch this.
- **Inter-snippet contracts** — if your snippet needs to talk to another (e.g. `lp-size-guide` opens `lp-offerta`'s popup), document the shared DOM id in `architecture/landing-pages.md` and `rules.md` so future sessions don't rename it.
