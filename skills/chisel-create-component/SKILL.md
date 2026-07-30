---
name: chisel-create-component
description: Create a reusable Twig component with SCSS and optional JS — shared UI rendered from PHP templates, not from the block editor. Use for header, footer, nav, post cards, pagination, breadcrumbs, and atomic objects like icon wrappers or badges. Do NOT use for anything an editor composes in Gutenberg — that's /chisel-create-pattern, /chisel-create-block, or /chisel-create-acf-block.
argument-hint: "[component name]"
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

# Create Twig Component

Theme root: `{{THEME_ROOT}}`. All paths below are relative to it.

Components are shared UI inside PHP templates — the parts of the page an editor never touches in Gutenberg.

## Before you start

**Load [reference/twig-templating.md](.claude/chisel/reference/twig-templating.md) first** — Timber context, include syntax, naming conventions, where templates live (`views/`, not `custom/views/`). This skill is the _how_; reference is the _what_.

Then check it belongs here at all:

- **Editor content?** Use [create-pattern](.claude/skills/chisel-create-pattern/SKILL.md), [create-block](.claude/skills/chisel-create-block/SKILL.md), or [create-acf-block](.claude/skills/chisel-create-acf-block/SKILL.md) instead.
- **Header, footer, nav or logo?** They already exist — adapt them with [adapt-header-footer](.claude/skills/chisel-adapt-header-footer/SKILL.md) rather than creating new ones.
- **Component or object?** A component (`c-`, `views/components/`) is a named piece of UI: a card, a pagination bar. An object (`o-`, `views/objects/`) is an atomic primitive with no domain meaning: an icon wrapper, a badge. When it could be either, it's a component.

## Procedure

1. Create the Twig template at `views/components/{name}.twig` — scaffold in [templates/component-template.md](.claude/chisel/templates/component-template.md).
2. Create SCSS at `src/styles/components/_{name}.scss`. The build (`chisel-scripts`) auto-regenerates `src/styles/components/_index.scss` on next compile.
3. If interactive: create a JS module at `src/scripts/modules/{name}.js` and import it in `src/scripts/app.js`.

Objects follow the same three steps under `views/objects/` and `src/styles/objects/` with the `o-` prefix.

## Traps

- ❌ **Editing `_index.scss` by hand.** Its header says "auto generated — do not edit directly"; the build overwrites it.
- ❌ **Putting block behavior in `src/scripts/modules/`.** That layer is global/site-wide only — a block's JS lives in its own `view.js`. See [blocks.md "Block JS/CSS keys"](.claude/chisel/reference/blocks.md#block-jscss-keys--what-each-file-is-for).
- ❌ **Selecting on the styling class in JS.** Use a `js-{name}` hook so the CSS class stays free to change.
- ❌ **Creating `views/` templates under `custom/views/`.** That directory is legacy and unused — `custom/` is for PHP overrides only.
- ❌ Hardcoding editable content in the template. Map it to a source (menu, widget area, ACF option) — [header-footer.md "Content source rule"](.claude/chisel/reference/header-footer.md#content-source-rule) has the mapping for global elements.
- ❌ Restating a global style in component SCSS. theme.json and base mixins already cascade — [coding-conventions.md "Don't duplicate global styles"](.claude/chisel/reference/coding-conventions.md#dont-duplicate-global-styles-hard-rule).

## Mechanical check

1. `npx chisel-verify` — token references, SCSS conventions, untouched `core/`.
2. Ask the user to run `npm run build-scripts`; never invoke it yourself.
3. Then read for the thing neither catches: whether an existing component already does this. A near-duplicate component is the most common outcome of skipping the check.

## Related

- Twig, SCSS and JS scaffolds → [component-template.md](.claude/chisel/templates/component-template.md)
- Timber context, include syntax, template hierarchy → [twig-templating.md](.claude/chisel/reference/twig-templating.md)
- Where components, objects and partials live → [file-locations.md](.claude/chisel/reference/file-locations.md)
- BEM, ITCSS layer order, SCSS rules → [coding-conventions.md](.claude/chisel/reference/coding-conventions.md#scss--css)
- Header, footer, nav and logo → [adapt-header-footer](.claude/skills/chisel-adapt-header-footer/SKILL.md)
