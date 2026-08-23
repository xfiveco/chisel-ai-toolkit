# theme.json Recipes

The JSON shape for each kind of token. Copy, fill in, paste into `theme.json`. What each slug means and which are protected: [design-tokens.md](.claude/chisel/reference/design-tokens.md). Procedure: [theme-json](.claude/skills/chisel-theme-json/SKILL.md) to edit, [setup-theme-json](.claude/skills/chisel-setup-theme-json/SKILL.md) to bootstrap a project.

Always read the current `theme.json` before adding — the values below are shapes, not this project's data.

## Color

`settings.color.palette`:

```json
{ "name": "{Human Name}", "slug": "{slug}", "color": "{#hex}" }
```

Generates `var(--wp--preset--color--{slug})`. For shades, follow the existing primary/secondary pattern (100, 200, 300, 600, 800, 900).

## Font family

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

Place WOFF2 files in `assets/fonts/`. Download from `https://gwfh.mranftl.com/fonts` if it's a Google Font.

## Font size

`settings.typography.fontSizes`:

```json
{
  "slug": "{slug}",
  "size": "{value}rem",
  "name": "{Display Name}",
  "fluid": { "min": "{min}rem", "max": "{max}rem" }
}
```

Generates `var(--wp--preset--font-size--{slug})`. Keep the min/max ratio at or below 2×.

**`fluid` is optional and the small steps omit it.** In the shipped scale only `medium` and up are fluid — `tiny`, `small` and `normal` are a flat `size` with no `fluid` key. Match the neighbours of the step you're adding rather than always including the block.

## Spacing size

`settings.spacing.spacingSizes`:

```json
{ "size": "{value}rem", "slug": "{number}", "name": "{display-number}" }
```

Then add matching aliases in `settings.custom.margin` / `padding` / `gap` if needed.

## Spacer size

`settings.custom.spacer.{alias}` — `core/spacer`'s `is-style-{alias}` sizes, 1:1. A **separate, fluid scale**; it does not reference `spacingSizes` or the margin aliases:

```json
"spacer": {
  "tiny": "0.5rem",
  "normal": "clamp({mobile-min}, {intercept} + {slope}vw, {desktop-max})"
}
```

Interpolate between the same two anchors as fluid typography (`settings.typography.fluid.minViewportWidth` / `maxViewportWidth`): `slope = (max - min) / (toRem - fromRem)`, `intercept = min - slope * fromRem`. Small steps may stay a flat rem — fluid below `1rem` is noise. Every alias here needs a matching entry in `$_spacer-sizes` in `src/styles/blocks/_core-spacer.scss` and in `registerSpacerStyles()`.

## Custom property

`settings.custom.{category}.{name}` — generates `var(--wp--custom--{category}--{name})`.

Existing categories: `margin`, `padding`, `spacer`, `gap`, `border-radius`, `border-width`, `box-shadow`, `letter-spacing`, `line-height`, `transition`.

Adding a category or a new value means adding the matching accessor in `src/design/tools/_theme.scss` in the same change — a `get-*()` with no token, or a token with no accessor, fails the build.

## Block-specific styles

`styles.blocks.core/{block-name}`:

```json
{
  "spacing": { "margin": { "top": "var(--wp--custom--margin--medium)" } },
  "typography": {},
  "color": {}
}
```

Block margins have a second source in `src/styles/blocks/_core.scss` — the two must stay in sync. See [design-tokens.md "Margin sync at project start"](.claude/chisel/reference/design-tokens.md#margin-sync-at-project-start).

## Block-specific settings

`settings.blocks.core/{block-name}` — overrides global settings for that block only (e.g. disabling its spacing controls).

## Element styles (headings, links)

`styles.elements.h1..h6`, `styles.elements.link`:

```json
{
  "typography": {
    "fontSize": "var(--wp--preset--font-size--huge)",
    "lineHeight": "var(--wp--custom--line-height--medium)"
  }
}
```

These cascade everywhere — never restate them in pattern, component or block SCSS. See [coding-conventions.md "Don't duplicate global styles"](.claude/chisel/reference/coding-conventions.md#dont-duplicate-global-styles-hard-rule).

## Gradient

`settings.color.gradients`:

```json
{
  "slug": "{slug}",
  "name": "{Display Name}",
  "gradient": "linear-gradient({angle}deg, {color1} 0%, {color2} 100%)"
}
```

## Duotone

`settings.color.duotone`:

```json
{ "colors": ["{color1}", "{color2}"], "slug": "{slug}", "name": "{Display Name}" }
```

## Related

- Slug meanings, protected set, token inventory → [design-tokens.md](.claude/chisel/reference/design-tokens.md)
- SCSS accessors for these tokens → [coding-conventions.md](.claude/chisel/reference/coding-conventions.md#scss--css)
- Editing an existing theme.json → [theme-json](.claude/skills/chisel-theme-json/SKILL.md)
- Bootstrapping a project's tokens → [setup-theme-json](.claude/skills/chisel-setup-theme-json/SKILL.md)
