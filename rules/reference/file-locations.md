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

**All Twig templates live in `views/`.** `custom/views/` exists but is unused (legacy) — edit `views/` directly. Rule owned by [twig-templating.md](.claude/chisel/reference/twig-templating.md).

| Purpose                                | Path                                                    |
| -------------------------------------- | ------------------------------------------------------- |
| Base layout                            | `views/base.twig`                                       |
| Components (header, footer, nav, etc.) | `views/components/`                                     |
| Objects (atomic — icons, badges)       | `views/objects/`                                        |
| Partials (fragments)                   | `views/partials/`                                       |
| Single post/page templates             | `views/{single\|page\|archive}.twig`                      |
| CPT templates                          | `views/single-{slug}.twig`, `views/archive-{slug}.twig` |
| Block templates (ACF)                  | `src/blocks-acf/{name}/{name}.twig`                     |
| Block templates (custom)               | `src/blocks/{name}/{name}.twig` (if used)               |

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
