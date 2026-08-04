# Header, Footer and Global Elements

Where the site-wide chrome lives and which source feeds each part of it. Owns the **what** — the file map, the element→source mapping, and the widget areas the theme already registers. Does **not** own how to adapt them to a spec ([adapt-header-footer](.claude/skills/chisel-adapt-header-footer/SKILL.md)), Twig syntax and context ([twig-templating.md](.claude/chisel/reference/twig-templating.md)), or how to register an options page ([create-acf-options](.claude/skills/chisel-create-acf-options/SKILL.md)).

## Hard rules

1. **Header and footer are Twig templates, not patterns or blocks.** Edit `views/components/` directly. Don't rebuild them as block patterns unless the user explicitly wants block-based site editing.
2. **No hardcoded editable content in Twig.** Every phone number, email, CTA, social URL and copyright line maps to a source below.
3. **Footer columns and copyright are widget areas.** They already exist and are already wired — don't rebuild them with an ACF repeater.

## Files involved

| Component  | Twig                             | SCSS                                     | JS                                |
| ---------- | -------------------------------- | ---------------------------------------- | --------------------------------- |
| Header     | `views/components/header.twig`   | `src/styles/components/_header.scss`     | —                                 |
| Footer     | `views/components/footer.twig`   | `src/styles/components/_footer.scss`     | —                                 |
| Logo       | `views/components/logo.twig`     | inside `_header.scss`                    | —                                 |
| Main nav   | `views/components/main-nav.twig` | `src/styles/components/_main-nav.scss`   | `src/scripts/modules/main-nav.js` |
| Nav toggle | —                                | `src/styles/components/main-nav-toggle/` | inside `main-nav.js`              |

**Mobile nav toggle.** Hamburger color: `src/styles/components/main-nav-toggle/_mnt-settings.scss` (`$hamburger-layer-color`). Mobile overlay background: `_main-nav.scss` under `bp-down(large)`.

## Content source rule

| Element               | Source                                                                      | Twig access                            |
| --------------------- | --------------------------------------------------------------------------- | -------------------------------------- |
| Logo                  | Customizer (`custom_logo`)                                                  | `{{ logo }}`                           |
| Nav links             | Appearance > Menus                                                          | `{{ get_nav_menu('main_nav') }}`       |
| CTA button (text/URL) | ACF Options > Theme Settings                                                | `{{ options.header_cta_text }}` etc.   |
| Footer columns        | **Widget areas** (4 footer columns) — ACF Options only as fallback          | `{{ footer_sidebars.columns }}` (loop) |
| Copyright             | **Widget area** (`chisel-sidebar-copyright`) — ACF Options only as fallback | `{{ copyright.content }}`              |
| Social links          | ACF Options (repeater)                                                      | `{{ options.social_links }}`           |
| Newsletter            | Gravity Forms shortcode                                                     | —                                      |

## Footer columns + copyright: widgets first (load-bearing)

The theme **already registers** four footer-column widget areas plus one copyright widget area in [core/WP/Sidebars.php]({{THEME_ROOT}}/core/WP/Sidebars.php) — IDs are `chisel-sidebar-` plus the key, so `chisel-sidebar-footer-1`…`footer-4` and `chisel-sidebar-copyright` (a `chisel-sidebar-blog` is registered alongside them). `views/components/footer.twig` is already wired to render them from the `footer_sidebars` / `copyright` Timber context, set in `core/WP/Site.php` via `Components::get_footer_sidebars()` and `Components::get_sidebar('copyright')`.

Empty columns are skipped, and `footer_sidebars.column_class` is computed from how many columns actually have widgets — so filling two areas instead of four lays out correctly with no template change.

- Populate via MCP: `xfive-widgets-widgets-list` to inspect, `xfive-widgets-widget-add` / `widget-update` / `widget-remove` to fill each area.
- Need a different column count? Filter `chisel_sidebars` — never edit `core/`. **The starter ships no `custom/app/WP/Sidebars.php`**, so create it: a `Chisel\WP\Custom\Sidebars` class using the `HooksSingleton` trait, hooking the filter in its `filter_hooks()`, plus `\Chisel\WP\Custom\Sidebars::get_instance();` added to `custom/functions.php` alongside the eight classes already listed there.
- **ACF Options is the fallback**, only for footer content a widget genuinely can't express (a structured link-group repeater with per-link custom fields, a social-icon picker bound to the icon system). When you reach for it, say why widgets don't fit, and add it alongside the widget areas rather than replacing them.

## Twig blocks in the chrome

Both templates are block-structured. Edit **inside** a block; don't flatten the markup and lose it.

| Template | Blocks |
| --- | --- |
| `views/components/header.twig` | `header_logo` · `header_nav` — each wraps a single `{% include %}` |
| `views/components/footer.twig` | `footer_start` · `footer_columns` · `footer_copyright` · `footer_end` |

Extend the footer through `footer_start` / `footer_end` — overriding `footer_columns` or `footer_copyright` throws away the widget wiring. The header has no spare blocks, so new chrome (a CTA, a search toggle, a language switcher) goes in the markup around the two existing ones, inside `c-header__inner`.

## Related

- Adapting header/footer to a spec → [adapt-header-footer](.claude/skills/chisel-adapt-header-footer/SKILL.md)
- Twig context, include syntax, `views/`-only rule → [twig-templating.md](.claude/chisel/reference/twig-templating.md)
- Registering the fallback options page → [create-acf-options](.claude/skills/chisel-create-acf-options/SKILL.md)
- Where component files live → [file-locations.md](.claude/chisel/reference/file-locations.md)
- Widgets, menus, logo and theme mods via MCP → [mcp-workflow.md](.claude/chisel/reference/mcp-workflow.md)
- Why header/footer aren't patterns → [section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md#header--footer--global-elements)
