---
name: chisel-create-pattern
description: Create a block pattern — a reusable section layout composed of existing blocks. Default choice for section layouts. Use before reaching for custom blocks or ACF blocks.
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

# Create Block Pattern

**Load [reference/blocks.md](.claude/chisel/reference/blocks.md) first** — pattern file structure, root-wrapper rule (`p-{slug}` class), existing block styles, pattern categories. This skill is the _how_; reference is the _what_.

Patterns are the **default** for section layouts — cheaper than blocks, more editable. See [section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md) if unsure whether a pattern is the right choice.

## Scope rules

- **One pattern per section, not per page.** Assemble sections into a page via `xfive-posts-post-update-content` — don't bundle a whole page into one pattern.
- **For entity-like content** (case studies, team, services, events, locations, testimonials worth single-viewing) → run the CPT ladder in [section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md#cpt-decision) **before** building a repeater pattern. A CPT may be the right call instead.

## When to use

Hero sections, CTAs, feature grids, pricing tables, testimonial rows, FAQ lists, logo strips. Any layout combining headings, paragraphs, images, buttons, columns, groups, covers, spacers.

## Procedure

1. **List every core block the section will use** (group, heading, paragraph, image, button, columns, spacer, cover, etc.).
2. **Audit base SCSS for each block BEFORE writing markup.** For every block in the list, open the corresponding `src/styles/blocks/_core-{name}.scss` (if it exists) and `src/styles/blocks/_core.scss` globals. Also open `src/styles/elements/*.scss` for any HTML primitives (`<hr>`, `<a>`, `<input>`, etc.). Check each property (margin, padding, color, font, gap, border) against Figma values for this block:
   - **Matches Figma** → leave it alone.
   - **Diverges and should be the GLOBAL default** → update the base file now (before writing pattern markup). See [adapt-base-styles](.claude/skills/chisel-adapt-base-styles/SKILL.md).
   - **Diverges but only for this section** → note it; handle in pattern SCSS (step 5).

   Skipping this audit causes silent conflicts: base margins stack with spacers, base button styles override Figma variant, base group padding fights pattern layout, etc.

3. **Create pattern PHP** at `patterns/{slug}.php`. **Copy block grammar from [templates/pattern-markup.md](.claude/chisel/templates/pattern-markup.md) — don't hand-write markup from the block schema alone.** The template encodes editor-mod pairings the schema doesn't reveal (spacer styles, button icons, bottom-margin suppression — each seeds an attr AND its companion class together; one without the other renders wrong or desyncs the editor). Full pairing list: [reference/blocks.md "Existing block mods"](.claude/chisel/reference/blocks.md#existing-block-mods).
4. **Root wrapper rule**: single `core/group` (or `core/cover`) with class `p-{slug}` and `"metadata":{"name":"{Pattern Title}"}` (per pattern — its human Title, for a readable editor List View label). Required for scoped SCSS. `{slug}` is the **pattern slug**, never the page/section name it was built for — slug, filename, root class, and SCSS scope must all match (four-way sync: [reference/blocks.md "Root wrapper rule"](.claude/chisel/reference/blocks.md#root-wrapper-rule)). **Only the root gets a class** — target leaf/text blocks by tag (`.p-{slug} h2`, `.p-{slug} p`), never with a `__element` class (editor-added blocks wouldn't inherit it); BEM-class structural inner blocks only when tag targeting can't single them out. See [reference/blocks.md "Root wrapper rule"](.claude/chisel/reference/blocks.md#root-wrapper-rule).
5. **Create pattern SCSS** at `src/styles/patterns/_{slug}.scss`, scoped under `.p-{slug}`. The **file** is unprefixed — the `patterns/` folder already provides the context (never `_p-{slug}.scss`); the **CSS class** keeps the BEM `p-` prefix (`.p-{slug}`). Only include properties that are section-specific; global divergences should already be fixed in step 2.
6. **SCSS index is auto-generated** — do NOT edit `src/styles/patterns/_index.scss` by hand. The build picks up new `_{slug}.scss` files automatically.
7. **Ensure `patterns` is imported** — on a fresh project the `patterns/` layer may not be wired up yet. Verify `@use 'patterns';` exists in **both** `src/styles/main.scss` and `src/styles/editor.scss`, added **after** `@use 'components';`. Add it if missing (this is a one-time per-project step).
8. **Upload images** via `xfive-media-media-upload` (capture IDs).
9. **Push to page** via MCP (see [reference/mcp-workflow.md](.claude/chisel/reference/mcp-workflow.md)):
   - `xfive-blocks-block-schema` on every block type used
   - `xfive-posts-post-update-content` with the full serialized Gutenberg markup of the page (read current via `post-get-content`/`block-tree` first if you need to edit only one section).
10. **Verify** with `xfive-posts-post-get-content` or `block-tree`, then visually in browser.

## Pattern PHP template

```php
<?php
/**
 * Title: {Pattern Title}
 * Slug: chisel/{slug}
 * Categories: chisel-patterns/{category}
 * Description: {Description}
 * Keywords: {keyword1}, {keyword2}
 *
 * @package Chisel
 */

?>

<!-- block markup here — see templates/pattern-markup.md -->
```

## Pattern SCSS template

```scss
@use '~design' as *;

.p-{slug} {
  // scoped styles only
}
```

Breakpoints: `@include bp('large') { ... }`, `@include bp-down('medium') { ... }`.

## Spacing between children

Composition rule (spacer over `blockGap`, walk-the-markup, `disableBottomMargin` pairing) → [reference/blocks.md "Spacing between sibling blocks"](.claude/chisel/reference/blocks.md#spacing-between-sibling-blocks). Spacer-size px→style mapping + flex double-gap trap → [reference/design-tokens.md "Spacing between blocks"](.claude/chisel/reference/design-tokens.md#spacing-between-blocks). Available `is-style-*` spacer sizes come from `registerSpacerStyles()` in `src/scripts/editor/blocks-styles.js`.

## Guidelines

1. **Name by function, not page.** Slug is the section type, not where it first appears — `hero`, not `home-hero`; `pill-list`, not `industry-pills`. Variant-qualify (`hero-split`), never page-qualify. Patterns are reusable; a page name locks one to a context. Page-prefix only a genuinely one-off, page-bound pattern. Slug has no prefix; class is `p-{slug}` (`hero` → `p-hero`).
2. **Set block-supported properties ON THE BLOCK via presets, not in pattern SCSS.** If a block's `supports` exposes a property (color background/text, font-size, font-family, alignment, block gap, border, spacing padding/margin) and theme.json has a matching preset, set it as a block attribute + preset class — `{"backgroundColor":"primary"}` → `class="… has-primary-background-color has-background"`, `{"textColor":"secondary"}` → `has-secondary-color has-text-color`, `{"fontSize":"extra-large"}` → `has-extra-large-font-size`, `is-style-primary`. Editors then see/change it in the block UI and it stays token-backed. **Reserve pattern SCSS for what the block can't express:** custom layout widths, line-height overrides with no preset **that differ from the global default** (theme.json already sets element/heading line-heights globally — don't restate them; see [reference/coding-conventions.md "Don't duplicate global styles"](.claude/chisel/reference/coding-conventions.md#dont-duplicate-global-styles-hard-rule)), multi-element relationships, responsive tweaks. Check the block's `supports` (via `xfive-blocks-block-schema`) before styling a color/size/gap/padding in SCSS — if the block supports it and a preset exists, it belongs on the block. Never set a raw hex/px on the block (only preset slugs); if no preset exists, that value goes in tokenized SCSS, not as an inline block style.
   - **Section vertical padding goes on the outer block, not in pattern SCSS.** `core/group` and `core/columns` both support `spacing.padding`. Put the section's top/bottom band padding on the pattern's root block as `style.spacing.padding` with a `var:preset|spacing|NN` preset (JSON comment) + matching `var(--wp--preset--spacing--NN)` on the rendered `<div>` — never as root `padding` in pattern SCSS. **When a section's only structural block is a `core/columns`** (no wrapping group), ask the user whether the section padding should sit on the columns block itself (it supports padding too) rather than adding a wrapper group.
3. Use realistic copy, not lorem ipsum.
4. Flag unknowns — don't fabricate content.
5. If a pattern needs interactivity → stop and use [create-block](.claude/skills/chisel-create-block/SKILL.md) instead.
6. **Tokenize before hardcoding.** Pattern SCSS uses `get-color`, `get-padding`, `get-gap`, `get-font-size`, `get-layout-size`, etc. — never raw hex or `px-rem(N)` for any value that recurs, and never a `get-*` helper that isn't defined in `src/design/tools/`. New container width? Add `settings.custom.layout.{name}` in theme.json + a matching accessor in `src/design/tools/_theme.scss`. See [reference/coding-conventions.md "Tokenize repeated values"](.claude/chisel/reference/coding-conventions.md#tokenize-repeated-values) and [reference/design-tokens.md "Width-token decision ladder"](.claude/chisel/reference/design-tokens.md#width-token-decision-ladder).
7. **Don't hide unwanted content with CSS.** If the page has seeded blocks/widgets the design doesn't want, remove them at the source via MCP — never `display: none`. See [CLAUDE.md "Content vs CSS"](CLAUDE.md#content-vs-css-hard-rule).
8. **Asset URLs go through the `background-image()` mixin**, never raw `url('../../assets/...')`. Webpack resolves `url()` from the bundle entry, not the partial; raw paths silently break the build. Drop assets flat into `assets/images/` and call `@include background-image('name')` (default extension is `.svg`). See `src/design/tools/_media.scss` for the mixin.
9. **Pattern source files never contain dead media.** `patterns/{slug}.php` must not ship `src=""`, empty `<figure>`s, or `mediaId`/`id` attrs pointing at site-specific attachments (IDs don't exist on other installs). In the pattern file, omit the `id` attr and reference a theme-shipped placeholder: `<img src="<?php echo esc_url( get_stylesheet_directory_uri() ); ?>/assets/images/placeholders/{name}.jpg" alt="">` (drop the file into `assets/images/placeholders/`). Attachment IDs and upload URLs belong on the **seeded page** (written via MCP), never in the pattern file.
