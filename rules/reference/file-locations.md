# File Locations

Where to add things in the Chisel theme — the lookup for "which path does this go in". Owns **paths and the filter/action that registers each thing**. Does **not** own how to write what goes there ([coding-conventions.md](.claude/chisel/reference/coding-conventions.md)), the internal file structure of a block or pattern ([blocks.md](.claude/chisel/reference/blocks.md)), or the core-vs-custom architecture these paths follow ([CLAUDE.md "Architecture"](CLAUDE.md#architecture-core-vs-custom)).

## Registrations (PHP)

| Feature                                | Location                                  | Filter/Action                                       |
| -------------------------------------- | ----------------------------------------- | --------------------------------------------------- |
| Custom Post Types                      | `custom/app/WP/CustomPostTypes.php`       | `chisel_custom_post_types`                          |
| Custom Taxonomies                      | `custom/app/WP/CustomPostTypes.php`       | `chisel_custom_taxonomies`                          |
| ACF Options Pages                      | `custom/app/WP/Acf.php`                   | `chisel_acf_options_pages`                          |
| ACF Options Sub-Pages                  | `custom/app/WP/Acf.php`                   | `chisel_acf_options_sub_pages`                      |
| Custom Assets                          | `custom/app/WP/Assets.php`                | `chisel_frontend_styles`, `chisel_frontend_scripts` |
| Pattern categories                     | `custom/app/WP/Blocks.php`                | `chisel_block_patterns_categories`                  |
| Twig Functions/Filters                 | `custom/app/WP/Twig.php`                  | `chisel_twig_register_functions`                    |
| AJAX/REST Endpoints                    | `custom/app/WP/Ajax.php`                  | `chisel_ajax_routes`                                |
| Searchable post types                  | `custom/app/WP/Search.php`                | `chisel_searchable_post_types`                      |
| Timber context data                    | `custom/app/WP/Site.php`                  | `timber/context`                                    |
| Plugin features (Yoast, Woo, WPML, GF) | `custom/app/Plugins/{Plugin}/{Class}.php` | the plugin's own hooks (`wpseo_*`, `woocommerce_*`) |

**All eight `custom/app/WP/*` classes already ship and are already bootstrapped** in `custom/functions.php` — `Acf`, `Ajax`, `Assets`, `Blocks`, `CustomPostTypes`, `Search`, `Site`, `Twig`. You add a filter to an existing `filter_hooks()`; you don't create the file or the `get_instance()` line. Only a genuinely new class needs both.

`timber/context` needs no explicit priority — core registers it at the default, and custom boots afterwards, so a custom filter at the same priority runs second. (The `11` you'll see in `custom/app/WP/Site.php` is on `timber/post/classmap`, a different hook — see [twig-templating.md](.claude/chisel/reference/twig-templating.md).)

### Plugin code goes in `custom/app/Plugins/`, never `custom/app/WP/` (HARD RULE)

**The test: would this class exist if the plugin were deactivated?** If no, it is plugin code and belongs in `custom/app/Plugins/{Plugin}/{Class}.php` — namespace `Chisel\Plugins\Custom\{Plugin}\{Class}` (the autoloader strips `Custom`), `HooksSingleton`, and a `get_instance()` line in `custom/functions.php`. Mirrors `core/Plugins/{Plugin}/`. **The folder does not ship; create it.**

This covers more than the obvious integration class. A product-editor tweak, a Yoast breadcrumb override, a Gravity Forms notification template — all `Plugins/`, even though their subject is content rather than the plugin. The point is that a Woo-less or Yoast-less project can see exactly what to delete, in one folder, instead of hunting through `custom/app/WP/`.

`custom/app/WP/` is for the theme's own features — things that work with no third-party plugin installed. Some existing projects put plugin classes there because this rule didn't exist yet; that is the bug, not the precedent.

## Source code

| Thing                          | Path                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| WP Custom Blocks               | `src/blocks/{block-name}/`                                                            |
| ACF Blocks                     | `src/blocks-acf/{block-name}/`                                                        |
| Block Patterns                 | `patterns/{pattern-name}.php`                                                         |
| Frontend JS — block-specific   | `src/blocks/{name}/view.js`, `src/blocks-acf/{name}/view.js` (`viewScript`)           |
| Frontend JS — global/site-wide | `src/scripts/modules/` (nav, scroll, fades, utils — via `app.js`; NOT block behavior) |
| Editor JS (block mods)         | `src/scripts/editor/mods/`                                                            |
| Editor JS (block styles)       | `src/scripts/editor/blocks-styles.js`                                                 |
| SCSS layers                    | `src/styles/{layer}/` — see below                                                     |
| SCSS design tools              | `src/design/tools/`                                                                   |
| Design tokens                  | `theme.json`                                                                          |
| Font files                     | `assets/fonts/*.woff2`                                                                |
| Icon sources                   | `assets/icons-source/*.svg`                                                           |

Eleven SCSS layer folders ship: `generic`, `elements`, `vendor`, `objects`, `components`, `blocks`, `widgets`, `utilities`, `woo`, `wp-admin`, `wp-editor`. Read `src/styles/` rather than working from a list; cascade order is the `@use` block in `src/styles/main.scss` ([coding-conventions.md](.claude/chisel/reference/coding-conventions.md#scss--css)).

**`src/styles/patterns/` is the exception — it does not ship.** Create it on the project's first pattern, and add `@use 'patterns';` to **both** `main.scss` and `editor.scss` in the same change; without the import the partial compiles into nothing and the section renders unstyled with no error.

## Twig templates

**All Twig templates live in `views/`.** `custom/views/` exists but is unused (legacy) — edit `views/` directly. Rule owned by [twig-templating.md](.claude/chisel/reference/twig-templating.md).

| Purpose                                | Path                                                    |
| -------------------------------------- | ------------------------------------------------------- |
| Base layout                            | `views/base.twig`                                       |
| Components (header, footer, nav, etc.) | `views/components/`                                     |
| Objects (atomic — icons, badges)       | `views/objects/`                                        |
| Partials (fragments)                   | `views/partials/`                                       |
| Hierarchy templates                    | `views/*.twig` at the root — see below                  |
| CPT templates                          | `views/single-{slug}.twig`, `views/archive-{slug}.twig` |
| WooCommerce templates                  | `views/woocommerce/`                                    |
| Block templates (ACF)                  | `src/blocks-acf/{name}/{name}.twig`                     |
| Block templates (custom)               | `src/blocks/{name}/{name}.twig` (if used)               |

The `views/` root holds more than `single` / `page` / `archive`: `index`, `search`, `author`, `404`, `page-plugin`, `single-password`, plus `sidebar-blog` and `sidebar-woocommerce`. List the folder rather than assuming — the resolution order is owned by [twig-templating.md "Template hierarchy"](.claude/chisel/reference/twig-templating.md#template-hierarchy).

## ACF JSON

Global field groups: `acf-json/group_{hash}.json`.
Block-specific field groups: `src/blocks-acf/{block-name}/acf-json/group_{hash}.json`.

## Naming

- PHP namespace: `Chisel\` (core), `Chisel\WP\Custom\` (custom) — **the autoloader strips the `Custom` segment** when resolving paths. Mapping cases: [coding-conventions.md "Namespace ↔ path mapping"](.claude/chisel/reference/coding-conventions.md#namespace--path-mapping).
- CSS class prefixes: `c-` components, `o-` objects, `u-` utilities, `b-` blocks, `p-` patterns, `is-`/`has-` state — ITCSS layer order and BEM rules: [coding-conventions.md "SCSS / CSS"](.claude/chisel/reference/coding-conventions.md#scss--css).
- JS hook prefix: `js-` (separate from CSS).

## Related

- How to write the code that lives in these paths → [coding-conventions.md](.claude/chisel/reference/coding-conventions.md)
- What goes inside a block or pattern folder → [blocks.md](.claude/chisel/reference/blocks.md)
- Twig template hierarchy and global context → [twig-templating.md](.claude/chisel/reference/twig-templating.md)
- ACF JSON filename = group key, field naming → [acf-naming.md](.claude/chisel/reference/acf-naming.md)
- What lives in `theme.json` → [design-tokens.md](.claude/chisel/reference/design-tokens.md)
- Asset, icon and hook registration → [assets-and-scripts.md](.claude/chisel/reference/assets-and-scripts.md)
- Custom REST/AJAX endpoints → [rest-api.md](.claude/chisel/reference/rest-api.md)
