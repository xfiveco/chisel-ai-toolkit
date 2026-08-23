# Base Styles

Where every base-level style lives — buttons, typography, links, forms, spacing, per-block defaults, icons. Owns the **what**: the file map you consult before overriding anything. Does **not** own how to adapt them to a spec ([adapt-base-styles](.claude/skills/chisel-adapt-base-styles/SKILL.md)), token values and slugs ([design-tokens.md](.claude/chisel/reference/design-tokens.md)), SCSS syntax rules ([coding-conventions.md](.claude/chisel/reference/coding-conventions.md)), or the site chrome ([header-footer.md](.claude/chisel/reference/header-footer.md)).

## Hard rules

1. **Read the file, don't trust the doc.** Every value quoted in this toolkit — token values, mixin defaults, block-style lists — reflects **Chisel starter state**. Earlier project work may already have adapted them. Open `theme.json`, the mixin SCSS, or `src/scripts/editor/blocks-styles.js` for current state before comparing anything to a spec. Only protected slug **names** are stable; values are project-specific.
2. **Fix the global before overriding it.** If a divergence should apply everywhere, change the base file — don't scope a copy under every pattern. And once a value lives in theme.json or a base mixin, never re-declare it downstream: [coding-conventions.md "Don't duplicate global styles"](.claude/chisel/reference/coding-conventions.md#dont-duplicate-global-styles-hard-rule).

## Buttons

| What                                                    | File                                                 |
| ------------------------------------------------------- | ---------------------------------------------------- |
| Base mixin (padding, font, border, radius, transitions) | `src/design/tools/_buttons.scss` → `@mixin button()` |
| Variant mixins — `button-primary`, `button-primary-outline`, `button-secondary`, `button-secondary-outline`, each with `-hover` / `-focus` / `-icon` companions | Same file |
| State mixins — `button-disabled()`, `button-loading()`  | Same file                                            |
| Size variants                                           | Same file → `button-small()`, `button-large()`       |
| Block styles registration                               | `src/scripts/editor/blocks-styles.js`                |
| Block button SCSS                                       | `src/styles/blocks/_core-button.scss`                |
| Component button SCSS                                   | `src/styles/components/_buttons.scss`                |

**Before building any pattern that uses a button, open `src/design/tools/_buttons.scss` and compare every property of `@mixin button()` to the spec's button:** padding (horizontal/vertical), font-family, font-size, font-weight, line-height, border-width, border-radius, transition. Read the mixin's current values and update only what diverges. Same for the `button-small`/`button-large` size variants and for each colour variant. **There are four variants, not three** — `primary`, `primary-outline`, `secondary`, `secondary-outline`; there is no `tertiary` in Chisel. Adapting one variant means its base mixin plus its `-hover`, `-focus` and `-icon` companions, so read the whole file before editing any of it.

## Per-block defaults

Check these **before** building a pattern that uses the block.

| Block                                                                                                   | File                                      | What lives here                                                       |
| ------------------------------------------------------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| Global block margins (all blocks)                                                                       | `src/styles/blocks/_core.scss`            | `.c-block--{name}` bottom margins for text and media/container blocks |
| Block margins, second source (group, columns, image, gallery, cover, buttons)                           | `theme.json` → `styles.blocks`            | Top+bottom `margin` aliases per core block — sync alongside `_core.scss` (see [design-tokens.md "Margin sync"](.claude/chisel/reference/design-tokens.md#margin-sync-at-project-start)) |
| `core/group`                                                                                            | `src/styles/blocks/_core-group.scss`      | Group wrapper styles                                                  |
| `core/button`                                                                                           | `src/styles/blocks/_core-button.scss`     | Button block defaults                                                 |
| `core/spacer`                                                                                           | `src/styles/blocks/_core-spacer.scss`     | Spacer `is-style-*` `min-height`, from `settings.custom.spacer`       |
| `core/media-text`                                                                                       | `src/styles/blocks/_core-media-text.scss` | Media+text layout                                                     |
| `core/gallery`                                                                                          | `src/styles/blocks/_core-gallery.scss`    | Gallery grid defaults                                                 |
| `core/details`                                                                                          | `src/styles/blocks/_core-details.scss`    | Expand/collapse details                                               |
| `core/post-title` / `core/post-date` / `core/query` / `core/search` / `core/comments` / `core/latest-*` | `src/styles/blocks/_core-{name}.scss`     | Query and post-meta defaults                                          |

## Elements (HTML primitives under `src/styles/elements/`)

| What                            | File                               |
| ------------------------------- | ---------------------------------- |
| Root / document defaults        | `_html.scss`                       |
| Shared element resets           | `_shared.scss`                     |
| Base `<a>`                      | `_link.scss`                       |
| Form inputs, selects, textareas | `_form.scss`                       |
| Horizontal rule (`<hr>`)        | `_hr.scss`                         |
| Images                          | `_images.scss`                     |
| Tables                          | `_table.scss`                      |

## Typography

| What                                | File                                 |
| ----------------------------------- | ------------------------------------ |
| Families, sizes, fluid ranges       | `theme.json` → `settings.typography` |
| Heading h1-h6 styles                | `theme.json` → `styles.elements`     |
| Body defaults                       | `theme.json` → `styles.typography`   |
| Custom line-heights, letter-spacing | `theme.json` → `settings.custom`     |

## Links

| What                           | File                                  |
| ------------------------------ | ------------------------------------- |
| Link mixin (decoration, hover) | `src/design/tools/_link.scss`         |
| Base `<a>`                     | `src/styles/elements/_link.scss`      |
| Link colors                    | `theme.json` → `styles.elements.link` |

## Forms

| What                  | File                             |
| --------------------- | -------------------------------- |
| Input/textarea/select | `src/styles/elements/_form.scss` |
| Gravity Forms         | `src/styles/gravity-forms.scss`  |

## Spacing

| What                                  | File                                                                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Scale tokens                          | `theme.json` → `settings.spacing.spacingSizes`                                                                                       |
| Named aliases                         | `theme.json` → `settings.custom.margin/padding/gap`                                                                                  |
| Spacer sizes                          | `theme.json` → `settings.custom.spacer` — fluid clamps, its own scale                                                                |
| Content/wide width                    | `theme.json` → `settings.layout`                                                                                                     |
| Page rail (where wide/full edges sit) | `src/design/tools/_width.scss` → `rail-vars()`, emitted in `src/styles/objects/_wrapper.scss` and `src/styles/wp-editor/_editor.scss` |

## Colors, radius, shadows

| What                           | File                                    |
| ------------------------------ | --------------------------------------- |
| Palette                        | `theme.json` → `settings.color.palette` |
| Radius / shadows / transitions | `theme.json` → `settings.custom.*`      |
| SCSS accessors                 | `src/design/tools/_theme.scss`          |

**Border radius is a common miss.** Read the current `custom.border-radius` block in `theme.json` — the project may have adapted it already. Specs often use `0` (sharp), `4px`, or very large pill values. If the design has zero radius globally, set `border-radius: 0` in the base mixins (button, input, card) rather than relying on aliases that still evaluate to non-zero.

## Design tools (`src/design/tools/`)

The SCSS helper layer every other file `@use`s via `@use '~design' as *;`.

**These lists are the shape, not the roster.** Open the file for the full set before using a helper — a `get-*()` that isn't defined there breaks the Sass build.

| File | Provides |
| --- | --- |
| `_theme.scss` | 15 token accessors — `get-color`, `get-margin`, `get-padding`, `get-spacer`, `get-gap`, `get-font-size`, `get-font-family`, `get-layout-size`, `get-gradient`, `get-border-radius`, `get-border-width`, `get-box-shadow`, `get-letter-spacing`, `get-line-height`, `get-transition` |
| `_buttons.scss` | `button()`, four variants each with `-hover`/`-focus`/`-icon`, `button-small()`, `button-large()`, `button-disabled()`, `button-loading()` |
| `_link.scss` | `link()`, `link-reverse()` |
| `_breakpoints.scss` | `bp()`, `bp-down()`, `bp-only()`, `bp-between()` |
| `_layout.scss` | `get-flex-col-width()` |
| `_width.scss` | `rail-vars()` (emits the page-rail custom properties), `rail-children()` (lays a container's direct children out on the rail). Alignment behaviour: [blocks.md "Wide and full width"](.claude/chisel/reference/blocks.md#wide-and-full-width) |
| `_media.scss` | `background-image()` — the only correct way to reference an asset URL — and `object-fit-cover()` |
| `_icon.scss` | `icon-svg()`, `icon()` |
| `_colors.scss` | `rgba-color()` |
| `_px-to-rem.scss` | `px-rem()` — takes a **unitless** number |
| `_screen-readers.scss` | `sr-only()`, `sr-only-focusable()` |

Settings (not tools) live in `src/design/settings/`: `_index.scss` holds `$static-icons`, `_icon-settings.scss` the icon sizing.

## Icons

Icons ship as SVG source files and compile into a spritesheet plus class names.

| What                                          | File / action                                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Source SVGs                                   | `assets/icons-source/{name}.svg` — drop new ones here                                                         |
| Static icons list (used by `@mixin icon-svg`) | `src/design/settings/_index.scss` → `$static-icons`                                                           |
| Editor-visible icon names                     | `chisel_editor_scripts` filter in `custom/app/WP/Assets.php` — extend `['editor']['localize']['data']['icons']` (defaults live in `core/WP/Assets.php` — read-only, never edit) |
| Button usage (right)                          | `"className":"has-icon has-icon-{name}","buttonIcon":"{name}"`                                                |
| Button usage (left)                           | add `has-icon-left` to className                                                                              |
| Button usage (with vertical separator)        | add `has-icon-separator` to className                                                                         |
| Direct SCSS use                               | `@include icon-svg('{name}')` inside `::before`/`::after`                                                     |

**Adding an icon the spec needs but the list lacks:**

1. Export the icon as a single-color SVG with `fill="currentColor"` (or no fill — it gets masked).
2. Save as `assets/icons-source/{kebab-case-name}.svg`.
3. Add the name to the `$static-icons` tuple in `src/design/settings/_index.scss`.
4. Add the name → label mapping via the `chisel_editor_scripts` filter in `custom/app/WP/Assets.php`: `$data['editor']['localize']['data']['icons']['{name}'] = __( '{Label}', 'chisel' );` — same filter shape as [blocks.md "Default block alignment"](.claude/chisel/reference/blocks.md#default-block-alignment). **Never edit `core/WP/Assets.php`.**
5. Use via `has-icon has-icon-{name}` + the `buttonIcon` attribute.

Don't inline an SVG in Twig or pattern markup when a registered icon would do — single source of truth. Cleaning up Figma-exported SVGs: [assets-and-scripts.md "Icon system"](.claude/chisel/reference/assets-and-scripts.md#icon-system).

## Global components

| What                | File                                                                   |
| ------------------- | ---------------------------------------------------------------------- |
| Header, footer, nav | `src/styles/components/_header.scss`, `_footer.scss`, `_main-nav.scss` |
| Nav toggle          | `src/styles/components/main-nav-toggle/`                               |

The theme ships one active hamburger animation plus a set of alternatives parked as `_mnt-*.scss.disabled`. Swap by renaming, not by writing a new one. Full file map for the chrome: [header-footer.md](.claude/chisel/reference/header-footer.md).

Chisel also ships styled components you should reuse rather than rebuild: `_post-card.scss`, `_pagination.scss`, `_search-form.scss`, `_badge.scss`, `_slider.scss`, `_content.scss`, `_sidebar.scss`, `_load-more.scss`. Check `src/styles/components/` before creating a new one.

## Mechanical check

1. `npx chisel-verify` — every `get-*()` argument resolves to a real slug, every helper exists, no raw `var(--wp--…)` where a helper does the job.
2. Ask the user to run `npm run build-scripts` — a renamed slug breaks the Sass build, not the linter.
3. Grep the changed base files for hex literals and `px-rem(` — a base file is exactly where a hardcoded value does the most damage.

## Related

- Adapting these to a spec → [adapt-base-styles](.claude/skills/chisel-adapt-base-styles/SKILL.md)
- Token slugs, protected set, spacer sizing → [design-tokens.md](.claude/chisel/reference/design-tokens.md)
- SCSS layer order, helper signatures, nesting rules → [coding-conventions.md](.claude/chisel/reference/coding-conventions.md#scss--css)
- Header, footer, nav file map → [header-footer.md](.claude/chisel/reference/header-footer.md)
- Registered block styles and mods → [blocks.md](.claude/chisel/reference/blocks.md#existing-block-styles)
- Icon registration and asset pipeline → [assets-and-scripts.md](.claude/chisel/reference/assets-and-scripts.md)
- A variant instead of a new default → [extend-core-block](.claude/skills/chisel-extend-core-block/SKILL.md)
