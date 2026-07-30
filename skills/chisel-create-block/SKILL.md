---
name: chisel-create-block
description: Create a custom Gutenberg block with a React edit/save component and its own frontend JS. The last-resort block choice in Chisel. Use ONLY for editor-canvas interactivity, in-editor drag-to-reorder, true InnerBlocks composability, or a performance need that rules out server rendering. Do NOT use because a section is "complex" or needs frontend interactivity — an ACF block plus view.js covers that (/chisel-create-acf-block), and layouts are patterns (/chisel-create-pattern).
argument-hint: "[block name]"
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

Theme root: `{{THEME_ROOT}}`. All paths below are relative to it.

## Before you start — STOP. Did you ask the user first?

Native React blocks are the **last-resort** block choice in Chisel. Before running this skill, you MUST:

1. Confirm pattern / block style / block mod can't cover the need (see [section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md)).
2. Confirm an **ACF block can't cover the need** — ACF is the default custom-block choice. See [chisel-create-acf-block](.claude/skills/chisel-create-acf-block/SKILL.md). Frontend interactivity (sliders, accordions, tabs that toggle visibility) is NOT a reason to skip ACF — vanilla JS in `view.js` handles that just fine on top of a server-rendered ACF block.
3. Stop and ask the user before proceeding. State the specific reason ACF won't work: editor-canvas interactivity that ACF fields can't express, in-editor drag-to-reorder, true `<InnerBlocks>` composability where editors place arbitrary nested blocks, performance need that rules out server rendering. Vague "it's more flexible" is not a reason.
4. Wait for explicit user approval before continuing past this point.

See [CLAUDE.md "Block type preference"](CLAUDE.md#block-type-preference-acf-default-native-react--stop-and-ask-hard-rule).

Once approved: **load [reference/blocks.md](.claude/chisel/reference/blocks.md)** — file list for `src/blocks/{name}/`, the build-pipeline rule (every SCSS file must be imported by a JS entry), and the naming/class conventions. This skill is the _how_; reference is the _what_.

**Seed shape — static vs dynamic.** Custom WP blocks with `save()` returning JSX are _static_ — they must be seeded as paired tags with the rendered inner HTML between `<!-- wp:name -->...HTML...<!-- /wp:name -->`. Self-closing only for dynamic blocks (`save` returns `null`, server `render_callback`). Always check `renderMode` in `xfive-blocks-block-schema` response before seeding.

## Procedure

1. **Create all files** in `src/blocks/{block-name}/` — contents in [templates/custom-block-template.md](.claude/chisel/templates/custom-block-template.md). File list, including the optional `view.js` (frontend interactivity, class-based vanilla ES6) and `init.php` (server-side registration, required for child blocks to exist in the registry for REST/MCP validation): [reference/blocks.md "Custom WP Block"](.claude/chisel/reference/blocks.md#custom-wp-block-srcblocksname).
2. **Run `npm run dev` or `npm run build-scripts`** to compile — Chisel registers blocks from `build/blocks/`, NOT `src/blocks/`. Until the build runs, the block won't appear in the editor.
3. **Verify** in editor under "Chisel Blocks" category. `xfive-blocks-block-schema` to confirm registration + check `renderMode`.
4. **Test** in editor and on frontend.

Class prefixes, JS hook classes, block name and category: [reference/blocks.md "Block naming and classes"](.claude/chisel/reference/blocks.md#block-naming-and-classes).

## Traps

- ❌ Building this at all when a pattern, block style, block mod, or ACF block would do. Frontend interactivity is not a reason to skip ACF.
- ❌ Skipping the approval gate because the need seemed obvious.
- ❌ A child block without `"parent": ["chisel/parent-block"]` in its `block.json` — it will be insertable anywhere.
- ❌ Passing data between parent and child by any means other than `"providesContext"` / `"usesContext"`.
- ❌ Using a CSS class as a JS selector. Use `js-*` prefixed classes or data attributes — the styling class must stay free to change.
- ❌ Testing before the build runs. `src/blocks/` is not what WordPress reads.

## Mechanical check

1. `npx chisel-verify` — token references, preset classes, SCSS conventions, untouched `core/`.
2. Ask the user to run `npm run build-scripts`; never invoke it yourself.
3. Then walk [blocks.md "Mechanical check"](.claude/chisel/reference/blocks.md#mechanical-check) items 1–4 by hand — the script does not check that every `.scss` has a JS entry, or that each script key has its matching `style-{handle}.css`.

## Related

- File contents for `src/blocks/{name}/` → [custom-block-template.md](.claude/chisel/templates/custom-block-template.md)
- Build-pipeline rule, JS/CSS keys, naming → [blocks.md](.claude/chisel/reference/blocks.md)
- Why ACF is the default instead → [create-acf-block](.claude/skills/chisel-create-acf-block/SKILL.md)
- Whether a block is needed at all → [section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md)
- A core block variant instead of a new block → [extend-core-block](.claude/skills/chisel-extend-core-block/SKILL.md)
- Seeding the block into a page → [mcp-workflow.md](.claude/chisel/reference/mcp-workflow.md)
