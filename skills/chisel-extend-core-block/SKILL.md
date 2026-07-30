---
name: chisel-extend-core-block
description: Extend a core WordPress block three ways — a block style (CSS-only variant editors pick in the sidebar), a block mod (a custom toggle, select or input that adds a class or changes rendering), or SCSS-only styling with no editor UI. Preferred over building a custom block for simple variations. Use for button colors, spacer sizes, heading decorations, card variants, visibility toggles. Do NOT use when the change should be the global default (that's /chisel-adapt-base-styles) or when the block needs new structure (/chisel-create-block).
argument-hint: "[core block name]"
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

# Extend Core Block

Theme root: `{{THEME_ROOT}}`. All paths below are relative to it.

## Before you start

**Load [reference/blocks.md](.claude/chisel/reference/blocks.md) first** — the styles and mods already registered, and where they live in `src/scripts/editor/`. This skill is the _how_; reference is the _what_. Read the actual `blocks-styles.js` too: the registered list changes per project, and half the time the variant you need already exists.

### Pick the approach

| Need                                | Approach                                                    | Effort |
| ----------------------------------- | ----------------------------------------------------------- | ------ |
| Visual variant users pick           | Block style                                                 | Low    |
| On/off toggle that adds a class     | Block mod                                                   | Medium |
| New sidebar control (select, input) | Block mod                                                   | Medium |
| Always-on default styling           | SCSS only                                                   | Lowest |
| Complex rendering changes           | [create-block](.claude/skills/chisel-create-block/SKILL.md) | High   |

**The gate:** if the change should be the *global default* rather than a variant, don't build a block style at all — update the base style via [adapt-base-styles](.claude/skills/chisel-adapt-base-styles/SKILL.md). A style variant nobody ever deselects is a default in disguise, and it costs an editor click forever.

## Procedure

Code for all three: [templates/block-mod-template.md](.claude/chisel/templates/block-mod-template.md).

### 1. Block style

A selectable variant — the user clicks, a CSS class lands. Use for button colors, spacer sizes, heading decorations, card variants, list styles.

1. Edit `src/scripts/editor/blocks-styles.js` — add the style to the relevant register method, then call that method from `registerBlockStyles()`.
2. Edit or create `src/styles/blocks/_core-{block-name}.scss` and style the `.is-style-{name}` class.

### 2. Block mod

A custom toggle, select or input in the block sidebar that adds a class or changes rendering. Use for disable-bottom-margin, animation toggles, visibility controls, layout options.

1. Create `src/scripts/editor/mods/{block-name}-{feature}.js`.
2. Import it in `src/scripts/editor/blocks-mods.js`: `import './mods/{block-name}-{feature}';`
3. **Only if the attribute needs REST/MCP validation**, register it server-side too — a filter in a `custom/app/WP/{Feature}.php` class using the `HooksSingleton` trait.

### 3. SCSS-only

A different default with no editor UI. Edit or create `src/styles/blocks/_core-{block-name}.scss`.

## Traps

- ❌ **A block style for something that should be the default.** Ask whether an editor would ever choose the other option; if not, it's a base-style change.
- ❌ **Registering a style whose SCSS you haven't written.** It appears in the sidebar and does nothing.
- ❌ **Editing `src/styles/blocks/_index.scss`.** It is auto-generated; the build forwards new partials on its own.
- ❌ **A mod attribute without its companion class.** Seeding the attr alone renders nothing — every mod pairs an attribute with a class. [blocks.md "Existing block mods"](.claude/chisel/reference/blocks.md#existing-block-mods).
- ❌ **Hooks in `custom/functions.php`.** They go in a `HooksSingleton` feature class that `functions.php` bootstraps — [CLAUDE.md "Architecture"](CLAUDE.md#architecture-core-vs-custom).
- ❌ **A style class that doesn't match its `name` property.** The rendered class is always `is-style-{name}`.
- ❌ Duplicating a variant that already exists in `blocks-styles.js` under another name.

## Mechanical check

1. `npx chisel-verify` — token references, preset classes, SCSS conventions, untouched `core/`.
2. Ask the user to run `npm run build-scripts`; never invoke it yourself. Editor JS changes do not appear until the build runs.
3. Then check in the editor: the style shows in the sidebar, selecting it changes the render, and the class survives a save/reload.

## Related

- JS, SCSS and PHP for all three approaches → [block-mod-template.md](.claude/chisel/templates/block-mod-template.md)
- What's already registered, and the attr+class pairing rule → [blocks.md](.claude/chisel/reference/blocks.md#existing-block-styles)
- Making it the global default instead → [adapt-base-styles](.claude/skills/chisel-adapt-base-styles/SKILL.md)
- When a variation genuinely needs a new block → [create-block](.claude/skills/chisel-create-block/SKILL.md)
- Which approach the section calls for → [section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md)
- Seeding a modded block into a page → [mcp-workflow.md](.claude/chisel/reference/mcp-workflow.md)
