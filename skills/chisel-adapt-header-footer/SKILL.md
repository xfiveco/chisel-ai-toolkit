---
name: chisel-adapt-header-footer
description: Adapt header, footer, navigation, and logo to match a target spec. Headers/footers are Twig templates (not patterns) in Chisel. Spec source can be Figma, static assets, or user prompt.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - AskUserQuestion
  - TodoWrite
  - mcp__xfive-mcp-chisel__*
  - mcp__plugin_figma_figma__*
---

# Adapt Header & Footer

Headers and footers are Twig templates — NOT patterns or blocks. Edit directly in `views/components/`. The `custom/` directory is for PHP overrides only; Twig templates live in `views/`.

## Files involved

| Component  | Twig                             | SCSS                                     | JS                                |
| ---------- | -------------------------------- | ---------------------------------------- | --------------------------------- |
| Header     | `views/components/header.twig`   | `src/styles/components/_header.scss`     | —                                 |
| Footer     | `views/components/footer.twig`   | `src/styles/components/_footer.scss`     | —                                 |
| Logo       | `views/components/logo.twig`     | inside `_header.scss`                    | —                                 |
| Main nav   | `views/components/main-nav.twig` | `src/styles/components/_main-nav.scss`   | `src/scripts/modules/main-nav.js` |
| Nav toggle | —                                | `src/styles/components/main-nav-toggle/` | inside `main-nav.js`              |

## Content source rule

**No hardcoded editable content in Twig.** Map each header/footer element to a source:

| Element               | Source                                                                      | Twig access                            |
| --------------------- | --------------------------------------------------------------------------- | -------------------------------------- |
| Logo                  | Customizer (`custom_logo`)                                                  | `{{ logo }}`                           |
| Nav links             | Appearance > Menus                                                          | `{{ get_nav_menu('main_nav') }}`       |
| CTA button (text/URL) | ACF Options > Theme Settings                                                | `{{ options.header_cta_text }}` etc.   |
| Footer columns        | **Widget areas** (4 footer columns) — ACF Options only as fallback          | `{{ footer_sidebars.columns }}` (loop) |
| Copyright             | **Widget area** (`chisel-sidebar-copyright`) — ACF Options only as fallback | `{{ copyright.content }}`              |
| Social links          | ACF Options (repeater)                                                      | `{{ options.social_links }}`           |
| Newsletter            | Gravity Forms shortcode                                                     | —                                      |

### Footer columns + copyright: widgets first (load-bearing)

The theme **already registers** four footer-column widget areas + one copyright widget area in [core/WP/Sidebars.php]({{THEME_ROOT}}/core/WP/Sidebars.php) (`chisel-sidebar-footer-1`…`footer-4`, `chisel-sidebar-copyright`), and `views/components/footer.twig` is already wired to render them via the `footer_sidebars` / `copyright` Timber context. **Use the widget areas — don't rebuild this with an ACF repeater and don't overwrite footer.twig's existing `footer_columns` / `footer_copyright` blocks.**

- Populate via MCP: `xfive-widgets-widgets-list` to inspect, `xfive-widgets-widget-add` / `widget-update` / `widget-remove` to fill each area (`chisel-sidebar-footer-1`…`footer-4`, `chisel-sidebar-copyright`).
- Need a different column count? Filter `chisel_sidebars` in `custom/app/WP/Sidebars.php` (a custom override class) — don't edit `core/`.
- **ACF Options is the fallback**, only for footer content a widget genuinely can't express (e.g. a structured link-group repeater with per-link custom fields, a social-icon picker bound to the icon system). When you reach for it, say why widgets don't fit, and add it alongside the widget areas rather than replacing them.

## Procedure

### 1. Inspect the spec

**Figma mode:** call `get_design_context` on the header and footer nodes.
**Other modes:** read the mockup or user description.

Extract in all modes: background, border, nav style, CTA button variant, icons, spacing.

### 2. Fill footer columns + copyright via widgets

These are existing widget areas (see "Footer columns + copyright: widgets first" above). Inspect with `xfive-widgets-widgets-list`, then populate `chisel-sidebar-footer-1`…`footer-4` and `chisel-sidebar-copyright` via `xfive-widgets-widget-add` / `widget-update`. No Twig or ACF changes needed — footer.twig already renders them. Skip to step 3 unless a column needs content a widget can't express.

### 3. Set up ACF Options (only for what widgets/menus/Customizer don't cover)

For header CTA, social links, or footer content that genuinely can't be a widget — use [create-acf-options](.claude/skills/chisel-create-acf-options/SKILL.md): it owns the full procedure (register a "Theme Settings" page with tabs, add `options` to the Timber context in `custom/app/WP/Site.php`, create the field group JSON, populate immediately via `xfive-acf-acf-field-update` with `post_id: "option"` — never leave fields empty).

### 4. Edit Twig template

Edit `views/components/header.twig` directly. Use ACF Options for content. (Footer columns + copyright are already wired to widgets in `footer.twig` — leave those blocks alone unless restructuring layout.)

```twig
<header id="header" class="c-header o-wrapper">
  <div class="c-header__inner o-wrapper__inner">
    {% include 'components/logo.twig' %}
    {% include 'components/main-nav.twig' %}
    <div class="c-header__actions">
      {% if options.header_cta_text and options.header_cta_url %}
        <a href="{{ options.header_cta_url }}" class="c-btn c-btn--primary">
          {{ options.header_cta_text }}
        </a>
      {% endif %}
    </div>
  </div>
</header>
```

### 5. Update SCSS

Edit `src/styles/components/_header.scss` (and `_main-nav.scss` as needed). Use `@use '~design' as *;` and design tool helpers.

### 6. Create nav menu

Use `xfive-menus-nav-menu-create` to create the menu and assign to location (`chisel_main_nav` or `chisel_footer_nav`). Warn: the tool may append items to an existing menu — check first.

### 7. Upload and set logo

```
xfive-media-media-upload { image_url or local_path }
xfive-options-options-update { type: "theme_mod", entries: { "custom_logo": <id> } }
```

## Mobile nav toggle

Hamburger color in `src/styles/components/main-nav-toggle/_mnt-settings.scss` (`$hamburger-layer-color`). Mobile overlay background in `_main-nav.scss` under `bp-down(large)`.

## What NOT to do

- Do NOT hardcode phone numbers, emails, CTAs, social URLs, or copyright text in Twig.
- Do NOT build footer columns or copyright as an ACF repeater by default — the theme already ships 4 footer-column widget areas + a copyright widget area, wired into `footer.twig`. Use them (`xfive-widgets-*`). ACF is the fallback only.
- Do NOT overwrite footer.twig's `footer_columns` / `footer_copyright` blocks to swap widgets for ACF — you'd orphan the registered widget areas.
- Do NOT build header/footer as a block pattern unless user explicitly wants block-based site editing.
- `custom/views/` is legacy and unused for Twig — edit `views/` directly.
