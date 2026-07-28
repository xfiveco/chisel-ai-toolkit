# File Locations

Where to add things in the Chisel theme.

## Registrations (PHP)

| Feature                                | Location                                  | Filter/Action                                       |
| -------------------------------------- | ----------------------------------------- | --------------------------------------------------- |
| Custom Post Types                      | `custom/app/WP/CustomPostTypes.php`       | `chisel_custom_post_types`                          |
| Custom Taxonomies                      | `custom/app/WP/CustomPostTypes.php`       | `chisel_custom_taxonomies`                          |
| ACF Options Pages                      | `custom/app/WP/Acf.php`                   | `chisel_acf_options_pages`                          |
| ACF Options Sub-Pages                  | `custom/app/WP/Acf.php`                   | `chisel_acf_options_sub_pages`                      |
| Custom Assets                          | `custom/app/WP/Assets.php`                | `chisel_frontend_styles`, `chisel_frontend_scripts` |
| Twig Functions/Filters                 | `custom/app/WP/Twig.php`                  | `chisel_twig_register_functions`                    |
| AJAX/REST Endpoints                    | `custom/app/WP/Ajax.php`                  | `chisel_ajax_routes`                                |
| Timber context data                    | `custom/app/WP/Site.php`                  | `timber/context` (priority 11+)                     |
| Plugin features (Yoast, Woo, WPML, GF) | `custom/app/Plugins/{Plugin}/{Class}.php` | the plugin's own hooks (`wpseo_*`, `woocommerce_*`) |

**Plugin-specific features** (anything keyed off a third-party plugin's hooks) go under `custom/app/Plugins/{Plugin}/` — namespace `Chisel\Plugins\Custom\{Plugin}\{Class}` (the autoloader strips `Custom`), `HooksSingleton`, registered in `custom/functions.php`. Mirrors `core/Plugins/{Plugin}/`. Don't put plugin logic in `custom/app/WP/`.

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
| SCSS components                | `src/styles/components/`                                                              |
| SCSS patterns                  | `src/styles/patterns/`                                                                |
| SCSS elements                  | `src/styles/elements/`                                                                |
| SCSS blocks                    | `src/styles/blocks/`                                                                  |
| SCSS objects                   | `src/styles/objects/`                                                                 |
| SCSS design tools              | `src/design/tools/`                                                                   |
| Design tokens                  | `theme.json`                                                                          |
| Font files                     | `assets/fonts/*.woff2`                                                                |
| Icon sources                   | `assets/icons-source/*.svg`                                                           |

## Twig templates

**All Twig templates live in `views/`.** `custom/views/` exists but is unused (legacy) — edit `views/` directly.

| Purpose                                | Path                                                    |
| -------------------------------------- | ------------------------------------------------------- |
| Base layout                            | `views/base.twig`                                       |
| Components (header, footer, nav, etc.) | `views/components/`                                     |
| Objects (atomic — icons, badges)       | `views/objects/`                                        |
| Partials (fragments)                   | `views/partials/`                                       |
| Single post/page templates             | `views/{single\|page\|archive}.twig`                    |
| CPT templates                          | `views/single-{slug}.twig`, `views/archive-{slug}.twig` |
| Block templates (ACF)                  | `src/blocks-acf/{name}/{name}.twig`                     |
| Block templates (custom)               | `src/blocks/{name}/{name}.twig` (if used)               |

## ACF JSON

Global field groups: `acf-json/group_{hash}.json`.
Block-specific field groups: `src/blocks-acf/{block-name}/acf-json/group_{hash}.json`.

## Naming

- PHP namespace: `Chisel\` (core), `Chisel\WP\Custom\` (custom). **The autoloader strips the `Custom` segment** — `Chisel\WP\Custom\Assets` → `custom/app/WP/Assets.php`, NOT `custom/app/WP/Custom/Assets.php`. See [CLAUDE.md "Architecture"](CLAUDE.md#architecture-core-vs-custom).
- CSS class prefixes: `c-` components, `o-` objects, `u-` utilities, `b-` blocks, `p-` patterns, `is-`/`has-` state
- JS hook prefix: `js-` (separate from CSS)
