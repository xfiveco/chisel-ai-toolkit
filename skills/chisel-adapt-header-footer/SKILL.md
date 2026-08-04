---
name: chisel-adapt-header-footer
description: Adapt the header, footer, navigation and logo to match a target spec — Figma, a static mockup, or a written description. These are existing Twig templates in Chisel, not patterns or blocks, so this edits what's already there. Use when the site chrome needs to match a design. Do NOT use to build a new reusable component (/chisel-create-component) or a page section (/chisel-create-pattern).
argument-hint: "[spec source]"
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
---

# Adapt Header & Footer

Theme root: `{{THEME_ROOT}}`. All paths below are relative to it.

Headers and footers are Twig templates — NOT patterns or blocks. Edit directly in `views/components/`. The `custom/` directory is for PHP overrides only; Twig templates live in `views/`.

## Before you start

**Load [reference/header-footer.md](.claude/chisel/reference/header-footer.md) first** — the file map, the element→source mapping table, and the widget areas the theme already registers. This skill is the _how_; reference is the _what_.

Two things it will tell you that change what you do here:

- **Footer columns and copyright are already widget areas**, already rendered by `footer.twig`. Populating them needs no Twig or ACF work at all.
- **Every editable element has an assigned source** — Customizer, menus, widgets, or ACF Options. Nothing is hardcoded in Twig.

Spec source: Figma `get_design_context`, a mockup/screenshot, or a written description. Only step 1 differs between them.

## Procedure

### 1. Inspect the spec

**Figma mode:** call `get_design_context` on the header and footer nodes.
**Other modes:** read the mockup or user description.

Extract in all modes: background, border, nav style, CTA button variant, icons, spacing.

### 2. Fill footer columns + copyright via widgets

Inspect with `xfive-widgets-widgets-list`, then populate `chisel-sidebar-footer-1`…`footer-4` and `chisel-sidebar-copyright` via `xfive-widgets-widget-add` / `widget-update`. No Twig or ACF changes needed — `footer.twig` already renders them. Skip to step 3 only if a column needs content a widget can't express.

### 3. Set up ACF Options (only for what widgets/menus/Customizer don't cover)

For a header CTA, social links, or footer content that genuinely can't be a widget — use [create-acf-options](.claude/skills/chisel-create-acf-options/SKILL.md): it owns the full procedure (register a "Theme Settings" page with tabs, add `options` to the Timber context, create the field group JSON, populate immediately with `post_id: "option"`).

### 4. Edit the Twig template

Edit `views/components/header.twig` directly, pulling content from its assigned source. **Both templates are block-structured — read the file first and add inside the existing blocks, never flatten them.** `header.twig` wraps its two includes in `header_logo` and `header_nav`; `footer.twig` has four blocks and its columns and copyright are already wired to widgets. Full map: [header-footer.md "Twig blocks in the chrome"](.claude/chisel/reference/header-footer.md#twig-blocks-in-the-chrome).

Adding a header CTA means adding markup *around* the existing blocks, inside `c-header__inner`:

```twig
<header id="header" class="c-header o-wrapper">
  <div class="c-header__inner o-wrapper__inner">
    {% block header_logo %}
      {% include 'components/logo.twig' %}
    {% endblock %}

    {% block header_nav %}
      {% include 'components/main-nav.twig' %}
    {% endblock %}

    {# new — the two blocks above are untouched #}
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

Edit `src/styles/components/_header.scss` (and `_main-nav.scss` as needed). Use `@use '~design' as *;` and the design tool helpers. Toggle and overlay files: [header-footer.md "Files involved"](.claude/chisel/reference/header-footer.md#files-involved).

### 6. Create the nav menu

`xfive-menus-nav-menu-create`, then assign to a location (`chisel_main_nav` or `chisel_footer_nav`). The tool may append items to an existing menu — check first.

### 7. Upload and set the logo

```text
xfive-media-media-upload { image_url or local_path }
xfive-options-options-update { type: "theme_mod", entries: { "custom_logo": <id> } }
```

## Traps

- ❌ **Hardcoding phone numbers, emails, CTAs, social URLs or copyright text in Twig.** Every one has a source — [header-footer.md "Content source rule"](.claude/chisel/reference/header-footer.md#content-source-rule).
- ❌ **Building footer columns or copyright as an ACF repeater.** Four footer-column widget areas and a copyright area already exist and are already wired into `footer.twig`. ACF is the fallback, and only with a stated reason.
- ❌ **Flattening the Twig blocks.** `footer_columns` / `footer_copyright` carry the widget wiring; `header_logo` / `header_nav` are equally real. Add around them, don't replace them.
- ❌ **Editing `core/WP/Sidebars.php`** to change the column count — filter `chisel_sidebars` instead. The starter ships no `custom/app/WP/Sidebars.php`, so create the class and bootstrap it in `custom/functions.php`.
- ❌ Rebuilding the header as a pattern or block.
- ❌ Creating a new nav menu without checking whether one already exists at that location.

## Mechanical check

1. `npx chisel-verify` — token references, SCSS conventions, untouched `core/`.
2. Ask the user to run `npm run build-scripts`; never invoke it yourself.
3. Then check by eye: nav at mobile and desktop, the toggle overlay, logo sizing, and that no string in the templates should have come from a widget or option.

## Related

- File map, content sources, widget areas → [header-footer.md](.claude/chisel/reference/header-footer.md)
- The fallback options page → [create-acf-options](.claude/skills/chisel-create-acf-options/SKILL.md)
- Twig context and include syntax → [twig-templating.md](.claude/chisel/reference/twig-templating.md)
- Widgets, menus, media and theme mods via MCP → [mcp-workflow.md](.claude/chisel/reference/mcp-workflow.md)
- Global button/typography defaults → [adapt-base-styles](.claude/skills/chisel-adapt-base-styles/SKILL.md)
- A new shared component instead → [create-component](.claude/skills/chisel-create-component/SKILL.md)
