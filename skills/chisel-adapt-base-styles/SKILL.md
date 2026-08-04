---
name: chisel-adapt-base-styles
description: Adapt Chisel's base styles — buttons, typography, links, forms, spacing, per-block defaults — to match a target spec from Figma, a mockup, or a written description. Run BEFORE creating patterns so they inherit correct defaults instead of overriding them. Use when the starter's defaults diverge from the design. Do NOT use for a one-off section variation (scope it in pattern SCSS) or for a reusable variant that isn't the default (that's /chisel-extend-core-block).
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
---

# Adapt Base Styles

Theme root: `{{THEME_ROOT}}`. All paths below are relative to it.

Do this before writing pattern SCSS — patterns should inherit correct base styles, not override them.

## Before you start

**Load [reference/base-styles.md](.claude/chisel/reference/base-styles.md) first** — the file map for every base-level style, plus the icon system and the design-tools layer. This skill is the _how_; reference is the _what_.

Its first hard rule governs everything here: **read the file, don't trust the doc.** Every value documented anywhere in this toolkit reflects Chisel starter state, and earlier project work may already have adapted it. Open `theme.json`, the mixin SCSS, and `src/scripts/editor/blocks-styles.js` for current state before comparing to the spec.

Spec source: Figma `get_design_context`, a mockup/screenshot, or a written description from the user. The procedure is identical — only step 1 differs.

### Decide the level first: global vs pattern-scoped

1. **Should look this way everywhere?** → Update the base mixin or element SCSS. Patterns inherit automatically.
2. **One-off variation for a specific section?** → Scope it in pattern SCSS under `.p-{slug}`.
3. **Reusable variant but not the default?** → Add a block style via [extend-core-block](.claude/skills/chisel-extend-core-block/SKILL.md).

**Default to global.** Don't duplicate pattern-scoped overrides across every section when the design wants different defaults.

## Procedure

1. Extract design properties from the spec — `get_design_context` output (Figma mode), or read the mockup / user description.
2. For each property, find its home in [base-styles.md](.claude/chisel/reference/base-styles.md) and read the current value.
3. If it should be the global default → update the base file.
4. Map spec component variants to **existing Chisel slots**. For buttons there are exactly four — `primary`, `primary-outline`, `secondary`, `secondary-outline` (no `tertiary`). Don't invent a fifth name (white, ghost, dark) while one of the four sits unused — remap instead. Adding a genuinely new variant means registering it in `src/scripts/editor/blocks-styles.js` **and** writing its mixins and `.c-btn--` rules; a name alone renders unstyled.

### Reading button variants from Figma

A button on a dark hero is **not** automatically the "primary" variant — a transparent, text-only button is a different variant that happens to sit on a dark band. When `get_design_context` returns a button component, look at:

1. The **component description** (e.g. "Button component (3 variants): …") for the spec's own variant names.
2. The **rendered markup** of that specific instance — does it have a `bg-` class? a `border-` class? Or just `flex items-center px-… py-…` with text and an icon (= transparent, so an outline slot or a remap)?
3. The **node name**, when component instances are individually named (e.g. `button/ghost/dark`).

Then map the spec's names onto Chisel's four: `is-style-{variant}` on the Gutenberg button block, `c-btn--{variant}` on a raw `.c-btn`.

**Chisel has no light/dark variant axis.** There is no `is-style-on-dark` or `c-btn--on-dark` — nothing in the theme registers or styles one. If the spec genuinely needs a dark-background treatment, either fold it into an existing variant, scope it under the section's `.p-{slug}`, or register a real new block style via [extend-core-block](.claude/skills/chisel-extend-core-block/SKILL.md). Don't emit a class that doesn't exist.

## Traps

- ❌ **Comparing the spec to a documented value instead of the file.** Starter values are not this project's values.
- ❌ **Scoping a global under `.p-{slug}` because it was faster.** Every later section pays for it.
- ❌ **Restating a global downstream.** Once theme.json (`styles.typography`, `styles.elements.hN`, `settings.custom.*`) or a base mixin sets a value, it cascades — never re-declare it in pattern/component/block SCSS. [coding-conventions.md "Don't duplicate global styles"](.claude/chisel/reference/coding-conventions.md#dont-duplicate-global-styles-hard-rule).
- ❌ **A hardcoded `px-rem(…)`, hex literal, or magic number in a base file.** Check whether the value recurs — if it does, or could, it belongs in `theme.json` plus a `get-*` helper. Width-token ladder: [design-tokens.md "Layout"](.claude/chisel/reference/design-tokens.md#layout). Same for padding/margin steps, radii, shadows, transitions.
- ❌ **Creating a new variant slot** (`white`, `dark`, `ghost`) while one of the four real ones sits unused. Remap. And a variant name with no mixin and no `.c-btn--` rule renders as an unstyled button.
- ❌ **`display: none` on seeded content the design doesn't want.** Remove it at the source via MCP (`xfive-widgets-widget-remove`, `xfive-posts-post-trash`) or ask the user. [CLAUDE.md "Content vs CSS"](CLAUDE.md#content-vs-css-hard-rule).
- ❌ Inlining an SVG when a registered icon exists — [base-styles.md "Icons"](.claude/chisel/reference/base-styles.md#icons).

## Mechanical check

1. `npx chisel-verify` — every `get-color('slug')` and `has-{slug}-color` resolves, no raw `var(--wp--…)` where a helper exists.
2. Ask the user to run `npm run build-scripts`; never invoke it yourself. A renamed slug breaks the Sass build, not the linter.
3. Grep the base files you touched for hex literals and `px-rem(` — a base file is where a hardcoded value does the most damage.
4. Then check by eye: buttons in all variants and sizes, headings against the type scale, form fields, and a spacer at each size.

## Related

- File map for every base style, icons, design tools → [base-styles.md](.claude/chisel/reference/base-styles.md)
- `get_icon()` parameters, `.o-icon` classes, and overriding shared component styles → [assets-and-scripts.md](.claude/chisel/reference/assets-and-scripts.md#icon-system)
- Token slugs, protected set, margin sync → [design-tokens.md](.claude/chisel/reference/design-tokens.md)
- Adding or changing a token → [theme-json](.claude/skills/chisel-theme-json/SKILL.md)
- A variant instead of a new default → [extend-core-block](.claude/skills/chisel-extend-core-block/SKILL.md)
- Header, footer and nav → [adapt-header-footer](.claude/skills/chisel-adapt-header-footer/SKILL.md)
- Building sections once the base is right → [create-pattern](.claude/skills/chisel-create-pattern/SKILL.md)
