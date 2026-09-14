# Assets, Icons & Hooks

Asset registration filters, the icon system, Swiper wiring, and the load-bearing Chisel hooks. Owns **how** styles/scripts get enqueued and how icons and sliders are configured. Does **not** own SCSS conventions or ITCSS layering ([coding-conventions.md](.claude/chisel/reference/coding-conventions.md)), or where asset source files live ([file-locations.md](.claude/chisel/reference/file-locations.md)).

## Hard rules

1. **Register custom scripts/styles via filters in `custom/app/WP/Assets.php`** (`filter_hooks()` method, `HooksSingleton` trait) — **not** in `custom/functions.php`. → [Asset registration](#asset-registration)
2. **Overriding a shared component style is diff-only** — read the global source first, then write only the rules that differ. → [Overriding shared component styles](#overriding-shared-component-styles-slider-base-styles)
3. **Build sliders by including `components/slider.twig` with a `params` map** — never write the swiper markup or the `data-*` attributes yourself, and never hand-instantiate Swiper in JS. → [Swiper](#swiper)
4. **The hook lists below are not exhaustive** — grep `core/` for `apply_filters` / `do_action` before concluding a hook doesn't exist. → [Chisel hooks reference](#chisel-hooks-reference)

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
- **Script**: `src`, `deps`, `ver`, `strategy` (defer/async), `condition`, `localize`, `inline` — the key is `localize`, taking `{ 'name': …, 'data': … }`

Scripts default to `{'in_footer': true, 'strategy': 'defer'}`.

### Pre-enqueue filters

Modify before enqueueing: `chisel_pre_enqueue_{context}_styles/scripts`.
Per-asset control: `chisel_enqueue_{context}_style/script` — return `false` to skip.

### Performance filters

- `chisel_async_scripts` — handles to load async
- `chisel_defer_scripts` — handles to load deferred
- `chisel_preload_style` — modify style tag for preloading
- `chisel_preload_fonts` — font files under `assets/fonts/` to preload (see [Default assets](#default-assets))
- `chisel_frontend_strings` — translated strings localized as `chiselScripts.i18n` (see [Default assets](#default-assets))

### Default assets

| Context  | Styles                                            | Scripts                                                           |
| -------- | ------------------------------------------------- | ----------------------------------------------------------------- |
| Frontend | `main.css`                                        | `app.js` — localizes `chiselScripts` (`ajax` + `i18n`, see below) |
| Admin    | `admin.css`                                       | `admin.js` (with ACF color palette)                               |
| Editor   | `editor.css`                                      | `editor.js` (with icon labels)                                    |
| Login    | `login.css` (logo painted by inline CSS from PHP) | `login.js` — empty entry for project login-page behaviour         |

Handles prefixed with `chisel-`. Build outputs to `build/scripts/` and `build/styles/`. Webpack generates `.asset.php` files for automatic deps + cache-busting.

**Front-end strings do not use `@wordpress/i18n`** — `app.js` has no `wp-i18n` dependency, and importing it from `src/scripts/modules/*` or a `view.js` pulls the whole bundle onto every page. Add the string to the `chisel_frontend_strings` filter in `custom/app/WP/Assets.php` and read it as `chiselScripts?.i18n?.myKey ?? 'My text'`, the way `slider.js` and `load-more.js` do. Editor scripts keep `@wordpress/i18n`.

**Font preload.** `chisel_preload_fonts` lists the `assets/fonts/` files to preload — default `roboto-regular.woff2`. A file that doesn't exist is **silently skipped**, so after a font swap re-point it at the new body face; keep the list to above-the-fold faces.

### HMR / Fast Refresh

Active when **both** `wp_get_environment_type() === 'development'` (set `WP_ENVIRONMENT_TYPE` in `wp-config-local.php`) **and** `build/runtime.js` exists — the latter only after `npm run start`, never after `npm run build-scripts`. `WP_DEBUG` and `SCRIPT_DEBUG` play no part. Enqueues `build/runtime.js`, creates companion JS files for CSS hot-reload. The editor bundle gets no runtime script, so fast refresh never covers it.

## Icon system

Two modes:

| Mode             | Source          | Path                                      |
| ---------------- | --------------- | ----------------------------------------- |
| Source (default) | Individual SVGs | `assets/icons-source/{name}.svg`          |
| Module           | Compiled sprite | `assets/icons/icons.svg#icon-{name}-view` |

**The mode is three switches that must agree**, or PHP and SCSS disagree about where the icon lives and one side silently resolves nothing:

1. `CHISEL_USE_ICONS_MODULE` in `functions.php` (the runtime switch — `should_use_icons_module()` reads it)
2. `$use-icons-module` in `src/design/settings/_index.scss` (the SCSS switch)
3. `--use-icons-module` on the npm `start` / `build-scripts` job

**Color icons are detected by name, not by folder.** An icon whose name starts with `color-` renders as a colour icon; there is no `color/` subdirectory — the file sits flat at `assets/icons-source/color-{name}.svg`. `force_mono: true` exists to override that prefix detection when a monochrome icon happens to be named `color-…`. Animated icons are the exception that *does* use a subfolder: `assets/icons/animated/{name}.svg`.

**Usage in Twig**: `{{ get_icon({ name: 'arrow', alt: 'Next' }) }}`

### Parameters

`name` (required), `inline`, `rectangle`, `force_mono`, `alt`, `is_css`, `color`.

Passing `alt` sets `role="img"` + `aria-label`; omitting it sets `aria-hidden="true"`. Rendered output is cached per unique argument set.

### CSS classes

`.o-icon`, `.o-icon--icon-{name}` (note the `icon-` prefix), `.o-icon--inline`, `.o-icon--color`, `.o-icon--mono`, plus `.is-css` when `is_css` is set.

Monochromatic icons use CSS `mask-image` (colorable via CSS). Color icons use `background-image`.

### The three icon registries (silent-failure trap)

`src/design/settings/_index.scss` holds `$static-icons`, `$animated-icons` and `$multicolor-icons`. The `icon-svg()` mixin **only emits the `mask` / `background-image` if the name is in the matching list** — call it with an unregistered name and you still get the sizing and the background colour, but no glyph. A blank box, no Sass error. Add the name to the right list in the same change as the SVG.

`icon-svg($name, $multicolor, $animated, $is-block, $ext)` takes the same `$is-block: true` flag as `background-image()` for block SCSS one level deeper. The `icon()` mixin wraps it in a `::before`. The button system uses `has-icon-{name}` classes on top of `icon-svg()`.

### Cleaning Figma-exported SVGs

**Trap.** Figma's SVG export inlines `fill="var(--fill-0, #xxxxxx)"` and `width="100%"` / `height="100%"` attributes — saved as-is, the icon ignores CSS color and renders at the wrong size. Before saving to `assets/icons-source/{name}.svg`:

- Strip `var(--fill-…)` wrappers; set `fill="currentColor"` (or remove `fill` entirely so the icon inherits via CSS `mask`).
- Remove `width`/`height` attributes — the icon system sets them.
- Keep the `viewBox` — it's required for scaling.

## Swiper

**You never write the slider markup.** Include the shared component and pass a `params` map; the registered Twig function `slider_prepare_params()` turns every key into `data-{key}="{value}"` (arrays and objects are JSON-encoded), and `components/slider.twig` emits the `.swiper-container.js-slider-container` → `.swiper.js-slider` → `.swiper-wrapper` scaffold around your slides. `src/scripts/modules/slider.js` then picks up every `.js-slider` on the page and instantiates Swiper from those attributes.

```twig
{% include 'components/slider.twig' with {
  slides_html,
  params: {
    'slides-per-view': 1,
    'arrows': 'yes',
  }
} %}
```

`slides_html` is a pre-rendered string; each slide needs the `swiper-slide` class. Optional `slider_class_names` / `slider_container_class_names` add classes to the two wrappers. The working example is `src/blocks-acf/slider/slider.twig` — copy that shape.

Param keys are written **kebab-case**, exactly as they appear in the attribute.

### Param reference

**HARD RULE: booleans are the strings `yes` / `no`, never `true` / `false`.** `slider.js` compares `=== 'yes'`, so `true` is simply not a match — the feature stays off, silently, with no console error.

**Switches** — all take `yes` / `no` and default to `no`: `arrows`, `dots`, `loop`, `autoplay`, `center`, `auto-height`, `free-mode`, `parallax`, `scrollbar`.

**Values:**

| Param                  | Values / default                                                            |
| ---------------------- | --------------------------------------------------------------------------- |
| `type`                 | `default` — picks the `{type}SliderParams()` hook in `slider.js`            |
| `slides-per-view`      | number, or `auto` (needs fixed slide widths). Default `1`                   |
| `space-between`        | px. Default `10` — but see the trap below                                   |
| `autoplay-timeout`     | ms. Default `5000`; under 1000 is raised to 1000                            |
| `dots-dynamic`         | `0` off, else the dynamic main-bullet count                                 |
| `direction`            | `horizontal` (default) / `vertical`                                         |
| `effect`               | `slide` (default), `fade`, `cube`, `coverflow`, `flip`, `creative`, `cards` |
| `initial-slide`        | index. Default `0`                                                          |
| `speed`                | ms. Default `1000`; `0` under `prefers-reduced-motion`                      |
| `thumbnails`           | `0` off, else thumb count — slides need `data-thumbnail-url`                |
| `breakpoints`          | JSON, per-breakpoint overrides                                              |
| `args`                 | JSON merged over everything above                                           |
| `thumbs-slider-params` | JSON overrides for the generated thumbs slider                              |
| `thumbs-module-params` | JSON overrides for the generated thumbs slider                              |

`block_settings` is not an attribute — pass an ACF options group under that key and `slider_prepare_params()` maps its `slider_settings` checkboxes onto `arrows` / `dots` / `loop` / `autoplay` / `thumbnails` for you. That's how the shipped slider block works.

**Trap — `space-between` is discarded on the default slider type.** `setSliderTypeParams()` runs last, and `defaultSliderParams()` hard-sets `spaceBetween: 0`. Since `type` defaults to `default`, both `space-between` and a `spaceBetween` inside `args` are overwritten. To get a gap, add a new `{type}SliderParams()` method in `slider.js` and pass that `type`.

**Trap.** `slides-per-view: auto` requires each slide to have a fixed width in CSS; otherwise use numeric values + `breakpoints`.

Autoplay, arrows, dots, scrollbar and the autoplay pause control are all **generated by the JS** — don't author those elements in Twig.

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

**Trap.** When the pagination container is a flex row, bullets need `flex-shrink: 0` or they collapse to 0 width and disappear.

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

## Related

- SCSS conventions, ITCSS layers, don't-duplicate-globals → [coding-conventions.md](.claude/chisel/reference/coding-conventions.md)
- Where asset, icon and font source files live → [file-locations.md](.claude/chisel/reference/file-locations.md)
- Using `get_icon()` and registering Twig functions → [twig-templating.md](.claude/chisel/reference/twig-templating.md)
- Where a block's own JS/CSS goes → [blocks.md](.claude/chisel/reference/blocks.md#block-jscss-keys--what-each-file-is-for)
- Skills: [adapt-base-styles](.claude/skills/chisel-adapt-base-styles/SKILL.md) · [create-component](.claude/skills/chisel-create-component/SKILL.md)
