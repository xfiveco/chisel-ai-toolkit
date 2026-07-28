---
name: chisel-create-block
description: Create a custom Gutenberg block (React edit/save + frontend JS). Use ONLY for truly interactive or structurally unique components that can't be built from core blocks, block styles, block mods, or patterns.
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

# Create Custom Gutenberg Block (native React)

## STOP. Did you ask the user first?

Native React blocks are the **last-resort** block choice in Chisel. Before running this skill, you MUST:

1. Confirm pattern / block style / block mod can't cover the need (see [section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md)).
2. Confirm an **ACF block can't cover the need** — ACF is the default custom-block choice. See [chisel-create-acf-block](.claude/skills/chisel-create-acf-block/SKILL.md). Frontend interactivity (sliders, accordions, tabs that toggle visibility) is NOT a reason to skip ACF — vanilla JS in `view.js` handles that just fine on top of a server-rendered ACF block.
3. Stop and ask the user before proceeding. State the specific reason ACF won't work: editor-canvas interactivity that ACF fields can't express, in-editor drag-to-reorder, true `<InnerBlocks>` composability where editors place arbitrary nested blocks, performance need that rules out server rendering. Vague "it's more flexible" is not a reason.
4. Wait for explicit user approval before continuing past this point.

See [CLAUDE.md "Block type preference"](CLAUDE.md#block-type-preference-acf-default-native-react--stop-and-ask-hard-rule).

---

**Load [reference/blocks.md](.claude/chisel/reference/blocks.md) first** — file list for `src/blocks/{name}/`, the build-pipeline rule (every SCSS file must be imported by a JS entry), and the decision ladder confirming you actually need a custom block. This skill is the _how_; reference is the _what_.

Custom blocks are the most expensive option — confirm via [section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md) that patterns, block styles, block mods, AND ACF blocks can't cover the need.

**Seed shape — static vs dynamic.** Custom WP blocks with `save()` returning JSX are _static_ — they must be seeded as paired tags with the rendered inner HTML between `<!-- wp:name -->...HTML...<!-- /wp:name -->`. Self-closing only for dynamic blocks (`save` returns `null`, server `render_callback`). Always check `renderMode` in `xfive-blocks-block-schema` response before seeding.

## Procedure

1. **Create all files** in `src/blocks/{block-name}/` — see [templates/custom-block-template.md](.claude/chisel/templates/custom-block-template.md). File list: [reference/blocks.md "Custom WP Block"](.claude/chisel/reference/blocks.md#custom-wp-block-srcblocksname).
2. **Run `npm run dev` or `npm run build-scripts`** to compile — Chisel registers blocks from `build/blocks/`, NOT `src/blocks/`. Until the build runs, the block won't appear in the editor.
3. **Verify** in editor under "Chisel Blocks" category. `xfive-blocks-block-schema` to confirm registration + check `renderMode`.
4. **Test** in editor and on frontend.

## Optional files

- `view.js` — frontend interactivity (class-based vanilla ES6)
- `init.php` — server-side registration (required for child blocks to exist in registry for REST/MCP validation)

## Conventions

- CSS class: `b-{block-name}` + BEM (`__element`, `--modifier`)
- JS hook class: `js-{block-name}` (separate from CSS)
- State classes: `is-*`, `has-*`
- Translation: `__('text', 'chisel')`
- Block category: `chisel-blocks`
- Block name: `chisel/{block-name}`

## Guidelines

1. If it can be a pattern, make it a pattern.
2. If it can be a block style or mod, use [extend-core-block](.claude/skills/chisel-extend-core-block/SKILL.md) instead.
3. **If it can be an ACF block, make it an ACF block.** Frontend interactivity is not a reason to skip ACF.
4. Child blocks (like accordion-item) need `"parent": ["chisel/parent-block"]` in block.json.
5. Parent-child communication via `"providesContext"` / `"usesContext"`.
6. Never use CSS classes as JS selectors — use `js-*` prefixed data attributes or classes.
