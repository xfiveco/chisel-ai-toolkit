---
name: chisel-adapt-base-styles
description: Adapt Chisel's base styles (buttons, typography, links, forms, spacing) to match a target spec. Run BEFORE creating patterns so they inherit correct defaults. Spec source can be Figma, static assets, or user prompt.
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

Do this before writing pattern SCSS — patterns should inherit correct base styles, not override them.

Spec source: Figma `get_design_context`, mockup/screenshot, or a written description from the user. Procedure is identical — only step 1 (extraction) differs.

## Starter values vs current values (read before comparing)

Documented token values, mixin defaults, and block-style lists in these skills and reference docs reflect **Chisel starter state**. Always read the actual file (`theme.json`, the mixin SCSS in `src/design/tools/`, `src/scripts/editor/blocks-styles.js`) for current state before comparing to the spec — earlier project work may have already adapted them. Only protected slug **names** (palette + spacing aliases) are stable; values are project-specific.

## Decision: global vs pattern-scoped

1. **Should look this way everywhere?** → Update the base mixin/element SCSS. Patterns inherit automatically.
2. **One-off variation for a specific section?** → Scope in pattern SCSS under `.p-{slug}`.
3. **Reusable variant but not default?** → Add a block style via [extend-core-block](.claude/skills/chisel-extend-core-block/SKILL.md).

**Default to global.** Don't duplicate pattern-scoped overrides for every section when the design wants different defaults.

**Don't restate a global, either.** Once a value lives in theme.json (`styles.typography`, `styles.elements.hN`, `settings.custom.*`) or a base mixin, it cascades everywhere — never re-declare it in pattern/component/block SCSS. See [reference/coding-conventions.md "Don't duplicate global styles"](.claude/chisel/reference/coding-conventions.md#dont-duplicate-global-styles-hard-rule).

## Procedure

1. Extract design properties from the spec — `get_design_context` output (Figma mode), or read the mockup / user description (other modes).
2. For each property, compare against the current base (file map below).
3. If it should be the global default → update the base file.
4. Map spec component variants to **existing Chisel slots** (primary/secondary/tertiary). Don't create new variant names (white, etc.) while leaving old ones unused — remap instead.

## File map

### Buttons

| What                                                    | File                                                 |
| ------------------------------------------------------- | ---------------------------------------------------- |
| Base mixin (padding, font, border, radius, transitions) | `src/design/tools/_buttons.scss` → `@mixin button()` |
| Variant mixins (primary, secondary, outline)            | Same file                                            |
| Size variants                                           | Same file → `button-small()`, `button-large()`       |
| Block styles registration                               | `src/scripts/editor/blocks-styles.js`                |
| Block button SCSS                                       | `src/styles/blocks/_core-button.scss`                |
| Component button SCSS                                   | `src/styles/components/_buttons.scss`                |

**Before building any pattern that uses a button, open `src/design/tools/_buttons.scss` and compare every property of `@mixin button()` to the spec's button:** padding (horizontal/vertical), font-family, font-size, font-weight, line-height, border-width, border-radius, transition. Read the mixin's current values — they may already have been adapted from Chisel starter values — and update only what diverges from the spec. Same procedure for `button-small`/`button-large` size variants and `button-primary`/`button-secondary`/`button-tertiary` color/border specifics.

**Read the button variant explicitly from the Figma component description, not from the section context.** A button on a dark hero is NOT automatically the "primary" variant — it could be tertiary (text-only). When `get_design_context` returns a button component, look at:

1. The **component description** (e.g. "Button component (3 variants): primary, secondary, tertiary") to know the variant names.
2. The **rendered markup** of the specific instance — does it have a `bg-` class? a `border-` class? Or just `flex items-center px-… py-…` with text + icon (= tertiary, transparent)?
3. The **node name** when component instances are individually named (e.g. "button/tertiary/dark").

Mapping rule: variant maps to `is-style-{variant}` (Gutenberg button block) or `c-btn--{variant}` (raw `.c-btn`). The light/dark theme is an orthogonal axis — append `is-style-on-dark` / `c-btn--on-dark` for that. Conflating the two (assuming "dark theme = primary variant on dark") silently picks the wrong visual.

### Per-block defaults (check BEFORE building a pattern that uses the block)

| Block                                                                                                   | File                                      | What lives here                                                       |
| ------------------------------------------------------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| Global block margins (all blocks)                                                                       | `src/styles/blocks/_core.scss`            | `.c-block--{name}` bottom margins for text and media/container blocks |
| Block margins, second source (group, columns, image, gallery, cover, buttons)                           | `theme.json` → `styles.blocks`            | Top+bottom `margin` aliases per core block — sync alongside `_core.scss` (see [design-tokens.md "Margin sync"](.claude/chisel/reference/design-tokens.md#margin-sync-at-project-start)) |
| `core/group`                                                                                            | `src/styles/blocks/_core-group.scss`      | Group wrapper styles                                                  |
| `core/button`                                                                                           | `src/styles/blocks/_core-button.scss`     | Button block defaults                                                 |
| `core/spacer`                                                                                           | `src/styles/blocks/_core-spacer.scss`     | Spacer `is-style-*` padding values                                    |
| `core/media-text`                                                                                       | `src/styles/blocks/_core-media-text.scss` | Media+text layout                                                     |
| `core/gallery`                                                                                          | `src/styles/blocks/_core-gallery.scss`    | Gallery grid defaults                                                 |
| `core/details`                                                                                          | `src/styles/blocks/_core-details.scss`    | Expand/collapse details                                               |
| `core/post-title` / `core/post-date` / `core/query` / `core/search` / `core/comments` / `core/latest-*` | `src/styles/blocks/_core-{name}.scss`     | Query and post-meta defaults                                          |

### Elements (HTML primitives under `styles/elements/`)

| What                            | File                               |
| ------------------------------- | ---------------------------------- |
| Horizontal rule (`<hr>`)        | `src/styles/elements/_hr.scss`     |
| Base `<a>`                      | `src/styles/elements/_link.scss`   |
| Form inputs, selects, textareas | `src/styles/elements/_form.scss`   |
| Shared element resets           | `src/styles/elements/_shared.scss` |

### Typography

| What                                | File                                 |
| ----------------------------------- | ------------------------------------ |
| Families, sizes, fluid ranges       | `theme.json` → `settings.typography` |
| Heading h1-h6 styles                | `theme.json` → `styles.elements`     |
| Body defaults                       | `theme.json` → `styles.typography`   |
| Custom line-heights, letter-spacing | `theme.json` → `settings.custom`     |

### Links

| What                           | File                                  |
| ------------------------------ | ------------------------------------- |
| Link mixin (decoration, hover) | `src/design/tools/_link.scss`         |
| Base `<a>`                     | `src/styles/elements/_link.scss`      |
| Link colors                    | `theme.json` → `styles.elements.link` |

### Forms

| What                  | File                             |
| --------------------- | -------------------------------- |
| Input/textarea/select | `src/styles/elements/_form.scss` |
| Gravity Forms         | `src/styles/gravity-forms.scss`  |

### Spacing

| What               | File                                                |
| ------------------ | --------------------------------------------------- |
| Scale tokens       | `theme.json` → `settings.spacing.spacingSizes`      |
| Named aliases      | `theme.json` → `settings.custom.margin/padding/gap` |
| Content/wide width | `theme.json` → `settings.layout`                    |

### Icons (for button icons, link icons, etc.)

Chisel has a built-in icon system. Icons ship as SVG source files and are compiled into a spritesheet + class names.

| What                                          | File / action                                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Source SVGs                                   | `assets/icons-source/{name}.svg` — drop new ones here                                                         |
| Static icons list (used by `@mixin icon-svg`) | `src/design/settings/_index.scss` → `$static-icons: ('minus', 'plus', 'arrow-right', 'arrow-left', 'search')` |
| Editor-visible icon names                     | `chisel_editor_scripts` filter in `custom/app/WP/Assets.php` — extend `['editor']['localize']['data']['icons']` (defaults live in `core/WP/Assets.php` — read-only, never edit)  |
| Button usage (right)                          | `"className":"has-icon has-icon-{name}","buttonIcon":"{name}"`                                                |
| Button usage (left)                           | add `has-icon-left` to className                                                                              |
| Button usage (with vertical separator)        | add `has-icon-separator` to className                                                                         |
| Direct SCSS use                               | `@include icon-svg('{name}')` inside `::before`/`::after`                                                     |

**When the spec uses an icon not in the list:**

1. Export the icon as a single-color SVG with `fill="currentColor"` (or no fill — gets masked).
2. Save as `assets/icons-source/{kebab-case-name}.svg`.
3. Add the name to `$static-icons` tuple in `src/design/settings/_index.scss`.
4. Add the name → label mapping via the `chisel_editor_scripts` filter in `custom/app/WP/Assets.php`: `$data['editor']['localize']['data']['icons']['{name}'] = __( '{Label}', 'chisel' );` (same filter shape as the `blocksDefaultAlignment` example in [blocks.md "Default block alignment"](.claude/chisel/reference/blocks.md#default-block-alignment)) — **never edit `core/WP/Assets.php`**.
5. Use via `has-icon has-icon-{name}` + `buttonIcon` attribute.

Don't inline SVG in Twig/patterns when a registered icon would do — single source of truth.

### Colors, radius, shadows

| What                           | File                                    |
| ------------------------------ | --------------------------------------- |
| Palette                        | `theme.json` → `settings.color.palette` |
| Radius / shadows / transitions | `theme.json` → `settings.custom.*`      |
| SCSS accessors                 | `src/design/tools/_theme.scss`          |

**Border radius check** — read the current `custom.border-radius` block in `theme.json` (the project may have already adapted from Chisel starter values). Specs often use `0` (sharp), `4px`, or very large pill values. Update the scale to match the spec. If the design has zero radius globally, set `border-radius: 0` in base mixins (button, input, card) — don't rely on aliases that still evaluate to non-zero.

### Global components

| What                | File                                                                   |
| ------------------- | ---------------------------------------------------------------------- |
| Header, footer, nav | `src/styles/components/_header.scss`, `_footer.scss`, `_main-nav.scss` |
| Nav toggle          | `src/styles/components/main-nav-toggle/`                               |

## Tokenize before you write SCSS (HARD RULE)

Before adding ANY hardcoded `px-rem(…)`, hex literal, or magic number into a base style file: check if it's a recurring value. If yes (or could be), it belongs in `theme.json` + a `get-*` helper, not in SCSS.

Width-token decision ladder + the `settings.custom.layout.*` slot for frame widths and similar recurring widths → [reference/design-tokens.md "Layout"](.claude/chisel/reference/design-tokens.md#layout). Same principle applies to padding/margin steps, radii, shadows, transitions: extend `theme.json` rather than introducing raw numbers in SCSS.

## Removing unwanted seeded content (HARD RULE)

If the starter theme ships widgets, posts, blocks, or ACF defaults the design doesn't want — **remove them at the source** via MCP (`xfive-widgets-widget-remove`, `xfive-posts-post-trash`, etc.) or by asking the user. **Never `display: none` to hide them.** See [CLAUDE.md "Content vs CSS"](CLAUDE.md#content-vs-css-hard-rule).

## Verification

After changes, run `npm run build-scripts` — every `get-color('slug')` and `has-{slug}-color` must resolve.
