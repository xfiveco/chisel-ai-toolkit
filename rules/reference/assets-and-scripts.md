# Assets, Icons & Hooks

## Asset registration

Managed by `core/WP/Assets.php`. Add custom scripts/styles via filters in `custom/app/WP/Assets.php` (`filter_hooks()` method, `HooksSingleton` trait) — **not** in `custom/functions.php` (see [CLAUDE.md "Architecture"](CLAUDE.md#architecture-core-vs-custom)). The filter hooks below all apply:

| Context         | Styles filter                   | Scripts filter            |
| --------------- | ------------------------------- | ------------------------- |
| Frontend        | `chisel_frontend_styles`        | `chisel_frontend_scripts` |
| Frontend footer | `chisel_frontend_footer_styles` | —                         |
| Admin           | `chisel_admin_styles`           | `chisel_admin_scripts`    |
| Editor          | `chisel_editor_styles`          | `chisel_editor_scripts`   |
| Login           | `chisel_login_styles`           | `chisel_login_scripts`    |

### Config keys

- **Style**: `src`, `deps`, `ver`, `media`, `condition`, `inline`
- **Script**: `src`, `deps`, `ver`, `strategy` (defer/async), `condition`, `localization`, `inline`

Scripts default to `{'in_footer': true, 'strategy': 'defer'}`.

### Pre-enqueue filters

Modify before enqueueing: `chisel_pre_enqueue_{context}_styles/scripts`.
Per-asset control: `chisel_enqueue_{context}_style/script` — return `false` to skip.

### Performance filters

- `chisel_async_scripts` — handles to load async
- `chisel_defer_scripts` — handles to load deferred
- `chisel_preload_style` — modify style tag for preloading

### Default assets

| Context  | Styles       | Scripts                               |
| -------- | ------------ | ------------------------------------- |
| Frontend | `main.css`   | `app.js` (with REST API localization) |
| Admin    | `admin.css`  | `admin.js` (with ACF color palette)   |
| Editor   | `editor.css` | `editor.js` (with icon labels)        |
| Login    | `login.css`  | `login.js` (with logo data)           |

Handles prefixed with `chisel-`. Build outputs to `build/scripts/` and `build/styles/`. Webpack generates `.asset.php` files for automatic deps + cache-busting.

### HMR / Fast Refresh

Active when `WP_DEBUG` + `SCRIPT_DEBUG` + `WP_ENVIRONMENT_TYPE='development'`. Enqueues `build/runtime.js`, creates companion JS files for CSS hot-reload.

## Icon system

Two modes via `CHISEL_USE_ICONS_MODULE` constant:

| Mode             | Source          | Path                                 |
| ---------------- | --------------- | ------------------------------------ |
| Source (default) | Individual SVGs | `assets/icons-source/{name}.svg`     |
| Module           | Compiled sprite | `assets/icons/icons.svg#{name}-view` |

Color variants in `assets/icons-source/color/{name}.svg`.

**Usage in Twig**: `{{ get_icon({ name: 'arrow', alt: 'Next' }) }}`

### Parameters

`name` (required), `inline`, `rectangle`, `force_mono`, `alt`, `is_css`, `color`.

### CSS classes

`.o-icon`, `.o-icon--{name}`, `.o-icon--inline`, `.o-icon--color`, `.o-icon--mono`.

Monochromatic icons use CSS `mask-image` (colorable via CSS). Color icons use `background-image`.

Static icons for buttons are listed in `src/design/settings/_index.scss` as `$static-icons`. Button system uses `has-icon-{name}` classes with `icon-svg()` mixin.

### Cleaning Figma-exported SVGs

Figma's SVG export inlines `fill="var(--fill-0, #xxxxxx)"` and `width="100%"` / `height="100%"` attributes. Before saving to `assets/icons-source/{name}.svg`:

- Strip `var(--fill-…)` wrappers; set `fill="currentColor"` (or remove `fill` entirely so the icon inherits via CSS `mask`).
- Remove `width`/`height` attributes — the icon system sets them.
- Keep the `viewBox` — it's required for scaling.

## Swiper

Initialize Swiper sliders via `data-*` attributes on `.swiper.js-slider` — never hand-instantiate in JS.

| Attribute              | Purpose                                                               |
| ---------------------- | --------------------------------------------------------------------- |
| `data-slides-per-view` | Number of slides visible per row, or `"auto"` (requires fixed widths) |
| `data-space-between`   | Gap between slides (px)                                               |
| `data-arrows`          | `true` / `false`                                                      |
| `data-dots`            | `true` / `false`                                                      |
| `data-breakpoints`     | JSON for per-breakpoint overrides                                     |
| `data-args`            | JSON for any other Swiper option                                      |

`slidesPerView: "auto"` requires each slide to have a fixed width in CSS; otherwise use numeric values + `data-breakpoints`.

### Customizing default arrows

The framework renders text arrows in `.swiper-button` `::after`. To replace with custom icons:

```scss
.swiper-button {
  &::after {
    content: none;
  } // hide framework text arrow
  &::before {
    @include icon-svg('arrow-right');
  } // your icon
}
```

### Pagination

When the pagination container is a flex row, bullets need `flex-shrink: 0` or they collapse to 0 width and disappear.

## Overriding shared component styles (slider, base styles)

When restyling a selector that a global partial already styles (`src/styles/components/_slider.scss`, `_buttons.scss`, etc.):

- **Diff-only.** Read the global source first — the component partial **and** the theme.json globals that cascade in (`styles.typography`, `styles.elements.hN`, `styles.elements.link`, `settings.custom.*`). Only write rules that DIFFER from the default; never re-declare a value a partial or theme.json already sets. See [coding-conventions.md "Don't duplicate global styles"](.claude/chisel/reference/coding-conventions.md#dont-duplicate-global-styles-hard-rule).
- **Match the global selector chain to win specificity.** A global like `.swiper-navigation-wrapper .swiper-button` (0,2,0) ties with `.b-foo .swiper-button` (0,2,0) → source order wins, so the global beats your override. Mirror the chain and prepend your block scope. If you still can't outrank it, use `!important` with a one-line `// beats _slider.scss:NN` comment.
- **`!important` is OK** against vendor inline/runtime styles (Swiper, Gravity Forms) when specificity can't outrank them — but prefer specificity first.

## Chisel hooks reference

The lists below cover the load-bearing hooks. **Not exhaustive** — for less common hooks (CPT/taxonomy defaults like `chisel_default_post_type_supports_{slug}`, per-asset enqueue gates like `chisel_enqueue_frontend_script`, loader-behavior hooks like `chisel_async_scripts` / `chisel_preload_styles_start_with`, block hooks like `chisel_styles_inline_size_limit`, etc.), grep `core/` for `apply_filters` / `do_action` to find the canonical set.

### Theme setup

| Hook                           | Type   | Purpose                            |
| ------------------------------ | ------ | ---------------------------------- |
| `chisel_nav_menus`             | filter | Modify registered navigation menus |
| `chisel_sidebars`              | filter | Modify sidebar registrations       |
| `chisel_sidebar_content`       | filter | Filter sidebar widget content      |
| `chisel_custom_post_types`     | filter | Register CPTs                      |
| `chisel_custom_taxonomies`     | filter | Register taxonomies                |
| `chisel_acf_options_pages`     | filter | Register ACF options pages         |
| `chisel_acf_options_sub_pages` | filter | Register ACF options sub-pages     |

### Twig

| Hook                             | Type   | Purpose                          |
| -------------------------------- | ------ | -------------------------------- |
| `timber/locations`               | filter | Add Twig template locations      |
| `timber/context`                 | filter | Add data to global Twig context  |
| `timber/post/classmap`           | filter | Map post types to Timber classes |
| `timber/term/classmap`           | filter | Map taxonomies to Timber classes |
| `chisel_twig_register_functions` | action | Register custom Twig functions   |
| `chisel_twig_register_filters`   | action | Register custom Twig filters     |
| `chisel_twig_register_tests`     | action | Register custom Twig tests       |

### Cache

| Hook                       | Purpose                          |
| -------------------------- | -------------------------------- |
| `chisel_cache_expiry`      | Cache duration                   |
| `chisel_cache_everything`  | Cache all contexts               |
| `chisel_environment_cache` | Environment-specific cache rules |
