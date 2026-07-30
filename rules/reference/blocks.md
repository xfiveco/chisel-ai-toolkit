# Blocks

File structures, build-pipeline requirements, and existing styles/mods for the four block-ish things Chisel ships: native blocks, ACF blocks, patterns, and pattern categories. Owns the **what** — the file list for each type and the constraints that make it build. Does **not** own which type to pick ([section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md)), ACF field-group naming ([acf-naming.md](.claude/chisel/reference/acf-naming.md)), or spacer sizing ([design-tokens.md](.claude/chisel/reference/design-tokens.md#spacing-between-blocks)). Step-by-step scaffolding lives in the skill linked from each section.

## Hard rules

Each one breaks silently — no error, wrong output. Detail in the linked section.

1. **Every `.scss` is imported by a JS entry listed in `block.json`** — else webpack never compiles it and the block renders unstyled. → [File structures](#file-structures)
2. **`script.js` exists on every block, even when it is one `import` line** — it is the SCSS entry; omit it and the styles never build. → [Block JS/CSS keys](#block-jscss-keys--what-each-file-is-for)
3. **A block's frontend JS lives in its own `view.js` (`viewScript`)** — never `src/scripts/modules/`, never pushed to the editor via `script`. → [Block JS/CSS keys](#block-jscss-keys--what-each-file-is-for)
4. **`ignoreScripts` means "this key has no JS to run"**, not "this file is CSS-only forever". → [Block JS/CSS keys](#block-jscss-keys--what-each-file-is-for)
5. **ACF field-group naming**: hex-hash keys, filename = group key, namespace-prefixed field `name`s. → [acf-naming.md](.claude/chisel/reference/acf-naming.md)
6. **Every seeded ACF `data` field needs its `_{name}: "field_key"` partner** — without it `get_fields()` returns empty. → [ACF field data shape](#acf-field-data-shape)
7. **A pattern category must be registered before use** — an unregistered slug is dropped and the pattern lands in "Uncategorized". → [Pattern categories](#pattern-categories)
8. **Pattern slugs name the section's function, not the page it came from.** → [Pattern slug naming](#pattern-slug-naming-hard-rule)
9. **Four-way sync**: `Slug:` header, filename, root class, SCSS file + scope all track the pattern slug. → [Root wrapper rule](#root-wrapper-rule)
10. **Class only the root; target inner blocks by tag** — a BEM `__element` class on a text block only exists on the seeded instance. → [Root wrapper rule](#root-wrapper-rule)
11. **When seeding a modded block, set the attr AND its companion class** — the attr alone renders nothing. → [Existing block mods](#existing-block-mods)
12. **Default a `core/spacer` between sibling inner blocks**; never `blockGap`/CSS `gap` for vertical spacing. → [Spacing between sibling blocks](#spacing-between-sibling-blocks)
13. **A property the block `supports` is set on the block** as attribute + preset class, never in SCSS. → [Setting block properties](#setting-block-properties-presets-over-scss-hard-rule)
14. **Pattern source files ship no dead media** — no `src=""`, no install-specific attachment IDs. → [Pattern](#pattern-patternsslugphp)

## File structures

**Build-pipeline rule (applies to ALL blocks).** Every `.scss` file must be `import`ed by a JS entry (`index.js`, `script.js`, `view.js`, `edit.js`, etc.) listed in `block.json` — otherwise webpack does not compile it and the block renders unstyled. The example reference is `assets/example-blocks/`. Each `block.json` script key produces a matching `style-{handle}.css` (e.g. `script` → `style-script.css`, `viewScript` → `style-view.css`, `editorScript` → `style-index.css`), which must be listed in `style` / `viewStyle` / `editorStyle`.

Set `"ignoreScripts": ["script"]` (or similar) only when that script is SCSS-only (no real frontend JS) — `ignoreScripts` suppresses script execution while still letting webpack build the CSS. If the script has real frontend JS, omit `ignoreScripts` so it loads.

### Block JS/CSS keys — what each file is for

Registration is type-agnostic: native (`src/blocks/`) and ACF (`src/blocks-acf/`) blocks loop the **same** key set (`core/Factories/RegisterBlocks.php`). Both use this model.

| `block.json` key   | File                                  | Context           | Purpose                                                                                                                                       |
| ------------------ | ------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `editorScript`     | `index.js`                            | Editor only       | Block registration + (native) the `edit.js` component. Imports editor SCSS.                                                                   |
| `editorStyle`      | `index.css`                           | Editor only       | Editor-only appearance.                                                                                                                       |
| `script`           | `script.js`                           | Editor + frontend | **CSS entry** (`import './style.scss';`). Carries real JS only for a **native** block that needs the same behavior live in the editor canvas. |
| `style`            | `style-script.css`, `style-index.css` | Editor + frontend | Shared CSS. **Array** when `style.scss` is imported by both `script.js` and `index.js` — webpack emits one file per entry, so list both.      |
| `viewScript`       | `view.js`                             | **Frontend only** | **The block's own frontend behavior lives here** — scoped to the block, never shipped to the editor.                                          |
| `viewStyle`        | `view.css`                            | Frontend only     | Frontend-only CSS (not loaded in editor).                                                                                                     |
| `viewScriptModule` | `view.js` (ESM)                       | Frontend only     | Same as `viewScript` but registered as an ES module — use only when the block genuinely needs native ESM.                                     |

**Rules (HARD):**

1. **A block's frontend JS lives in the block as `view.js` (`viewScript`)** — not in `src/scripts/modules/`, not pushed into the editor via `script`. One block = one folder for its markup, styles, AND scripts.
2. **`src/scripts/modules/` is the global/site-wide frontend layer** (nav, scroll, fades, utils — bootstrapped via `app.js`), most of it not block-related. Put code there only when it's genuinely site-global. Block behavior never goes here; a util shared by 2+ blocks is the rare exception, and even then it's a shared helper, not block code.
3. **`script.js` is the SCSS entry** — it imports `style.scss` so webpack builds `style-script.css` (which feeds the critical-CSS inliner in `core/WP/AcfBlocks.php`). It stays even when the block has frontend JS; the behavior goes in `view.js`, not here.
4. **`ignoreScripts` = "this key has no JS to run"** (build the CSS, don't enqueue an empty handle). Set it for `script` on any block whose frontend JS is in `view.js` or which has none. It does NOT make `script.js` permanently CSS-only — it's about whether _that key_ carries runnable JS.

**ACF vs native — the only divergence.** ACF blocks render ACF's **field form** in the editor, not the Twig output — so frontend behavior _always_ goes in `view.js`/`viewScript` (`script`-as-JS would load in an editor with nothing to bind to). Native blocks render the real block via `edit.js`, so they may use `script` (drop `ignoreScripts`) **only** when the identical behavior must run live in the editor canvas. Default for both: behavior → `view.js`.

### Custom WP Block (`src/blocks/{name}/`)

Reference layout: `assets/example-blocks/blocks/example/`. Full file list:

```
block.json        # metadata, API v3, category: chisel-blocks. Lists every JS entry (editorScript, script, viewScript) and the matching style files.
index.js          # editor registration — must `import './style.scss'` (or `editor.scss`) to compile editor CSS
edit.js           # React editor component
save.js           # React save component (omit if server-rendered via `render.php`)
script.js         # editor + frontend webpack entry. Must `import './style.scss'` so webpack builds `style-script.css`. Add to `ignoreScripts: ["script"]` if SCSS-only.
view.js           # frontend-only webpack entry. Must `import './view.scss'` if those styles exist.
style.scss        # shared editor + frontend styles — imported by both index.js AND script.js, which produces TWO outputs (style-index.css + style-script.css); list both in "style" array
view.scss         # frontend-only styles — imported by view.js
editor.scss       # editor-only — imported by edit.js / index.js
render.php        # optional — server-side render (use with `"render": "file:./render.php"` in block.json; replaces save.js)
init.php          # optional — server-side registration (e.g. for child blocks needing REST/MCP validation)
```

`script.js` is included even though it often just contains `import './style.scss';` — without it, webpack has no entry for the shared frontend styles. See `assets/example-blocks/blocks/example/script.js` for the canonical one-line example.

### ACF Block (`src/blocks-acf/{name}/`)

```
block.json              # metadata with "acf" key + renderCallback; set "script": "file:./script.js", "style": ["file:./style-script.css"]. Add "ignoreScripts": ["script"] ONLY when script.js is SCSS-only.
{name}.twig             # Twig template
style.scss              # styles — must be `import`ed by script.js so webpack builds style-script.css
script.js               # REQUIRED — webpack entry. Even if only `import './style.scss';`. Omit and SCSS never compiles → block renders unstyled.
view.js                 # frontend-only JS (viewScript) — the block's own interactivity lives HERE, not src/scripts/modules/. Add only when the block is interactive.
view.scss               # frontend-only CSS (viewStyle) — imported by view.js. Optional.
acf-json/*.json         # ACF field group — auto-loads from this folder, no registration needed
```

See [create-acf-block](.claude/skills/chisel-create-acf-block/SKILL.md) for the full procedure and required block.json keys — always load it before scaffolding a new ACF block. For custom WP blocks see [create-block](.claude/skills/chisel-create-block/SKILL.md).

**ACF field group naming (HARD RULE).** Keys must be hex hashes, filename = group key, field `name`s must be namespace-prefixed (block initials → `bp_heading`), `label`s stay human. Full spec, prefix-derivation cases, per-context prefix sources, and example: **[acf-naming.md](.claude/chisel/reference/acf-naming.md)** — the canonical, all-context rule. Read it before authoring any field group JSON.

### ACF field data shape

**Load-bearing — applies any time you seed an ACF block.** Markup is `wp:chisel/{name}`, NOT `wp:acf/{name}` — Chisel uses `register_block_type()`. Every `data` field needs a `_{name}: "field_key"` partner. ACF resolves values via these key-pointers; without them `get_fields()` returns empty. Repeaters need `items: N`, `_items: "field_B"` plus every sub-field per row with its key (field names below use the prefix rule above):

```json
"data": {
  "bp_heading": "Hello", "_bp_heading": "field_A",
  "bp_steps": 2, "_bp_steps": "field_B",
  "bp_steps_0_quote": "first",  "_bp_steps_0_quote": "field_C",
  "bp_steps_1_quote": "second", "_bp_steps_1_quote": "field_C"
}
```

### ACF field validation defaults

Default `"required": 0` on all fields and `"min": 0` on repeaters. Required fields and min-row constraints fire validation errors in the editor when the block is first inserted (before the editor reads serialized data) — confusing for editors and blocks the page from saving. If a field is genuinely required, enforce it in Twig (skip rendering the card) rather than at the ACF layer.

### Pattern (`patterns/{slug}.php`)

```php
<?php
/**
 * Title: Pattern Name
 * Slug: chisel/{slug}
 * Categories: chisel-patterns/{category}
 * Description: What this pattern does
 * Keywords: keyword1, keyword2
 *
 * @package Chisel
 */
?>
<!-- block markup with p-{slug} root wrapper -->
```

**Pattern source files never contain dead media (HARD RULE).** `patterns/{slug}.php` must not ship `src=""`, empty `<figure>`s, or `mediaId`/`id` attrs pointing at site-specific attachments — those IDs don't exist on other installs. In the pattern file, omit the `id` attr and reference a theme-shipped placeholder: `<img src="<?php echo esc_url( get_stylesheet_directory_uri() ); ?>/assets/images/placeholders/{name}.jpg" alt="">` (drop the file into `assets/images/placeholders/`). Attachment IDs and upload URLs belong on the **seeded page** (written via MCP), never in the pattern file.

## Block naming and classes

| Thing | Form |
| --- | --- |
| Block name | `chisel/{block-name}` |
| Block category | `chisel-blocks` |
| CSS class | `b-{block-name}` + BEM (`__element`, `--modifier`) |
| JS hook class | `js-{block-name}` — separate from the CSS class, never select on the styling class |
| State classes | `is-*`, `has-*` |
| Translation | `__('text', 'chisel')` |

Pattern classes are `p-{slug}` — see [Root wrapper rule](#root-wrapper-rule). The full prefix set across every layer (`c-`, `o-`, `u-`, `b-`, `p-`) lives in [file-locations.md "Naming"](.claude/chisel/reference/file-locations.md#naming).

## Pattern categories

Built-in (registered by core): `hero`, `features`, `cta`, `testimonials`, `team`, `pricing`, `text`, `gallery`, `faq`, `stats`, `logos`. A pattern's `Categories:` header uses the namespaced form `chisel-patterns/{slug}`.

**A category must be registered before use — an unregistered slug is silently dropped and the pattern falls into "Uncategorized".** Prefer a built-in; only add a new one when none fit.

### Registering a custom category (project layer)

Never edit core's list in `core/WP/Blocks.php` — core exposes the **`chisel_block_patterns_categories`** filter. Add categories via `block_patterns_categories()` in `custom/app/WP/Blocks.php` (the `Chisel\WP\Custom\Blocks` class — create it with `HooksSingleton` and `get_instance()` it in `custom/functions.php` if absent; register the filter in `filter_hooks()`). Key by **unprefixed** slug; core prepends the `chisel-patterns/` namespace and `[Theme Name]` label.

```php
// custom/app/WP/Blocks.php — inside block_patterns_categories()
$custom_categories = array(
    'process' => array(
        'label'       => __( 'Process', 'chisel' ),
        'description' => __( 'Process / steps sections.', 'chisel' ),
    ),
);

return array_merge( $categories, $custom_categories );
```

Then a pattern can use `Categories: chisel-patterns/process`.

## Pattern slug naming (HARD RULE)

Name patterns by **function, not page** — the slug is the section type, not where it first appears: `hero` not `home-hero`, `pill-list` not `industry-pills`. Variant-qualify (`hero-split`, `cta-banner`), never page-qualify. Patterns are reusable across pages/CPTs; a page-named slug couples one to a single context. Reuse an existing pattern (or add a variant) before minting a new slug — see [section-mapping-decisions.md "Shared components rule"](.claude/chisel/reference/section-mapping-decisions.md#shared-components-rule). Page-prefix only a pattern that is genuinely one-off and page-bound.

## Root wrapper rule

Every pattern has a single root `core/group` (or `core/cover`) with class `p-{slug}`. Required for:

1. **Scoped styling** — custom class isolates pattern's inner blocks from same blocks elsewhere
2. **Structural integrity** — single root keeps pattern as one selectable unit in editor

The root wrapper also carries `"metadata":{"name":"{Pattern Title}"}` (per pattern — its human Title, matching the `Title:` header) so it shows a readable label in the editor List View instead of a generic "Group".

**Four-way sync (HARD RULE).** The pattern slug drives four names that must always match: the `Slug:` header suffix (`chisel/{slug}`), the pattern filename (`patterns/{slug}.php`), the root class (`p-{slug}`), and the SCSS file + scope (`src/styles/patterns/_{slug}.scss` scoped under `.p-{slug}`). Derive the slug from the section's **function** — never from the page the section was built for. (`p-home-hero` on a `hero-image-cta` pattern is the canonical failure: the class stops matching the slug, and when a second page reuses the section, two pattern files style the same page-named class and their SCSS collides.) Renaming a pattern renames all four in the same change. Never let two pattern files share one `p-*` class base.

**Section vertical padding lives on the outer block, not in pattern SCSS.** Set the section's top/bottom band padding as `style.spacing.padding` (`var:preset|spacing|NN` preset) on the root `core/group` — both `core/group` and `core/columns` support `spacing.padding`, so a columns-rooted section can carry it directly. Reserve pattern SCSS for inner/structural spacing the block can't express.

Pattern SCSS: `src/styles/patterns/_{slug}.scss`, scoped under `.p-{slug}`. Filenames never carry the `p-` prefix — the `patterns/` folder already provides the context (same as `patterns/{slug}.php`); the prefix belongs only to the CSS class, per BEM.

**Class only the root; target inner blocks by tag (HARD RULE).** Only the root group carries `p-{slug}`. **Never** add a BEM `__element` class to leaf/text blocks (paragraph, heading, list, image) — style them by tag from the root: `.p-{slug} h2`, `.p-{slug} p`, or by the block's own class `.p-{slug} .wp-block-media-text`. A `p-{slug}__heading` class lives only on the seeded instance, so a paragraph an editor adds later inherits nothing. Add a `p-{slug}__{name}` class to a **structural** block (inner group, columns, media-text) **only when** tag/descendant targeting can't single it out (e.g. two sibling inner groups needing different styles) — never to text elements.

## Setting block properties: presets over SCSS (HARD RULE)

**If a block's `supports` exposes a property and theme.json has a matching preset, set it on the block — not in SCSS.** Color background/text, font-size, font-family, alignment, block gap, border, spacing padding/margin: each goes on as a block attribute **plus** its preset class — `{"backgroundColor":"primary"}` → `class="… has-primary-background-color has-background"`, `{"textColor":"secondary"}` → `has-secondary-color has-text-color`, `{"fontSize":"extra-large"}` → `has-extra-large-font-size`, `is-style-primary`. Editors then see and change it in the block UI, and it stays token-backed.

Check the block's `supports` (via `xfive-blocks-block-schema`) before styling a color/size/gap/padding in SCSS. **Never set a raw hex or px on the block** — preset slugs only; if no preset exists, the value goes in tokenized SCSS, not as an inline block style.

**Reserve pattern/block SCSS for what the block can't express:** custom layout widths, line-height overrides with no preset **that differ from the global default** (theme.json already sets element/heading line-heights globally — don't restate them; see [coding-conventions.md "Don't duplicate global styles"](.claude/chisel/reference/coding-conventions.md#dont-duplicate-global-styles-hard-rule)), multi-element relationships, responsive tweaks.

Section band padding is the load-bearing case of this rule — see [Root wrapper rule](#root-wrapper-rule).

## Existing block styles

Registered in `src/scripts/editor/blocks-styles.js` — **read that file for the current list** (the project may have added/removed variants since these docs were written). Each top-level `register*Styles()` method holds one block's variants:

- `registerButtonsStyles()` → `core/button` variants (typically primary / secondary / tertiary, each with an `-outline` companion)
- `registerSpacerStyles()` → `core/spacer` size variants used by `is-style-{name}` (e.g. `tiny`, `small`, `medium`, `large`, `xlarge`, `big`)

## Existing block mods

In `src/scripts/editor/mods/` (registered via `blocks-mods.js`). Several add custom attributes or force values — **when seeding, set the attr AND its companion class together**, or the editor desyncs / the style doesn't render:

- **core.js**: adds a `disableBottomMargin` attr (toggle) to every `core/*` + `chisel/*` block. **The attr alone renders nothing** — the bottom-margin removal is done by the `u-no-margin-bottom` utility class. When seeding, set BOTH `"disableBottomMargin":true` AND `"className":"… u-no-margin-bottom"` (and include `u-no-margin-bottom` in the rendered class list). Needed on any block immediately followed by a spacer or the last child of a container (else base margin + spacer = double gap).
- **core-button.js**: adds `buttonSize`, `buttonIcon`, `buttonIconPosition` attrs to `core/button`, kept in sync with classes `is-size-{size}`, `has-icon has-icon-{name}`, `has-icon-left`. **When seeding a button icon/size, set the attr AND the class:** e.g. `{"buttonIcon":"arrow-right","className":"… has-icon has-icon-arrow-right"}`. Class-only works visually but the editor control shows empty and a later edit can wipe it. Icon `{name}` must be in `$static-icons`.
- **blocks-alignment.js**: on select, force-sets a default `align` per block from the PHP-provided `chiselEditorScripts.blocksDefaultAlignment` map. A seeded `align` on those blocks may be overwritten when the user selects the block — check the map (or just rely on it) rather than fighting it.
- **core-spacer.js**: forces every `core/spacer` to `height:"auto"` in the editor — spacer size comes ONLY from the `is-style-{size}` padding, never the `height` attr. Always seed `{"height":"auto","className":"is-style-{size}"}` — the style class is mandatory on every spacer, even for the default size (no bare spacers). See [design-tokens.md "Picking the spacer style"](.claude/chisel/reference/design-tokens.md#picking-the-spacer-style).

Editor-only UI helpers (not seed-affecting): `components/BlockEditSelector.js` (an "Edit {block}" button), `components/RenderAppender.js` (custom InnerBlocks inserter), `blocks.js` (adds `e-block-sidebar--{block}` class to the inspector), `utils.js` (icon choices for the button mod).

## Default block alignment

`blocks-alignment.js` (see [Existing block mods](#existing-block-mods)) reads a PHP-provided map. Add an entry via the `chisel_editor_scripts` filter inside `custom/app/WP/Assets.php` — the class is already registered in `custom/functions.php` via `get_instance()`. Use its existing `filter_hooks()` method; don't add hooks directly in `custom/functions.php` (see [CLAUDE.md "Architecture"](CLAUDE.md#architecture-core-vs-custom)):

```php
// custom/app/WP/Assets.php
public function filter_hooks(): void {
    add_filter( 'chisel_editor_scripts', array( $this, 'set_block_default_alignment' ) );
}

public function set_block_default_alignment( array $data ): array {
    $data['editor']['localize']['data']['blocksDefaultAlignment']['chisel/{block-name}'] = 'full';
    return $data;
}
```

The same filter carries the editor-visible icon list — see [assets-and-scripts.md "Icon system"](.claude/chisel/reference/assets-and-scripts.md#icon-system).

## Spacing between sibling blocks

Composition rule (the spacer _sizing_ math — px→style mapping, margin-sync, flex double-gap trap — lives in [design-tokens.md "Spacing between blocks"](.claude/chisel/reference/design-tokens.md#spacing-between-blocks)):

- **Default a `core/spacer` between every two sibling inner blocks** — even when Figma uses a uniform `gap`. Editors need draggable handles; `blockGap` and CSS `gap` give none and are invisible to the editor. NEVER use `blockGap` or CSS `gap` in pattern SCSS for **vertical** sibling spacing. One-off margins or section padding in pattern SCSS are fine.
- **Horizontal gutters are the exception**: gaps between columns in `core/columns` (or a grid) can't be spacers — set them ON the block via `blockGap` with a preset value (`"style":{"spacing":{"blockGap":{"left":"var:preset|spacing|{N}"}}}`). That's the correct, token-backed tool for the horizontal axis.
- **Walk the markup BEFORE serializing.** For every adjacent sibling pair, if the design shows space, insert a spacer — do this while writing, not after.
- Pair with the `disableBottomMargin` + `u-no-margin-bottom` rule in [Existing block mods](#existing-block-mods) (every block immediately followed by a spacer, and every last child of a container) or base margin + spacer = double gap.

## Mechanical check

Run before finishing any block or pattern.

1. Every `.scss` in the block folder is `import`ed by a JS entry that `block.json` lists.
2. Every `block.json` script key has its matching `style-{handle}.css` in `style` / `viewStyle` / `editorStyle`.
3. Block's frontend JS is in `view.js` (`viewScript`) — nothing block-specific added to `src/scripts/modules/`.
4. ACF block markup uses `wp:chisel/{name}`, never `wp:acf/{name}`.
5. Every seeded ACF `data` field has its `_{name}: "field_key"` partner; repeaters also have `items: N` + `_items` + every sub-field per row.
6. Field-group JSON passes [acf-naming.md "Mechanical check"](.claude/chisel/reference/acf-naming.md#mechanical-check-run-before-finishing-any-field-group).
7. Four-way sync per pattern: `Slug:` header, filename, root `p-{slug}` class, `src/styles/patterns/_{slug}.scss` scoped under `.p-{slug}`.
8. No two pattern files share a `p-*` class base; no pattern slug is page-named.
9. No BEM `__element` class on a leaf/text block — structural blocks only, and only when tag targeting can't single them out.
10. Every `core/spacer` carries `height:"auto"` AND an explicit `is-style-*` class.
11. Every seeded modded attr carries its companion class (`disableBottomMargin` + `u-no-margin-bottom`, `buttonIcon` + `has-icon-*`).
12. Each pattern's `Categories:` slug is registered (built-in, or added via `chisel_block_patterns_categories`).
13. No color, font-size, gap or padding in SCSS that the block's `supports` could carry as a preset.
14. No `src=""`, empty `<figure>`, or attachment `id` in any `patterns/*.php`.

## Related

- Which block type to pick → [section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md)
- ACF field group naming (all contexts) → [acf-naming.md](.claude/chisel/reference/acf-naming.md)
- Per-field WPML translation preferences → [acf-wpml-translation.md](.claude/chisel/reference/acf-wpml-translation.md)
- Spacer sizing, margin sync, flex double-gap trap → [design-tokens.md](.claude/chisel/reference/design-tokens.md#spacing-between-blocks)
- Where block/pattern files live → [file-locations.md](.claude/chisel/reference/file-locations.md)
- Seeding blocks into a page (silent-failure traps) → [mcp-workflow.md](.claude/chisel/reference/mcp-workflow.md)
- Pattern markup, file header and SCSS stub → [pattern-markup.md](.claude/chisel/templates/pattern-markup.md)
- ACF block file contents → [acf-block-template.md](.claude/chisel/templates/acf-block-template.md)
- Custom React block file contents → [custom-block-template.md](.claude/chisel/templates/custom-block-template.md)
- Skills: [create-block](.claude/skills/chisel-create-block/SKILL.md) · [create-acf-block](.claude/skills/chisel-create-acf-block/SKILL.md) · [create-pattern](.claude/skills/chisel-create-pattern/SKILL.md) · [extend-core-block](.claude/skills/chisel-extend-core-block/SKILL.md)
