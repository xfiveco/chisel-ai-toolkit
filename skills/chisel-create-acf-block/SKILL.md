---
name: chisel-create-acf-block
description: Create an ACF block — field-driven repeating content where editors fill in structured fields rather than composing free-form block content. The default custom-block choice in Chisel. Use for sliders, testimonials, team grids, stats counters, logo walls, and any interactive section whose behavior fits vanilla JS in view.js. Do NOT use for entity-like content that deserves a CPT, plain layout sections (that's /chisel-create-pattern), or editor-canvas interactivity (/chisel-create-block).
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

# Create ACF Block

Theme root: `{{THEME_ROOT}}`. All paths below are relative to it.

ACF blocks are for repeatable, field-driven content — the default when a section needs structure an editor fills in.

## Before you start

**Load [reference/blocks.md](.claude/chisel/reference/blocks.md) first** — required file list, the build-pipeline rule (`script.js` as webpack entry), `ignoreScripts` rules, and ACF field-data shape (`_{name}: "field_key"` pointers) all live there. This skill is the _how_; reference is the _what_.

**Check the CPT ladder.** If the block displays entity-like repeating content (case studies, team, portfolio, events), run [section-mapping-decisions.md "CPT decision"](.claude/chisel/reference/section-mapping-decisions.md#cpt-decision). If all three apply → CPT + a CPT-driven block with `latest`/`selected` variants ([create-cpt](.claude/skills/chisel-create-cpt/SKILL.md)), **not** a repeater here. A repeater forks the content and it drifts.

For free-form composition use [create-pattern](.claude/skills/chisel-create-pattern/SKILL.md); for editor-canvas interactivity, [create-block](.claude/skills/chisel-create-block/SKILL.md).

## Procedure

1. **Create the files** at `src/blocks-acf/{block-name}/` — contents in [templates/acf-block-template.md](.claude/chisel/templates/acf-block-template.md). The minimum that works is `block.json`, `{name}.twig`, `style.scss`, `script.js` (CSS entry); add `view.js` only when the block is interactive, and `index.js` + `editor.scss` only when it needs editor-specific styling. The ACF field group goes in `acf-json/` — **which ACF both loads from and saves back to, in `src/`, not `build/`.** File list and `block.json` script/style key requirements: [reference/blocks.md "ACF Block"](.claude/chisel/reference/blocks.md#acf-block-srcblocks-acfname).
2. **Populate any preset ACF option fields** immediately via `xfive-acf-acf-field-update` — see [mcp-workflow.md "ACF fields"](.claude/chisel/reference/mcp-workflow.md#acf-fields).
3. **Run `npm run dev` or `build-scripts` to compile** — Chisel registers blocks from `build/blocks-acf/`, NOT `src/blocks-acf/`. Until the build runs, the block won't appear and the editor will show "your site doesn't include {block-name} block" on existing posts referencing it.
4. **Verify** — `xfive-blocks-block-schema` to confirm registration. In the editor the block sits under the `chisel-blocks` category, whose visible label is "{Theme Name} Blocks" (core builds it from the theme name, so it is not literally "Chisel Blocks" on a renamed theme).

Need the block to open at full width by default? [reference/blocks.md "Default block alignment"](.claude/chisel/reference/blocks.md#default-block-alignment). Need its media to bleed to the screen edge at full width? [reference/blocks.md "Wide and full width"](.claude/chisel/reference/blocks.md#wide-and-full-width). Building a slider? Don't write the swiper markup — `{% include 'components/slider.twig' with { slides_html, params: {…} } %}` and let Chisel emit the wrapper, the `data-*` attributes and the Swiper instance: [assets-and-scripts.md "Swiper"](.claude/chisel/reference/assets-and-scripts.md#swiper).

## Traps

- ❌ **A repeater standing in for a CPT.** Run the ladder first — this is the failure the ladder exists to catch.
- ❌ **`"required": 1` or a repeater `"min"` above 0.** They fire validation errors the moment the block is inserted, before the editor has read serialized data — confusing for editors, and the page won't save. Enforce in Twig instead. Rule: [blocks.md "ACF field validation defaults"](.claude/chisel/reference/blocks.md#acf-field-validation-defaults).
- ❌ **Frontend JS in `script.js` or `src/scripts/modules/`.** ACF blocks render the field form in the editor, not the Twig output, so editor-loaded behavior has nothing to bind to. Behavior goes in `view.js` (`viewScript`), always.
- ❌ **Dropping `ignoreScripts: ["script"]`** while `script.js` is still CSS-only — it enqueues an empty JS handle.
- ❌ Hardcoding content in the Twig template instead of populating ACF fields.
- ❌ Skipping `partials/block-edit-button.twig` for the empty state — editors get a blank block with no way in.
- ❌ **Raw `url('../../../assets/…')` in `style.scss`.** Use `@include background-image('name', 'svg', $is-block: true)` — `$is-block: true` is required because blocks live one level deeper than pattern SCSS. See [coding-conventions.md "Asset URLs in SCSS"](.claude/chisel/reference/coding-conventions.md#asset-urls-in-scss-build-trap).
- ❌ Generic field names (`mode`, `count`, `heading`). Every field and sub-field carries the block-initial prefix — [acf-naming.md](.claude/chisel/reference/acf-naming.md).

## Mechanical check

1. `npx chisel-verify` — token references, preset classes, SCSS conventions, untouched `core/`.
2. Ask the user to run `npm run build-scripts`; never invoke it yourself.
3. Run [acf-naming.md "Mechanical check"](.claude/chisel/reference/acf-naming.md#mechanical-check-run-before-finishing-any-field-group): key format, filename = key, every field and sub-field prefixed, `modified` bumped.
4. Then [blocks.md "Mechanical check"](.claude/chisel/reference/blocks.md#mechanical-check) items 1–6 — the SCSS-has-a-JS-entry and `_{name}` field-pointer checks are not automated.

## Related

- File contents for `src/blocks-acf/{name}/` → [acf-block-template.md](.claude/chisel/templates/acf-block-template.md)
- Field-group naming (hex keys, prefixes, `modified`) → [acf-naming.md](.claude/chisel/reference/acf-naming.md)
- Per-field WPML translation preferences → [acf-wpml-translation.md](.claude/chisel/reference/acf-wpml-translation.md)
- Build-pipeline rule, JS/CSS keys, field-data shape → [blocks.md](.claude/chisel/reference/blocks.md)
- Entity-like content that wants a CPT → [create-cpt](.claude/skills/chisel-create-cpt/SKILL.md)
- Swiper `data-*` API, icons, asset registration → [assets-and-scripts.md](.claude/chisel/reference/assets-and-scripts.md)
- `view.js` fetching from the server (`chisel/v2` AJAX endpoints) → [rest-api.md](.claude/chisel/reference/rest-api.md)
- Seeding the block into a page → [mcp-workflow.md](.claude/chisel/reference/mcp-workflow.md)
