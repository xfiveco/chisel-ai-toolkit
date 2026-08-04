# Blocks

Build-pipeline requirements, seeding shapes, and naming rules for the four block-ish things Chisel ships: native blocks, ACF blocks, patterns, and pattern categories. Owns the **rules that no single file states** — the constraints you only learn by reading three files and inferring, or by getting burned. Does **not** own which type to pick ([section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md)), ACF field-group naming ([acf-naming.md](.claude/chisel/reference/acf-naming.md)), or spacer sizing ([design-tokens.md](.claude/chisel/reference/design-tokens.md#spacing-between-blocks)). Step-by-step scaffolding lives in the skill linked from each section.

## Read these first

**Read the source, don't copy from here.** This doc deliberately does not reproduce the lists below. They ship with Chisel or change per project, so a copy is stale the moment either moves — and a stale copy gives no sign it's stale. Each row is one targeted Read, not a search.

| What you need | Read | Why it isn't written here |
| --- | --- | --- |
| Registered pattern categories | `core/WP/Blocks.php` → `set_properties()` → `$block_patterns_categories` | Ships with Chisel; changes on theme upgrade |
| Registered block styles | `src/scripts/editor/blocks-styles.js` | Per project — half the time the variant you want exists |
| Registered block mods | `src/scripts/editor/mods/`, imported by `blocks-mods.js` | Per project |
| Native block file layout | `assets/example-blocks/blocks/example/` (client-rendered) and `blocks/example-server-side/` (server-rendered) | Ships with Chisel; the canonical reference |
| ACF block file layout | `src/blocks-acf/slider/` — a real, working block. `assets/example-blocks/blocks-acf/example/` shows the maximal file set, but **its `renderCallback` is stale**; don't copy that key from it | Ships with Chisel |
| Canonical `block.json` shape | native → `assets/example-blocks/blocks/example/block.json`; ACF → `src/blocks-acf/slider/block.json` | Same |
| A block's actual `supports` | `xfive-blocks-block-schema` | Runtime truth, including core blocks |

## Hard rules

Each one breaks silently — no error, wrong output. None of them is discoverable by reading a single file, which is why they are written down.

1. **Every `.scss` is imported by a JS entry listed in `block.json`** — else webpack never compiles it and the block renders unstyled. → [File structures](#file-structures)
2. **`style.scss` must be imported by an entry `block.json` lists — which entry differs by type.** ACF blocks: `script.js`, their only entry. Native blocks: `index.js` is enough, and `script.js` is optional. → [Block JS/CSS keys](#block-jscss-keys--what-each-file-is-for)
3. **A block's frontend JS lives in its own `view.js` (`viewScript`)** — never `src/scripts/modules/`, never pushed to the editor via `script`. → [Block JS/CSS keys](#block-jscss-keys--what-each-file-is-for)
4. **`ignoreScripts` means "this key has no JS to run"**, not "this file is CSS-only forever". → [Block JS/CSS keys](#block-jscss-keys--what-each-file-is-for)
5. **`init.php` and `acf-json/` are read from `src/`, every other block file from `build/`.** → [Source vs build](#source-vs-build-hard-rule)
6. **ACF field-group naming**: hex-hash keys, filename = group key, namespace-prefixed field `name`s. → [acf-naming.md](.claude/chisel/reference/acf-naming.md)
7. **Every seeded ACF `data` field needs its `_{name}: "field_key"` partner** — without it `get_fields()` returns empty. → [ACF field data shape](#acf-field-data-shape)
8. **A pattern category must be registered before use** — an unregistered slug is dropped and the pattern lands in "Uncategorized". → [Pattern categories](#pattern-categories)
9. **Pattern slugs name the section's function, not the page it came from.** → [Pattern slug naming](#pattern-slug-naming-hard-rule)
10. **Four-way sync**: `Slug:` header, filename, root class, SCSS file + scope all track the pattern slug. → [Root wrapper rule](#root-wrapper-rule)
11. **Class only the root; target inner blocks by tag** — a BEM `__element` class on a text block only exists on the seeded instance. → [Root wrapper rule](#root-wrapper-rule)
12. **When seeding a modded block, set the attr AND its companion class** — the attr alone renders nothing. → [Existing block mods](#existing-block-mods)
13. **Default a `core/spacer` between sibling inner blocks**; never `blockGap`/CSS `gap` for vertical spacing. → [Spacing between sibling blocks](#spacing-between-sibling-blocks)
14. **A property the block `supports` is set on the block** as attribute + preset class, never in SCSS. → [Setting block properties](#setting-block-properties-presets-over-scss-hard-rule)
15. **Pattern source files ship no dead media** — no `src=""`, no install-specific attachment IDs. → [Pattern](#pattern-patternsslugphp)

## File structures

**Build-pipeline rule (applies to ALL blocks).** Every `.scss` file must be `import`ed by a JS entry (`index.js`, `script.js`, `view.js`, `edit.js`, etc.) listed in `block.json` — otherwise webpack does not compile it and the block renders unstyled. Each `block.json` script key produces a matching `style-{handle}.css` (e.g. `script` → `style-script.css`, `editorScript` → `style-index.css`, `viewScript` → `style-view.css`), which must be listed in `style` / `viewStyle` / `editorStyle`. When one `.scss` is imported by **two** entries, webpack emits **two** files and `style` must be an array naming both — that is why the shipped examples declare `"style": ["file:./style-index.css", "file:./style-script.css"]`.

Set `"ignoreScripts": ["script"]` (or similar) only when that script is SCSS-only (no real frontend JS) — `ignoreScripts` suppresses script registration while still letting webpack build the CSS. If the script has real frontend JS, omit `ignoreScripts` so it loads. In Fast Refresh / dev mode the script is registered anyway, so changes stay watchable.

**Critical CSS is inlined per block type, from different files.** For blocks used on the page, Chisel inlines the block's CSS and dequeues the rest: ACF blocks inline `style-script.css` (`core/WP/AcfBlocks.php`), native blocks inline `style-index.css` (`core/WP/Blocks.php`). Registered handles follow `block-{acf|wp}-{name}-{key}`. A block whose SCSS never reached the matching file gets no inlined CSS and no error.

### Source vs build (HARD RULE)

Chisel registers blocks by scanning `build/blocks/` and `build/blocks-acf/` — `src/` is not what WordPress reads, which is why a new block does not appear until the build runs. **Two exceptions read from `src/`:**

- `src/blocks{-acf}/{name}/init.php` — included after registration (`core/Factories/RegisterBlocks.php`), for custom server-side logic such as child-block registration.
- `src/blocks-acf/{name}/acf-json/` — the ACF load *and* save path (`core/WP/AcfBlocks.php`), so field groups edited in the ACF UI write straight back to source.

Putting either under `build/` means it is silently never loaded, and the build wipes it.

### Block JS/CSS keys — what each file is for

Registration is type-agnostic: native (`src/blocks/`) and ACF (`src/blocks-acf/`) blocks loop the **same** key set (`core/Factories/RegisterBlocks.php`). Both use this model.

| `block.json` key | File                                  | Context           | Purpose                                                                                                                                       |
| ---------------- | ------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `editorScript`   | `index.js`                            | Editor only       | Block registration + (native) the `edit.js` component. Imports editor SCSS.                                                                   |
| `editorStyle`    | `index.css`                           | Editor only       | Editor-only appearance.                                                                                                                       |
| `script`         | `script.js`                           | Editor + frontend | **CSS entry** (`import './style.scss';`). Carries real JS only for a **native** block that needs the same behavior live in the editor canvas. |
| `style`          | `style-script.css`, `style-index.css` | Editor + frontend | Shared CSS. **Array** when `style.scss` is imported by both `script.js` and `index.js` — webpack emits one file per entry, so list both.       |
| `viewScript`     | `view.js`                             | **Frontend only** | **The block's own frontend behavior lives here** — scoped to the block, never shipped to the editor.                                          |
| `viewStyle`      | `view.css`                            | Frontend only     | Frontend-only CSS (not loaded in editor).                                                                                                     |

Those six are the whole set Chisel processes. **`viewScriptModule` is not among them** — the factory's module branch is unreachable, so an ESM view script gets no Chisel-managed handle, no `ignoreScripts` support, and no critical-CSS pairing. Use `viewScript`.

**Rules (HARD):**

1. **A block's frontend JS lives in the block as `view.js` (`viewScript`)** — not in `src/scripts/modules/`, not pushed into the editor via `script`. One block = one folder for its markup, styles, AND scripts.
2. **`src/scripts/modules/` is the global/site-wide frontend layer** (nav, scroll, fades, utils — bootstrapped via `app.js`), most of it not block-related. Put code there only when it's genuinely site-global. Block behavior never goes here; a util shared by 2+ blocks is the rare exception, and even then it's a shared helper, not block code.
3. **`script.js` is the SCSS entry on an ACF block** — it imports `style.scss` so webpack builds `style-script.css`, which is also what the ACF critical-CSS inliner reads. It stays even when the block has frontend JS; the behavior goes in `view.js`, not here. **On a native block it is optional**: `index.js` already imports `style.scss` and emits `style-index.css`, which is what the native inliner reads. Add `script.js` to a native block only to put shared CSS in a `script`-keyed bundle as well — then `style` becomes an array of both outputs.
4. **`ignoreScripts` = "this key has no JS to run"** (build the CSS, don't enqueue an empty handle). Set it for `script` on any block whose frontend JS is in `view.js` or which has none. It does NOT make `script.js` permanently CSS-only — it's about whether _that key_ carries runnable JS.

**ACF vs native — the only divergence.** ACF blocks render ACF's **field form** in the editor, not the Twig output — so frontend behavior _always_ goes in `view.js`/`viewScript` (`script`-as-JS would load in an editor with nothing to bind to). Native blocks render the real block via `edit.js`, so they may use `script` (drop `ignoreScripts`) **only** when the identical behavior must run live in the editor canvas. Default for both: behavior → `view.js`.

### Custom WP Block (`src/blocks/{name}/`)

**Copy the layout from `assets/example-blocks/blocks/example/`** — client-rendered, with `save.js`. For a server-rendered block copy `blocks/example-server-side/` instead: it swaps `save.js` for `render.php` (declared as `"render": "file:./render.php"`) plus a `render.twig` the PHP renders through Timber.

Only the non-obvious files are listed here; the example folder is the file list.

| File | When | The part that isn't obvious |
| --- | --- | --- |
| `style.scss` | always | Imported by `index.js` → emits `style-index.css` → `"style": "file:./style-index.css"`. That single output is what the shipped `chisel/accordion` block uses. |
| `script.js` | optional | Only to *also* bundle the shared CSS under the `script` key (or to run JS in the editor canvas). Then `style.scss` is imported by two entries, webpack emits two files, and `"style"` must be an array of both. A native block without it is normal — do not add it by reflex. |
| `view.js` | interactive blocks | Frontend-only behavior, class-based vanilla ES6. Must `import './view.scss'` if those styles exist. |
| `editor.scss` | editor-only look | Imported by `edit.js` / `index.js`. |
| `render.php` + `render.twig` | server-rendered | Replaces `save.js`. |
| `init.php` | optional | Server-side logic, e.g. registering child blocks so REST/MCP validates them. **Read from `src/`** — see [Source vs build](#source-vs-build-hard-rule). |

### ACF Block (`src/blocks-acf/{name}/`)

**Copy from `src/blocks-acf/slider/`** — a real, working block, and the **minimum that works**: `block.json`, `{name}.twig`, `script.js`, `style.scss`. `assets/example-blocks/blocks-acf/example/` shows the maximal set (adding `index.js`/`editorScript`, `editor.scss`, `critical.scss`, `init.php`) but its `renderCallback` value is out of date — take that key from the slider block or from the table below.

| File | When | The part that isn't obvious |
| --- | --- | --- |
| `block.json` | always | Needs the `"acf"` key with `"renderCallback": "\\Chisel\\Helpers\\BlocksHelpers::acf_block_render"` — **identical on every ACF block**. Add `"ignoreScripts": ["script"]` only while `script.js` is SCSS-only. |
| `{name}.twig` | always | The frontend render. ACF shows the **field form** in the editor, not this. |
| `script.js` | **always** | Webpack entry for `style.scss` → `style-script.css`, which is also what the ACF critical-CSS inliner reads. Omit it and the block renders unstyled. |
| `view.js` | interactive blocks | The block's own behavior — never `src/scripts/modules/`. Sliders are the exception: including `components/slider.twig` gets you the whole Swiper wiring, so a slider block usually needs no `view.js` at all ([assets-and-scripts.md "Swiper"](.claude/chisel/reference/assets-and-scripts.md#swiper)). |
| `acf-json/*.json` | always | Auto-loads, no registration. **Read from and saved back to `src/`** — see [Source vs build](#source-vs-build-hard-rule). |
| `index.js` / `editor.scss` | editor-only styling | Present in the example; skip unless the block needs editor-specific appearance. |

See [create-acf-block](.claude/skills/chisel-create-acf-block/SKILL.md) for the full procedure — always load it before scaffolding a new ACF block. For custom WP blocks see [create-block](.claude/skills/chisel-create-block/SKILL.md).

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

**Read the registered list from `core/WP/Blocks.php` → `set_properties()` → `$block_patterns_categories`** (the theme ships a set covering the usual section types). A pattern's `Categories:` header uses the namespaced form `chisel-patterns/{slug}`, while the PHP array is keyed by the **unprefixed** slug — core prepends the namespace and a `[Theme Name]` label.

**A category must be registered before use — an unregistered slug is silently dropped and the pattern falls into "Uncategorized".** Prefer a shipped category; only add a new one when none fit.

### Registering a custom category (project layer)

Never edit core's list in `core/WP/Blocks.php` — core exposes the **`chisel_block_patterns_categories`** filter. Add categories via `block_patterns_categories()` in `custom/app/WP/Blocks.php` (the `Chisel\WP\Custom\Blocks` class — create it with `HooksSingleton` and `get_instance()` it in `custom/functions.php` if absent; register the filter in `filter_hooks()`). Key by unprefixed slug.

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

**Read `src/scripts/editor/blocks-styles.js` for the current list** — one `register*Styles()` method per block, each called from `registerBlockStyles()`. The registered set differs per project and half the time the variant you need already exists.

Two things about it that reading the list alone won't tell you:

- **Core's own `core/button` styles are unregistered at startup** (`unregisterBlockStyle('core/button', [...])`). Seeding a core style name that Chisel removed produces a class that matches no CSS, with no error. Only names in `blocks-styles.js` are real.
- **The rendered class is always `is-style-{name}`** — the `name` property, never the `label`. A style whose SCSS targets a different class registers fine and does nothing.

Adding one: [extend-core-block](.claude/skills/chisel-extend-core-block/SKILL.md).

## Existing block mods

**Read `src/scripts/editor/mods/` (imported by `blocks-mods.js`) for the current set.** Mods add custom attributes or force values, and the rule that matters is the same for all of them:

**When seeding a modded block, set the attr AND its companion class together** — or the editor desyncs and the style doesn't render. The attribute is what the editor control reads; the class is what the CSS matches. Neither implies the other.

The pairings in the shipped mods:

| Mod | Attribute | Companion class | Why you need it |
| --- | --- | --- | --- |
| `core.js` | `disableBottomMargin: true` | `u-no-margin-bottom` | On any block immediately followed by a spacer, and every last child of a container — else base margin + spacer = double gap. **The attr alone renders nothing**; the utility class does the work. |
| `core-button.js` | `buttonSize`, `buttonIcon`, `buttonIconPosition` | `is-size-{size}`, `has-icon has-icon-{name}`, `has-icon-left` | Class-only works visually, but the editor control shows empty and a later edit wipes it. Icon `{name}` must be in `$static-icons`. |
| `core-spacer.js` | `height: "auto"` (forced in editor) | `is-style-{size}` | Spacer size comes ONLY from the style class's padding, never `height`. Seed `{"height":"auto","className":"is-style-{size}"}` — the class is mandatory on every spacer, even the default size. No bare spacers. Sizing: [design-tokens.md](.claude/chisel/reference/design-tokens.md#picking-the-spacer-style). |
| `blocks-alignment.js` | `align` | — | Force-sets a default `align` per block on select, from the PHP-provided `chiselEditorScripts.blocksDefaultAlignment` map. A seeded `align` on those blocks may be overwritten when the user selects the block — rely on the map rather than fighting it. See [Default block alignment](#default-block-alignment). |

`src/scripts/editor/` also holds editor-only UI helpers that don't affect seeding — an "Edit {block}" button, a custom InnerBlocks inserter, inspector classes, and icon choices for the button mod.

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
2. Every `block.json` script key has its matching `style-{handle}.css` in `style` / `viewStyle` / `editorStyle` — as an **array** when one `.scss` feeds two entries.
3. Block's frontend JS is in `view.js` (`viewScript`) — nothing block-specific added to `src/scripts/modules/`.
4. ACF block markup uses `wp:chisel/{name}`, never `wp:acf/{name}`.
5. Every seeded ACF `data` field has its `_{name}: "field_key"` partner; repeaters also have `items: N` + `_items` + every sub-field per row.
6. Field-group JSON passes [acf-naming.md "Mechanical check"](.claude/chisel/reference/acf-naming.md#mechanical-check-run-before-finishing-any-field-group).
7. `init.php` and `acf-json/` are under `src/`, not `build/`.
8. Four-way sync per pattern: `Slug:` header, filename, root `p-{slug}` class, `src/styles/patterns/_{slug}.scss` scoped under `.p-{slug}`.
9. No two pattern files share a `p-*` class base; no pattern slug is page-named.
10. No BEM `__element` class on a leaf/text block — structural blocks only, and only when tag targeting can't single them out.
11. Every `core/spacer` carries `height:"auto"` AND an explicit `is-style-*` class.
12. Every seeded modded attr carries its companion class (`disableBottomMargin` + `u-no-margin-bottom`, `buttonIcon` + `has-icon-*`).
13. Every `is-style-*` you seeded exists in `blocks-styles.js` — core's removed styles are not available.
14. Each pattern's `Categories:` slug is registered (shipped, or added via `chisel_block_patterns_categories`).
15. No color, font-size, gap or padding in SCSS that the block's `supports` could carry as a preset.
16. No `src=""`, empty `<figure>`, or attachment `id` in any `patterns/*.php`.

## Related

- Which block type to pick → [section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md)
- ACF field group naming (all contexts) → [acf-naming.md](.claude/chisel/reference/acf-naming.md)
- Per-field WPML translation preferences → [acf-wpml-translation.md](.claude/chisel/reference/acf-wpml-translation.md)
- Spacer sizing, margin sync, flex double-gap trap → [design-tokens.md](.claude/chisel/reference/design-tokens.md#spacing-between-blocks)
- Swiper `data-*` API, icons, asset registration → [assets-and-scripts.md](.claude/chisel/reference/assets-and-scripts.md)
- Where block/pattern files live → [file-locations.md](.claude/chisel/reference/file-locations.md)
- Seeding blocks into a page (silent-failure traps) → [mcp-workflow.md](.claude/chisel/reference/mcp-workflow.md)
- Pattern markup, file header and SCSS stub → [pattern-markup.md](.claude/chisel/templates/pattern-markup.md)
- ACF block file contents → [acf-block-template.md](.claude/chisel/templates/acf-block-template.md)
- Custom React block file contents → [custom-block-template.md](.claude/chisel/templates/custom-block-template.md)
- Skills: [create-block](.claude/skills/chisel-create-block/SKILL.md) · [create-acf-block](.claude/skills/chisel-create-acf-block/SKILL.md) · [create-pattern](.claude/skills/chisel-create-pattern/SKILL.md) · [extend-core-block](.claude/skills/chisel-extend-core-block/SKILL.md)
