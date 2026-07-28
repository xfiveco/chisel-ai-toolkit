# Coding Conventions

## PHP

- Core namespace: `Chisel\`. Custom: `Chisel\WP\Custom\`.
- Use `HooksSingleton` trait for classes with hooks
- Implement `action_hooks()` and `filter_hooks()` methods
- Factory classes for registration (CPTs, taxonomies, blocks)
- WordPress Coding Standards — **`phpcs.xml` at the theme root is the source of truth; adhere to it for all PHP you write.** Run `npm run build` (includes phpcs) or `composer phpcs` to check. It deviates from stock WPCS (e.g. Yoda conditions disabled → variable on the left; short ternary allowed) — read the ruleset rather than assuming stock WPCS, and don't fight its choices. Match the ruleset on lines you write or edit; don't reflow untouched legacy code that predates a rule.

### Boot order (`functions.php` → custom singletons)

1. Composer autoload.
2. Chisel autoloader registers both `core/` and `custom/app/`.
3. Timber initializes.
4. Core singletons boot (AJAX controller, blocks, ACF, ACF blocks, assets, comments, site, sidebars, theme, CPTs, taxonomies, Twig, plugin integrations, Timber cache).
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
| `AssetsHelpers`       | Asset registration / enqueueing / dependency resolution       |
| `ImageHelpers`        | Responsive images, srcset, `ChiselImage` helpers              |
| `BlocksHelpers`       | ACF block render callback, block inline CSS                   |
| `AcfHelpers`          | ACF field group helpers                                       |
| `DataHelpers`         | Array/string sanitization, structured-data utilities          |
| `CacheHelpers`        | Timber cache expiry resolution                                |
| `AjaxHelpers`         | REST/AJAX response shaping                                    |
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
- Editor: `useBlockProps()`, `InspectorControls` for sidebar, `InnerBlocks` for nested content
- No TypeScript — pure ES6+

## SCSS / CSS

- **ITCSS**: generic → elements → objects → components → blocks → widgets → utilities
- **BEM**: `.c-component`, `.c-component--modifier`, `.c-component__element`
- **Prefixes**: `c-` components, `o-` objects, `u-` utilities, `b-` blocks, `p-` patterns, `is-`/`has-` state
- Modern Sass: `@use` and `@forward` (not `@import`)
- **Always** `@use '~design' as *;` at top of every SCSS file — use helper functions, never raw CSS vars

### Don't duplicate global styles (HARD RULE)

theme.json is the single source of truth for global element, typography, and spacing defaults — `styles.typography`, `styles.elements.hN`, `styles.elements.link`, and `settings.custom.*` cascade to every block, pattern, and component automatically. Base mixins (`src/design/tools/`) and element partials (`src/styles/elements/`) cascade the same way.

Before declaring `line-height`, `font-size`, `color`, `font-family`, margin, etc. on **any** selector — pattern, component, block, or element SCSS — check whether theme.json (or the relevant base mixin / global partial) already sets it:

- **Already set globally** → omit the declaration. Restating a global value is dead CSS that drifts out of sync when the global changes.
- **Should be global but isn't yet** → add it to theme.json (or the base mixin / element SCSS), don't repeat it per-selector.
- **Genuinely a per-selector divergence** → declare only the property that differs, never the whole block of base props (diff-only — see [assets-and-scripts.md "Overriding shared component styles"](assets-and-scripts.md#overriding-shared-component-styles-slider-base-styles)).

This applies theme-wide, not just to patterns.

### Design tool helpers

```scss
get-color('primary')        // var(--wp--preset--color--primary)
get-font-family('headings') // var(--wp--preset--font-family--headings)
get-font-size('large')      // var(--wp--preset--font-size--large)
get-gap('normal')           // var(--wp--custom--gap--normal)
get-margin('large')
get-padding('small')
get-border-radius('small')
get-line-height('medium')
get-box-shadow('3')
get-letter-spacing('loose')
get-transition()            // default 'normal'
rgba-color('primary', 50%)  // semi-transparent
px-rem(24)                  // one-off px → rem; argument is a UNITLESS number — px-rem(24), never px-rem(24px)

@include bp('large') {
} // min-width breakpoint
@include bp-down('medium'); // max-width breakpoint
```

Full tool list: `src/design/tools/`.

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

Asset URLs go through the `background-image()` mixin (in `src/design/tools/_media.scss`) — **never write raw `url('../../assets/...')` in pattern/block SCSS.** Webpack resolves `url()` from the bundle entry, not from the partial, so relative paths from a partial silently break the build. Drop the SVG/PNG flat into `assets/images/` and call `@include background-image('name')` (default extension `.svg`). **From inside an ACF/custom block** (`src/blocks*/{name}/style.scss`), pass `$is-block: true` — block SCSS lives one level deeper than pattern SCSS, and the mixin uses that flag to add the extra `../`.

### Tokenize repeated values

Any repeated dimension (width, max-width, padding step, color, shadow, radius, transition) belongs in `theme.json` + a `get-*` helper, not as a hardcoded `px-rem(…)` or hex literal. If no helper exists for the category, add the token under `settings.custom.{category}` in `theme.json` AND the matching accessor in `src/design/tools/_theme.scss`. Hardcoded values are only OK for one-off, non-repeating, non-tokenizable values (e.g. `transform: translateY(-1px)`). When in doubt, tokenize. **Shadows always via `get-box-shadow()`** — a new shadow is a new `settings.custom.box-shadow` token, never an inline `rgba(0, 0, 0, …)` composition in SCSS.

- Block styles: `src/styles/blocks/_core-{name}.scss`
- Drop new partials into the relevant folder (`src/styles/{blocks,components,elements,objects,utilities,generic,vendor,...}`) — the `_index.scss` barrels are **auto-generated by the build**; never edit them by hand

## Twig / Timber

- Base layout: `views/base.twig` with `{% block body %}`, `{% block header %}`, `{% block main %}`, `{% block footer %}`
- Components: `views/components/` — include via `{% include 'components/name.twig' %}`
- ACF block templates: `src/blocks-acf/{name}/{name}.twig`
- Context: `{{ fields }}`, `{{ block }}`, `{{ wrapper_attributes }}`, `{{ is_preview }}`
- Use `Timber::context()` for global context
- **All Twig templates in `views/`**. `custom/views/` is legacy/unused — edit `views/` directly.

### Twig rules

Never use raw PHP in Twig. Use one of:

1. Timber built-in: `{{ theme.link }}`, `{{ site.url }}`, `{{ post.link }}`
2. `function()` bridge: `{{ function('wp_head') }}`, `{{ function('get_stylesheet_directory_uri') }}`
3. Registered Twig function: `{{ get_responsive_image() }}`, `{{ get_icon() }}`, `{{ bem() }}`
4. Custom Twig function via `chisel_twig_register_functions`
