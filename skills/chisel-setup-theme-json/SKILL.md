---
name: chisel-setup-theme-json
description: Bootstrap theme.json from a design spec — Figma variables, static mockups, or a written description — translating the design system into tokens so all later work uses `var(--wp--preset--*)` instead of raw values. Run once per project, before any screen, pattern or block. Do NOT use to change a single token mid-project (that's /chisel-theme-json) or to apply the tokens to base styles (/chisel-adapt-base-styles).
argument-hint: "[Figma URL or spec source]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - AskUserQuestion
  - TodoWrite
  - mcp__plugin_figma_figma__*
---

# theme.json Bootstrap

Theme root: `{{THEME_ROOT}}`. All paths below are relative to it.

Run this BEFORE building any screens, patterns, or blocks.

## Before you start

**Load [reference/design-tokens.md](.claude/chisel/reference/design-tokens.md) first** — the slug → meaning map, the protected set, and the spacer/margin math. This skill is the _how_; reference is the _what_. JSON shapes: [templates/theme-json-recipes.md](.claude/chisel/templates/theme-json-recipes.md).

### Spec source

The spec can come from any of three sources — the procedure is the same, only step 2 (extraction) differs:

- **Figma mode** — the user provides a Figma file URL with an optional design system node ID. Use the Figma MCP tools to pull variables.
- **Static-asset mode** — screenshots, PDFs, or a written token list. Extract values by reading.
- **Prompt mode** — the user describes the system in chat ("primary is teal #0ABAB5, body is Inter 16/24, spacing scale 8/16/24/32..."). Use what they give; ask before inventing values.

In all modes: read theme.json first, never fabricate values, and always update SCSS references when you rename a slug.

### Prerequisites

1. Confirm theme.json still has the Chisel example palette (`#dd2424` primary, `#22dbdb` secondary). If it's already customized, ask before overwriting.
2. **Figma mode only**: load the `figma:figma-use` skill before any `mcp__plugin_figma_figma__*` call. URL parsing: `figma.com/design/:fileKey/:fileName?node-id=:nodeId` → convert `-` to `:` in nodeId. `/branch/:branchKey/` → use `branchKey` as fileKey. `/make/` → use `makeFileKey`, never call `get_metadata`.

## Procedure

### 1. Read current theme.json

Read `theme.json` at the theme root. Note which tokens are still example data (safe to overwrite) vs. custom (ask first).

### 2. Pull tokens from the spec

**Figma mode** — decide where tokens come from BEFORE inspecting sections:

1. **Design system node available** → `get_variable_defs(fileKey, dsNodeId)` on it first. Preferred path — returns structured variables.
2. **No centralized DS node** → per-section `get_design_context`, extract CSS variables from output. Use a representative frame.
3. **DS + section overrides** → do both. Apply overrides as section-scoped SCSS, not new theme.json tokens.
4. **No Variables, only Styles** → `get_metadata` + `get_screenshot` and infer visually — flag to the user that values are being inferred.

Never skip this — jumping straight to section markup without knowing the token source leads to hardcoded values. Extract every property the Figma context provides: padding, gap, margin, widths, image dimensions, radius, typography (size/weight/line-height), colors. Map each to the nearest theme.json token; if no match, add the token first.

**Static-asset mode:** read the screenshots/PDF, and ask the user to confirm hex values, font names, and spacing steps that aren't visually unambiguous.

**Prompt mode:** use what the user provided. If anything is missing (colors but no spacing scale, say), ask — don't invent.

### 3. Map spec → Chisel slugs

Chisel uses a fixed taxonomy. Reuse existing slug names wherever possible so SCSS keeps working — the full slug → meaning map is in [design-tokens.md](.claude/chisel/reference/design-tokens.md).

- **Richer structure in the spec** (`surface/muted`, `border/subtle`, `brand/tertiary`)? Add them as new slugs alongside the existing ones — don't force them into existing slots.
- **Foundation now, sections later.** Bootstrap the design-system *foundation* here — palette, type scale, spacing scale, radius, shadows (the Figma Variables collection). Do NOT pre-create per-section spacing or one-off widths; those get added as sections introduce them.
- **Repurpose, don't delete.** To clear a sample token the spec doesn't use, change its *value* and keep the slug. Park unmatched ones on a "remove later" list; prune only at project end, after grep proves zero references in `src/`, patterns, and editor JS — and never a protected slug.
- **Don't keep starter values that diverge from the spec.** Chisel's defaults are a starting point, not the product. This applies to spacing especially — "close enough" is not acceptable. If the spec uses 16/24/32/48/64/96 and Chisel's default scale is 4/8/12/16/20/24/28/32/48, **replace the scale** with the spec's values, keeping the slug numbers so SCSS keeps resolving. Same for colors and fonts.

**Before renaming any slug**, grep for references:

```text
Grep: get-color\('{slug}'\)  in  src/
Grep: has-{slug}(-color|-background-color)?  in  .
Grep: "{slug}"  in  src/scripts/editor/
```

If there are matches, either keep the slug or update every match in the same change. The protected set — palette plus the named aliases — is never renamed at all.

### 4. Apply changes (in order)

Edit `theme.json` in place. Preserve keys and ordering; only change values and add new slugs. Shapes: [theme-json-recipes.md](.claude/chisel/templates/theme-json-recipes.md).

1. `settings.color.palette` — hex values + new slugs
2. `settings.color.gradients` — from spec
3. `settings.color.duotone` — same
4. `settings.typography.fontFamilies` — every weight/style used
5. `settings.typography.fontSizes` — sizes + fluid ranges
6. `settings.spacing.spacingSizes` — the scale. **Pull every unique spacing value from the spec** (`xsmall`, `small`, `base`, `medium`, `large`, `xlarge`, `section/padding-*`, `spacing/spacing-*`, `xxsmall`, etc.) and map to the 9 slug slots (20/30/40/50/60/70/80/90/100). Also update the `settings.custom.margin`/`padding`/`gap` aliases if alias names change. Remember: `core/spacer` at `.is-style-X` maps 1:1 to these aliases — the visible gap in the editor is what `get-margin('X')` evaluates to, so this step directly decides what spacer options editors get.
   - **Ask whether the large-end (section-scale) sizes should be fluid `clamp()`.** Fixed-rem section spacing needs `bp-down` step-downs to shrink on mobile; a single fluid `clamp()` scales padding smoothly with the viewport, so one preset covers all breakpoints. Recommend fluid for the section-scale end, fixed for the small/component end (those drive component gaps that should stay constant). Propose a concrete approach per slug — `clamp(<mobile-min>, calc(<vw>vw + <rem>), <desktop-max>)` where the desktop max is the spec value and the mobile min is one step down — keeping the ratio at or below 2×. If the user wants fixed, leave them fixed. This pairs with section padding living on the outer block ([blocks.md "Root wrapper rule"](.claude/chisel/reference/blocks.md#root-wrapper-rule)) — a fluid preset there makes the whole band responsive with no SCSS step-downs.
7. `settings.custom.*` — radius, shadow, transition, letter-spacing, line-height
8. `settings.layout` — contentSize / wideSize
9. `styles.elements.h1..h6` — if the heading scale shifted

### 5. Fonts

Place WOFF2 files at `assets/fonts/{filename}.woff2`. Download from `https://gwfh.mranftl.com/fonts` if it's a Google Font — no need to ask. If a file is missing, flag it as a follow-up and do NOT fabricate one.

### 6. Fix SCSS fallout

- `Grep: get-color\('([^']+)'\)` in `src/` — every argument exists as a slug
- `Grep: has-([a-z0-9-]+)-color` in `patterns/` and `src/styles/blocks/` — each matches a palette slug

On a mismatch: either add the missing slug or update the SCSS.

### 7. Hand off

Once theme.json is stable and the SCSS builds:

- **Figma mode** → [figma-to-chisel](.claude/skills/chisel-figma-to-chisel/SKILL.md) for each page.
- **Static-asset / prompt mode** → [adapt-base-styles](.claude/skills/chisel-adapt-base-styles/SKILL.md) and [adapt-header-footer](.claude/skills/chisel-adapt-header-footer/SKILL.md), then [create-pattern](.claude/skills/chisel-create-pattern/SKILL.md) / [create-acf-block](.claude/skills/chisel-create-acf-block/SKILL.md) / [create-acf-options](.claude/skills/chisel-create-acf-options/SKILL.md) / [create-cpt](.claude/skills/chisel-create-cpt/SKILL.md) as needed.

## Output report

- **Colors added/changed**: slug → old hex → new hex (or "new")
- **Fonts**: body + heading families, weights, missing WOFF2 files
- **Type scale**: slug → size changes
- **Spacing scale**: new steps
- **Layout widths**: content / wide
- **SCSS references touched**: files where `get-color()` args were updated (ideally zero)
- **Follow-ups**: missing font files, unmappable tokens

## Traps

- ❌ **Renaming a protected slug**, or renaming any slug without updating every reference in the same change.
- ❌ **Fabricating a value the spec doesn't have.** Keep the Chisel default and flag it.
- ❌ **Renaming when extending would do.** New slugs are cheap; renames break SCSS.
- ❌ **Rewriting theme.json from a template** instead of editing the real file in place.
- ❌ **A fluid min/max ratio above 2×** — don't shrink below ~60% of max on mobile.
- ❌ **Pre-creating per-section spacing and one-off widths.** Foundation only; sections add their own.
- ❌ **Keeping a "close enough" starter scale.** If the spec differs, replace the values.

## Mechanical check

1. `npx chisel-verify` — every `get-*()` argument resolves, every helper exists, preset classes match real slugs.
2. Ask the user to run `npm run build-scripts`; never invoke it yourself. This is the step that catches a rename you missed.
3. Ask them to confirm **both** frontend and editor render the new presets, and that the spacer sizes in the editor match the spec.

## Related

- Slug meanings, protected set, spacer math → [design-tokens.md](.claude/chisel/reference/design-tokens.md)
- JSON shapes for every token type → [theme-json-recipes.md](.claude/chisel/templates/theme-json-recipes.md)
- Single-token edits after bootstrap → [theme-json](.claude/skills/chisel-theme-json/SKILL.md)
- Applying the tokens to base styles → [adapt-base-styles](.claude/skills/chisel-adapt-base-styles/SKILL.md)
- The full Figma import → [figma-to-chisel](.claude/skills/chisel-figma-to-chisel/SKILL.md)
- Where base styles and design tools live → [base-styles.md](.claude/chisel/reference/base-styles.md)
