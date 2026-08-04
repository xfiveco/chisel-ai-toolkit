---
name: chisel-create-pattern
description: Create a block pattern — a reusable section layout composed of existing blocks. The default choice for section layouts, cheaper and more editable than a custom block. Use when a section can be assembled from core blocks: heroes, CTAs, feature grids, pricing tables, testimonial rows, FAQ lists, logo strips. Do NOT use for interactive UI (that's /chisel-create-block), field-driven repeating content (/chisel-create-acf-block), or shared PHP-template UI like a header (/chisel-create-component).
argument-hint: "[section name]"
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

Theme root: `{{THEME_ROOT}}`. All paths below are relative to it.

Patterns are the **default** for section layouts — cheaper than blocks, more editable.

## Before you start

**Load [reference/blocks.md](.claude/chisel/reference/blocks.md) first** — pattern file structure, root-wrapper rule (`p-{slug}` class), existing block styles, pattern categories. This skill is the _how_; reference is the _what_.

Then check three things:

1. **Is a pattern the right call?** [section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md) if unsure. Interactivity → [create-block](.claude/skills/chisel-create-block/SKILL.md) instead.
2. **One pattern per section, not per page.** Assemble sections into a page via `xfive-posts-post-update-content` — don't bundle a whole page into one pattern.
3. **Entity-like content?** Case studies, team, services, events, locations, testimonials worth single-viewing → run the CPT ladder in [section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md#cpt-decision) **before** building a repeater pattern. A CPT may be the right call instead.

## Procedure

1. **List every core block the section will use** (group, heading, paragraph, image, button, columns, spacer, cover, etc.).
2. **Audit base SCSS for each block BEFORE writing markup.** For every block in the list, open the corresponding `src/styles/blocks/_core-{name}.scss` (if it exists) and `src/styles/blocks/_core.scss` globals. Also open `src/styles/elements/*.scss` for any HTML primitives (`<hr>`, `<a>`, `<input>`, etc.). Check each property (margin, padding, color, font, gap, border) against Figma values for this block:
   - **Matches Figma** → leave it alone.
   - **Diverges and should be the GLOBAL default** → update the base file now (before writing pattern markup). See [adapt-base-styles](.claude/skills/chisel-adapt-base-styles/SKILL.md).
   - **Diverges but only for this section** → note it; handle in pattern SCSS (step 5).

   Skipping this audit causes silent conflicts: base margins stack with spacers, base button styles override Figma variant, base group padding fights pattern layout, etc.

3. **Create pattern PHP** at `patterns/{slug}.php`. **Copy the file scaffold and block grammar from [templates/pattern-markup.md](.claude/chisel/templates/pattern-markup.md) — don't hand-write markup from the block schema alone.** The template encodes editor-mod pairings the schema doesn't reveal (spacer styles, button icons, bottom-margin suppression — each seeds an attr AND its companion class together; one without the other renders wrong or desyncs the editor). Full pairing list: [reference/blocks.md "Existing block mods"](.claude/chisel/reference/blocks.md#existing-block-mods).
4. **Root wrapper rule**: single `core/group` (or `core/cover`) with class `p-{slug}` and `"metadata":{"name":"{Pattern Title}"}` (per pattern — its human Title, for a readable editor List View label). Required for scoped SCSS. `{slug}` is the **pattern slug**, never the page/section name it was built for — slug, filename, root class, and SCSS scope must all match. Only the root gets a class. Full rule: [reference/blocks.md "Root wrapper rule"](.claude/chisel/reference/blocks.md#root-wrapper-rule).
5. **Create pattern SCSS** at `src/styles/patterns/_{slug}.scss`, scoped under `.p-{slug}` — scaffold in [templates/pattern-markup.md](.claude/chisel/templates/pattern-markup.md). Only include properties that are section-specific; global divergences should already be fixed in step 2.
6. **Ensure `patterns` is imported** — on a fresh project the `patterns/` layer is not wired up (the starter ships no `src/styles/patterns/` folder at all). Verify `@use 'patterns';` exists in **both** `src/styles/main.scss` and `src/styles/editor.scss`, and add it where missing — this is a one-time per-project step. The two files have different layer stacks: in `main.scss` put it after `@use 'components';`, in `editor.scss` after `@use 'blocks';` (it has no `components` layer). Read each file before editing rather than assuming the order.
7. **Upload images** via `xfive-media-media-upload` (capture IDs).
8. **Push to page** via MCP (see [reference/mcp-workflow.md](.claude/chisel/reference/mcp-workflow.md)):
   - `xfive-blocks-block-schema` on every block type used
   - `xfive-posts-post-update-content` with the full serialized Gutenberg markup of the page (read current via `post-get-content`/`block-tree` first if you need to edit only one section).
9. **Verify** with `xfive-posts-post-get-content` or `block-tree`, then visually in browser.

## Spacing between children

Composition rule (spacer over `blockGap`, walk-the-markup, `disableBottomMargin` pairing) → [reference/blocks.md "Spacing between sibling blocks"](.claude/chisel/reference/blocks.md#spacing-between-sibling-blocks). Spacer-size px→style mapping + flex double-gap trap → [reference/design-tokens.md "Spacing between blocks"](.claude/chisel/reference/design-tokens.md#spacing-between-blocks). Available `is-style-*` spacer sizes come from `registerSpacerStyles()` in `src/scripts/editor/blocks-styles.js`.

## Traps

- ❌ **Naming by page instead of function.** Slug is the section type: `hero`, not `home-hero`; `pill-list`, not `industry-pills`. Variant-qualify (`hero-split`), never page-qualify. Patterns are reusable; a page name locks one to a context. Page-prefix only a genuinely one-off, page-bound pattern.
- ❌ **Styling in SCSS what the block supports as a preset.** Color, font-size, gap, padding, alignment go on the block as attribute + preset class — check `supports` via `xfive-blocks-block-schema` first. Full rule: [blocks.md "Setting block properties"](.claude/chisel/reference/blocks.md#setting-block-properties-presets-over-scss-hard-rule).
- ❌ **Section band padding in pattern SCSS.** It goes on the root block as `style.spacing.padding` with a spacing preset. When a section's only structural block is a `core/columns` (no wrapping group), ask the user whether the padding should sit on the columns block itself rather than adding a wrapper group.
- ❌ **Editing `src/styles/patterns/_index.scss`.** It is auto-generated; the build picks up new `_{slug}.scss` files on its own.
- ❌ **A raw hex or `px-rem(N)` for a value that recurs.** Pattern SCSS uses `get-color`, `get-padding`, `get-gap`, `get-font-size`, `get-layout-size` — and never a `get-*` helper that isn't defined in `src/design/tools/`. New container width? Add `settings.custom.layout.{name}` in theme.json plus the accessor. See [coding-conventions.md "Tokenize repeated values"](.claude/chisel/reference/coding-conventions.md#tokenize-repeated-values) and [design-tokens.md "Width-token decision ladder"](.claude/chisel/reference/design-tokens.md#width-token-decision-ladder).
- ❌ **Raw `url('../../assets/…')` in SCSS.** Webpack resolves `url()` from the bundle entry, not the partial — raw paths silently break the build. Use `@include background-image('name')`. See [coding-conventions.md "Asset URLs in SCSS"](.claude/chisel/reference/coding-conventions.md#asset-urls-in-scss-build-trap).
- ❌ Lorem ipsum. Use realistic copy, and flag unknowns rather than fabricating content.
- ❌ Building interactivity into a pattern. Stop and use [create-block](.claude/skills/chisel-create-block/SKILL.md).
- ❌ Hiding unwanted seeded content with `display: none` — remove it at the source via MCP. See [CLAUDE.md "Content vs CSS"](CLAUDE.md#content-vs-css-hard-rule).
- ❌ Shipping dead media in `patterns/{slug}.php` — no `src=""`, no attachment IDs. Placeholder rule: [blocks.md "Pattern"](.claude/chisel/reference/blocks.md#pattern-patternsslugphp).

## Mechanical check

1. `npx chisel-verify` — catches four-way slug sync, unknown token slugs, preset classes with no matching theme.json entry, and raw `var(--wp--…)` where a helper exists.
2. Ask the user to run `npm run build-scripts`; never invoke it yourself.
3. Then read for what neither catches: base styles you should have updated globally instead of overriding here, and a section that duplicates an existing pattern.

Full block/pattern checklist: [blocks.md "Mechanical check"](.claude/chisel/reference/blocks.md#mechanical-check).

## Related

- Pattern file scaffold, block grammar, preset classes → [pattern-markup.md](.claude/chisel/templates/pattern-markup.md)
- Root wrapper, four-way sync, block mods → [blocks.md](.claude/chisel/reference/blocks.md)
- Pattern vs block vs ACF vs CPT → [section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md)
- Spacer sizing and margin math → [design-tokens.md](.claude/chisel/reference/design-tokens.md#spacing-between-blocks)
- Fixing a global default instead of overriding it → [adapt-base-styles](.claude/skills/chisel-adapt-base-styles/SKILL.md)
- Seeding the section into a page → [mcp-workflow.md](.claude/chisel/reference/mcp-workflow.md)
