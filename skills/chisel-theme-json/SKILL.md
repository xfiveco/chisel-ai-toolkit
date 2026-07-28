---
name: chisel-theme-json
description: Modify theme.json to add/update design tokens — colors, typography, spacing, custom properties, block styles, layout settings.
# Auto-loads only when theme.json is in play. Safe here because the file always
# already exists — do NOT copy this to the create-* skills, which run before
# their target file exists and would be silenced by it.
paths:
  - "**/theme.json"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - AskUserQuestion
  - TodoWrite
---

# Modify theme.json

`theme.json` at the theme root is the single source of truth for design tokens. Changes here generate CSS custom properties automatically.

**Always read theme.json first** before making changes.

## Protected slugs

Never rename protected slugs (full palette, spacing/margin/padding/gap aliases, button `is-style-*` names) — the canonical list is in [reference/design-tokens.md](.claude/chisel/reference/design-tokens.md). Grep for references before renaming anything.

## Common modifications

### Add a color

`settings.color.palette`:

```json
{ "name": "{Human Name}", "slug": "{slug}", "color": "{#hex}" }
```

Generates: `var(--wp--preset--color--{slug})`

For shades, follow primary/secondary pattern (100, 200, 300, 600, 800, 900).

### Add a font family

`settings.typography.fontFamilies`:

```json
{
  "fontFamily": "{FontName},sans-serif",
  "slug": "{slug}",
  "name": "{Display Name}",
  "fontFace": [
    {
      "fontFamily": "{FontName}",
      "fontWeight": "{weight}",
      "fontStyle": "normal",
      "fontDisplay": "swap",
      "src": ["file:./assets/fonts/{filename}.woff2"]
    }
  ]
}
```

Place WOFF2 files in `assets/fonts/`. Download from `https://gwfh.mranftl.com/fonts` if Google Font.

### Add a font size

`settings.typography.fontSizes`:

```json
{
  "slug": "{slug}",
  "size": "{value}rem",
  "name": "{Display Name}",
  "fluid": { "min": "{min}rem", "max": "{max}rem" }
}
```

Fluid scales between 480px (min) and 1200px (max) viewports. Generates: `var(--wp--preset--font-size--{slug})`.

### Add a spacing size

`settings.spacing.spacingSizes`:

```json
{ "size": "{value}rem", "slug": "{number}", "name": "{display-number}" }
```

Then add corresponding aliases in `settings.custom.margin/padding/gap` if needed.

### Add custom properties

`settings.custom.{category}.{name}`. Generates: `var(--wp--custom--{category}--{name})`.

Existing categories: `margin`, `padding`, `gap`, `border-radius`, `border-width`, `box-shadow`, `letter-spacing`, `line-height`, `transition`.

### Block-specific styles

`styles.blocks.core/{block-name}`:

```json
{
  "spacing": { "margin": { "top": "var(--wp--custom--margin--medium)" } },
  "typography": {},
  "color": {}
}
```

### Block-specific settings

`settings.blocks.core/{block-name}` — overrides global settings for that block (e.g. disable spacing controls).

### Element styles (headings, links)

`styles.elements.h1..h6`, `styles.elements.link`:

```json
{
  "typography": {
    "fontSize": "var(--wp--preset--font-size--huge)",
    "lineHeight": "var(--wp--custom--line-height--medium)"
  }
}
```

### Gradient

`settings.color.gradients`:

```json
{
  "slug": "{slug}",
  "name": "{Display Name}",
  "gradient": "linear-gradient({angle}deg, {color1} 0%, {color2} 100%)"
}
```

### Duotone

`settings.color.duotone`:

```json
{ "colors": ["{color1}", "{color2}"], "slug": "{slug}", "name": "{Display Name}" }
```

## Current tokens

Never rely on a documented token inventory — values and scales are rewritten at project setup. Read `theme.json` for the current state; slug semantics live in [reference/design-tokens.md](.claude/chisel/reference/design-tokens.md).

## Guidelines

1. Use existing CSS custom properties in SCSS via `get-*()` helpers — never hardcode values.
2. Follow existing naming for new shade variants.
3. Keep fluid ranges ≤ 2× ratio.
4. After changes, restart `npm run dev` — theme.json changes may not hot-reload.
5. Test in both frontend and editor (theme.json applies to both).
