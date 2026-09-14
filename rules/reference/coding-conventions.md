# Coding Conventions

PHP, JavaScript, SCSS and Twig style rules for code you write in this theme, plus the design-helper API (`get-*` functions, `bp()` mixins). Owns **how** code is written. Does **not** own where files go ([file-locations.md](.claude/chisel/reference/file-locations.md)), block and pattern file structures ([blocks.md](.claude/chisel/reference/blocks.md)), or the token inventory ([design-tokens.md](.claude/chisel/reference/design-tokens.md)).

## Hard rules

1. **`phpcs.xml` at the theme root is the source of truth for PHP style** — it deviates from stock WPCS; read the ruleset rather than assuming. → [PHP](#php)
2. **Always `@use '~design' as *;` at the top of every SCSS file** — use the helper functions, never raw `var(--wp--*)`. → [SCSS / CSS](#scss--css)
3. **Don't duplicate global styles** — theme.json and base mixins cascade everywhere; restating a global value is dead CSS that drifts. → [Don't duplicate global styles](#dont-duplicate-global-styles-hard-rule)
4. **Tokenize repeated values** — any repeated dimension belongs in `theme.json` + a `get-*` helper, never a hardcoded literal. → [Tokenize repeated values](#tokenize-repeated-values)
5. **Nest breakpoints inside the rule** — never re-declare a selector in a trailing media query. → [Nest breakpoints inside the rule](#nest-breakpoints-inside-the-rule-hard-rule)
6. **Asset URLs go through the `background-image()` mixin** — a raw `url('../../assets/…')` silently breaks the webpack build. → [Asset URLs in SCSS](#asset-urls-in-scss-build-trap)
7. **Never hand-edit `_index.scss` barrels** — the build generates them; drop the partial in and it is picked up. → [Tokenize repeated values](#tokenize-repeated-values)
8. **Never use raw PHP in Twig** — use a Timber built-in, the `function()` bridge, or a registered Twig function. → [Twig rules](#twig-rules)
9. **Front-end JS strings come from `chiselScripts.i18n`**, never `@wordpress/i18n` — that package is editor-only. → [JavaScript](#javascript)
10. **A custom Twig function that returns HTML is registered `is_safe`** — otherwise autoescape renders its tags as text. → [Twig rules](#twig-rules)

## PHP

- Core namespace: `Chisel\`. Custom: `Chisel\WP\Custom\`.
- Use `HooksSingleton` trait for classes with hooks
- Implement `action_hooks()` and `filter_hooks()` methods
- Factory classes for registration (CPTs, taxonomies, blocks)
- WordPress Coding Standards — **`phpcs.xml` at the theme root is the source of truth; adhere to it for all PHP you write.** Check with `npm run phpcs` (or `npm run build`, which chains it); `npm run phpcbf` auto-fixes. There is no `composer phpcs` — `composer.json` defines no scripts. It deviates from stock WPCS (e.g. Yoda conditions disabled → variable on the left; short ternary allowed) — read the ruleset rather than assuming stock WPCS, and don't fight its choices. Match the ruleset on lines you write or edit; don't reflow untouched legacy code that predates a rule.

### Boot order (`functions.php` → custom singletons)

1. Composer autoload.
2. Chisel autoloader registers both `core/` and `custom/app/`.
3. Timber initializes.
4. Core singletons boot (AJAX controller, blocks, ACF, ACF blocks, assets, comments, site, sidebars, theme, CPTs, taxonomies, search, Twig, plugin integrations, Timber cache). The exact list and order is the `get_instance()` block in `functions.php` — read it there.
5. `custom/functions.php` boots project-specific singletons from `custom/app/WP/` via `get_instance()` calls.

### Namespace ↔ path mapping

The autoloader strips the `Custom` segment when resolving classes inside `custom/app/`. `Custom` is a namespace marker, **not** a directory name:

- `Chisel\WP\Custom\Assets` → `custom/app/WP/Assets.php`
- `Chisel\WP\Custom\Site` → `custom/app/WP/Site.php`
- `Chisel\Timber\Custom\ChiselPost` → `custom/app/Timber/ChiselPost.php`

When creating a new feature class, mirror an existing file like `custom/app/WP/Assets.php` for the namespace + `HooksSingleton` boilerplate, then add a `get_instance()` line to `custom/functions.php`.

### Existing helpers (check before writing utilities)

Helper classes in `core/Helpers/` — most have static methods. Read them before reinventing a utility:

| Helper                | Purpose                                                       |
| --------------------- | ------------------------------------------------------------- |
| `ThemeHelpers`        | Theme.json color palette access, post thumbnails registration |
| `AssetsHelpers`       | Asset enqueueing / dependency resolution, `get_font_url()`    |
| `ImageHelpers`        | Responsive images, srcset, `ChiselImage` helpers              |
| `BlocksHelpers`       | ACF block render callback, block inline CSS                   |
| `AcfHelpers`          | ACF field group helpers                                       |
| `DataHelpers`         | Array/string sanitization, structured-data utilities          |
| `CacheHelpers`        | Timber cache expiry resolution                                |
| `AjaxHelpers`         | REST/AJAX response shaping                                    |
| `LoadMoreHelpers`     | `get_context()` — the load-more template context              |
| `SearchHelpers`       | `get_searchable_post_types()` — search query scope            |
| `CommentsHelpers`     | Comment list rendering                                        |
| `YoastHelpers`        | `breadcrumbs()` and Yoast availability checks                 |
| `WoocommerceHelpers`  | WC product / category helpers                                 |
| `GravityFormsHelpers` | GF availability checks, form rendering helpers                |

JS helpers: `src/scripts/modules/utils.js` for shared frontend utilities (DOM, throttling, etc.). Import from there before writing new ones.

## JavaScript

| Context                                              | Style                                                                                                                   |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Frontend — block-specific (`view.js` / `viewScript`) | Class-based vanilla ES6, no frameworks. A block's own behavior lives in its `view.js`, never in `src/scripts/modules/`. |
| Frontend — global/site-wide (`src/scripts/modules/`) | Class-based vanilla ES6. Site-wide concerns (nav, scroll, fades, utils); not block behavior.                            |
| Editor (`edit.js`, `src/scripts/editor/`)            | React/JSX with `@wordpress/*` packages                                                                                  |
| App entry (`src/scripts/app.js`)                     | Import and instantiate the global modules                                                                               |

- Frontend: `js-*` prefixed selectors (not CSS classes), `DOMContentLoaded` bootstrap
- Frontend strings: `chiselScripts.i18n.{key}`, never `@wordpress/i18n` — [assets-and-scripts.md "Default assets"](.claude/chisel/reference/assets-and-scripts.md#default-assets)
- Frontend motion: under `prefers-reduced-motion` cut durations to `1ms`, not `0` — `transitionend` / `onfinish` callbacks that commit state must still fire (the shipped accordion and slider do this)
- Editor: `useBlockProps()`, `InspectorControls` for sidebar, `InnerBlocks` for nested content; `@wordpress/i18n` is fine here
- No TypeScript — pure ES6+

## SCSS / CSS

- **ITCSS**: generic → elements → vendor → objects → components → blocks → widgets → utilities — the cascade order is the `@use` list in `src/styles/main.scss`
- **BEM**: `.c-component`, `.c-component--modifier`, `.c-component__element`
- **Prefixes**: `c-` components, `o-` objects, `u-` utilities, `b-` blocks, `p-` patterns, `is-`/`has-` state
- Modern Sass: `@use` and `@forward` (not `@import`)
- **Always** `@use '~design' as *;` at top of every SCSS file — use helper functions, never raw CSS vars
- **Block partials that can contain other blocks target direct children (`>`)**, not descendants — `_core-details.scss` uses `> *:not(summary)` because `*:not(summary)` indented every block nested inside. (Pattern SCSS is different: a pattern owns its whole tree, so `.p-{slug} h2` is right — [blocks.md "Root wrapper rule"](.claude/chisel/reference/blocks.md#root-wrapper-rule).)
- **Anything that can be wider than the viewport scrolls inside itself** — `overflow-x: auto` on the element, never on the page. Chisel already does this for `core/table` (`u-table-responsive`, added by `Blocks::render_block()`, styled in `utilities/_table.scss`), `core/code` and `core/preformatted`; give a wide embed, chart or custom block the same treatment
- Zero-specificity defaults go in `:where()` (`_core-group.scss`, `rail-children()`) so a block's own preset or inline style wins without `!important`; to beat a core layout rule, add a second class — [blocks.md "Wide and full width"](.claude/chisel/reference/blocks.md#wide-and-full-width)

### Don't duplicate global styles (HARD RULE)

theme.json is the single source of truth for global element, typography, and spacing defaults — `styles.typography`, `styles.elements.hN`, `styles.elements.link`, and `settings.custom.*` cascade to every block, pattern, and component automatically. Base mixins (`src/design/tools/`) and element partials (`src/styles/elements/`) cascade the same way.

Before declaring `line-height`, `font-size`, `color`, `font-family`, margin, etc. on **any** selector — pattern, component, block, or element SCSS — check whether theme.json (or the relevant base mixin / global partial) already sets it:

- **Already set globally** → omit the declaration. Restating a global value is dead CSS that drifts out of sync when the global changes.
- **Should be global but isn't yet** → add it to theme.json (or the base mixin / element SCSS), don't repeat it per-selector.
- **Genuinely a per-selector divergence** → declare only the property that differs, never the whole block of base props (diff-only — see [assets-and-scripts.md "Overriding shared component styles"](.claude/chisel/reference/assets-and-scripts.md#overriding-shared-component-styles-slider-base-styles)).

This applies theme-wide, not just to patterns.

### Design tool helpers

**These are the shape, not the roster.** `src/design/tools/_theme.scss` defines fourteen accessors and `_breakpoints.scss` four breakpoint mixins — read those two files before assuming a helper is missing, and add a new one there rather than reaching for a raw `var(--wp--*)`.

```scss
get-color('primary')        // var(--wp--preset--color--primary)
get-gradient('primary-secondary')
get-font-family('headings') // var(--wp--preset--font-family--headings)
get-font-size('large')      // var(--wp--preset--font-size--large)
get-gap('normal')           // var(--wp--custom--gap--normal)
get-margin('large')
get-padding('small')
get-border-radius('small')
get-border-width('tiny')
get-line-height('medium')
get-box-shadow('3')
get-letter-spacing('loose')
get-transition()            // default 'normal'
get-layout-size('content')  // var(--wp--style--global--content-size)
rgba-color('primary', 50%)  // semi-transparent
px-rem(24)                  // one-off px → rem

@include bp('large') {
} // min-width
@include bp-down('medium') {
} // max-width
@include bp-only('medium') {
} // that breakpoint only
@include bp-between('small', 'large') {
} // a range
```

`px-rem()` strips a unit off its argument, so `px-rem(24px)` compiles fine — but write it unitless (`px-rem(24)`) to match the rest of the codebase. Don't "fix" an existing `px-rem(24px)`; it isn't broken.

### Nest breakpoints inside the rule (HARD RULE)

Put responsive overrides **inside** the selector via a nested `@include bp(...)` / `@include bp-down(...)` — never re-declare the selector in a separate media query at the bottom of the file. Sass supports nested media queries, so each property's responsive variant lives next to its base value:

```scss
.c-card {
  padding: get-padding('large');

  @include bp-down('medium') {
    padding: get-padding('small');
  }
}
```

Duplicating the selector in a trailing media block splits one element's styles across two places — the base and the responsive override drift out of sync when either changes, and the reader has to scroll to reconcile them. One selector, one block.

### Asset URLs in SCSS (build trap)

Asset URLs go through the `background-image()` mixin (in `src/design/tools/_media.scss`) — **never write raw `url('../../assets/...')` in pattern/block SCSS.** Webpack resolves `url()` from the bundle entry, not from the partial, so relative paths from a partial silently break the build. Drop the SVG/PNG flat into `assets/images/` and call `@include background-image('name')` (default extension `.svg`). **From inside an ACF/custom block** (`src/blocks*/{name}/style.scss`), pass `$is-block: true` — block SCSS lives one level deeper than pattern SCSS, and the mixin uses that flag to add the extra `../`. A fourth flag, `$is-icon: true`, points the same mixin at `assets/icons/` instead of `assets/images/`.

### Tokenize repeated values

Any repeated dimension (width, max-width, padding step, color, shadow, radius, transition) belongs in `theme.json` + a `get-*` helper, not as a hardcoded `px-rem(…)` or hex literal. If no helper exists for the category, add the token under `settings.custom.{category}` in `theme.json` AND the matching accessor in `src/design/tools/_theme.scss`. Hardcoded values are only OK for one-off, non-repeating, non-tokenizable values (e.g. `transform: translateY(-1px)`). When in doubt, tokenize. **Shadows always via `get-box-shadow()`** — a new shadow is a new `settings.custom.box-shadow` token, never an inline `rgba(0, 0, 0, …)` composition in SCSS.

- Block styles: `src/styles/blocks/_core-{name}.scss`
- Drop new partials into the relevant folder (`src/styles/{blocks,components,elements,objects,utilities,generic,vendor,...}`) — the `_index.scss` barrels are **auto-generated by the build**; never edit them by hand

## Twig / Timber

Template hierarchy, base layout, components, global context, Timber built-ins, custom Twig functions, and the **`views/`-only** rule (`custom/views/` is legacy — never edit it) are all owned by [twig-templating.md](.claude/chisel/reference/twig-templating.md). Conventions not covered there:

- ACF block template context: `{{ fields }}`, `{{ block }}`, `{{ wrapper_attributes }}`, `{{ is_preview }}` — template lives at `src/blocks-acf/{name}/{name}.twig`
- Use `Timber::context()` for global context

### Twig rules

Never use raw PHP in Twig. Use one of:

1. Timber built-in: `{{ theme.link }}`, `{{ site.url }}`, `{{ post.link }}`
2. `function()` bridge: `{{ function('wp_head') }}`, `{{ function('get_stylesheet_directory_uri') }}`
3. Registered Twig function: `{{ get_responsive_image() }}`, `{{ get_icon() }}`, `{{ bem() }}` — the full roster is `register_functions()` in `core/WP/Twig.php`
4. Custom Twig function via `chisel_twig_register_functions` — one that returns HTML is registered `is_safe`: [twig-templating.md "Autoescaping"](.claude/chisel/reference/twig-templating.md#autoescaping)

Twig style is linted separately: `npm run twigcs` (config `twig_cs.php`), also chained into `npm run build`.

## Related

- Where each kind of file goes → [file-locations.md](.claude/chisel/reference/file-locations.md)
- Token inventory, protected slugs, width ladder → [design-tokens.md](.claude/chisel/reference/design-tokens.md)
- Template hierarchy, Timber context, custom Twig functions → [twig-templating.md](.claude/chisel/reference/twig-templating.md)
- Block/pattern file structures and the build-pipeline rule → [blocks.md](.claude/chisel/reference/blocks.md)
- Asset registration, icons, Swiper, Chisel hooks → [assets-and-scripts.md](.claude/chisel/reference/assets-and-scripts.md)
- Skills: [adapt-base-styles](.claude/skills/chisel-adapt-base-styles/SKILL.md) · [create-component](.claude/skills/chisel-create-component/SKILL.md) · [theme-json](.claude/skills/chisel-theme-json/SKILL.md)
