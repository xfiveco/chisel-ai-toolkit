---
name: chisel-figma-to-chisel
description: End-to-end Figma → Chisel import, orchestrating the other skills — theme.json bootstrap, base-style adaptation, pattern and block creation, image upload, page assembly. Walks sections top to bottom, one at a time, stopping for review after each. Use when the user provides a Figma URL to import a screen. Do NOT use for a single section (call the matching skill directly), for a non-Figma spec, or to plan the work — that's /chisel-change-new.
argument-hint: "[Figma URL]"
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
  - mcp__plugin_figma_figma__*
---

# Figma -> Chisel Import (Orchestrator)

Theme root: `{{THEME_ROOT}}`. All paths below are relative to it.

This skill calls other skills — don't reinvent their work.

## Before you start

### Required prerequisites

1. Load the `figma:figma-use` skill before any `mcp__plugin_figma_figma__*` call.
2. Read [reference/screen-build-order.md](.claude/chisel/reference/screen-build-order.md) — it owns the build order and the done gate; the stages below are how this skill walks it.

**The stages below are not phases.** A *phase* is one row in the import's `PLAN.md`, and that's what `/chisel-change-implement {NN} phase N` refers to. Don't cross the two numbering schemes.

### Load-bearing rules for Figma mode

- **The `context/` files are the source of truth across sessions.** This import lives in its own folder, `context/changes/{NN}-{slug}/`. Update its `PLAN.md` + the active phase file after every section (patterns, blocks, CPTs, phase steps) and append a `## Log` line with an absolute date. Incidental bugs/oddities → one line in `context/FINDINGS.md`. They survive `/compact` and new sessions; your in-context memory does not. Files and templates owned by [chisel-change-new](.claude/skills/chisel-change-new/SKILL.md); the phase loop by [chisel-change-implement](.claude/skills/chisel-change-implement/SKILL.md).
- **Sections are processed top-to-bottom, one at a time, end-to-end.** End-to-end means: CPT (if needed) + block/pattern + SCSS + images + page wiring + progress file update — all for one section before moving to the next. No cross-section batching.
- **Stop for user review after each section.** Don't chain sections silently.
- **Don't batch `get_design_context`.** One section at a time — batching overflows context.

## Skill map

| Need                           | Skill                                                         |
| ------------------------------ | ------------------------------------------------------------- |
| First-time token bootstrap     | [setup-theme-json](.claude/skills/chisel-setup-theme-json/SKILL.md)       |
| Update theme.json              | [theme-json](.claude/skills/chisel-theme-json/SKILL.md)                   |
| Adapt buttons/typography/links | [adapt-base-styles](.claude/skills/chisel-adapt-base-styles/SKILL.md)     |
| Header/footer                  | [adapt-header-footer](.claude/skills/chisel-adapt-header-footer/SKILL.md) |
| Create a section pattern       | [create-pattern](.claude/skills/chisel-create-pattern/SKILL.md)           |
| Field-driven block             | [create-acf-block](.claude/skills/chisel-create-acf-block/SKILL.md)       |
| Interactive custom block       | [create-block](.claude/skills/chisel-create-block/SKILL.md)               |
| Core block variant/toggle      | [extend-core-block](.claude/skills/chisel-extend-core-block/SKILL.md)     |
| CPT or taxonomy                | [create-cpt](.claude/skills/chisel-create-cpt/SKILL.md)                   |
| ACF options page               | [create-acf-options](.claude/skills/chisel-create-acf-options/SKILL.md)   |
| Twig component                 | [create-component](.claude/skills/chisel-create-component/SKILL.md)       |

## Procedure

### Project setup (first time)

If `theme.json` still has example palette (`#dd2424` primary, `#22dbdb` secondary), run `setup-theme-json` first.

### The change folder

Read `context/INDEX.md`, then this import's `changes/{NN}-{slug}/PLAN.md`. If missing, the import
hasn't been scoped — hand off to [chisel-change-new](.claude/skills/chisel-change-new/SKILL.md) (Figma mode → a
per-import `changes/{NN}-{slug}/` folder holding `PLAN.md` + one phase file per section, plus an
INDEX row under `## Active`) and come back once the plan is approved.

### Scope

Ask user (unless answered):

1. Figma URL + node (parse fileKey + nodeId)
2. What is this screen? (static page / CPT / archive / global)
3. Editor-driven or hardcoded content?
4. Interactive behavior? (accordion, tabs, slider → forces custom block)

### Inspect

1. `get_metadata(fileKey, nodeId)` — cheap skeleton, extract section node IDs
2. `get_screenshot(fileKey, nodeId)` — visual reference (full page)
3. `get_variable_defs(fileKey, dsNodeId)` — confirm tokens match theme.json

Do NOT call `get_design_context` on all sections at once — overflow risk.

### Section loop (one at a time, end-to-end)

For each section from top to bottom:

1. `get_design_context(fileKey, sectionNodeId)` — extract every property
2. Decide mapping via [reference/section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md) ladder
3. If first section or new elements appear → adapt base styles via `adapt-base-styles`
4. Build pattern via `create-pattern` (or appropriate skill)
5. Upload section images via `xfive-media-media-upload`
6. Push section to page via `xfive-posts-post-update-content` (full page markup; for partial updates fetch with `post-get-content`/`block-tree`, modify the markup string, write the whole thing back)
7. Update the `context/` files with what was built (phase file steps + the `PLAN.md` row outcome)
8. **Visual diff (mandatory before the next section):** call `get_screenshot(fileKey, sectionNodeId)` for the Figma crop, then get the rendered side:
   - **With Playwright MCP:** `browser_navigate` to the page (site URL from `context/INDEX.md`), `browser_console_messages` — a `view.js` that throws leaves the section half-built and reads as a CSS bug — then `browser_take_screenshot` at the spec's viewport and again after `browser_resize` to mobile.
   - **Without it:** ask the user for a screenshot, and say the render is unchecked rather than passed.

   Check spacing steps, colors, font sizes, and alignment against the Figma crop; fix drift now, not in a later QA round. Full procedure → [browser-verification.md](.claude/chisel/reference/browser-verification.md).

Header/footer: use `adapt-header-footer` skill, not patterns.

#### Asset download (HARD RULE)

**When `get_design_context` returns an asset URL (`const imgFoo = "https://www.figma.com/api/mcp/asset/..."`), DOWNLOAD it — never redraw from scratch.** This applies to icons, illustrations, logos, photos, decorative SVGs — anything Figma exposes as an asset reference. Use `curl` to fetch the URL, then either:

- For raster (PNG/JPG/WEBP): upload via `xfive-media-media-upload` and use the attachment ID.
- For SVG icons that should join Chisel's mask-based icon system: save to `assets/icons-source/{name}.svg` (and convert stroke-only paths to fills if the icon will be masked — Chisel uses `mask: url(...)` + `background-color: currentColor`, which needs filled shapes; round-trip the SVG to a fill-equivalent silhouette if needed). **Clean the export first** — Figma inlines `fill="var(--fill-0, #xxxxxx)"` and `width`/`height` attributes that break color and sizing: [assets-and-scripts.md "Cleaning Figma-exported SVGs"](.claude/chisel/reference/assets-and-scripts.md#cleaning-figma-exported-svgs). Registering it: [base-styles.md "Icons"](.claude/chisel/reference/base-styles.md#icons).
- For SVG illustrations used as `<img>` or background-image: upload via `xfive-media-media-upload`.

Asset URLs returned by Figma are short-lived (~7 days) but stable for the duration — download them at the moment `get_design_context` returns them, alongside the rest of the section's work. If you skip the download and "draw something close" instead, the section won't match Figma and the user will catch it in browser review (wasted round-trip).

### Verification

Run the checklist in [reference/screen-build-order.md "Verification checklist"](.claude/chisel/reference/screen-build-order.md#verification-checklist).

### Iteration

When refining: fresh Figma screenshot → fresh browser screenshot → compare → adjust tokens first, then pattern SCSS, then block code.

### Close out the context/ files

Flip the phase file's steps + the `PLAN.md` phase row (status + one-line outcome), add patterns/blocks/CPTs to `Artifacts produced`, append a `## Log` line with an absolute date, and refresh the INDEX row's state. When the whole import is done, move its INDEX row from `## Active` to `## Done`.

## Output report

- Screen built: Figma node → WP page ID
- New artifacts: CPTs, blocks, patterns, theme.json changes
- Compile status: build-scripts pass/fail
- Follow-ups: missing assets, unclear copy, deferred interactivity

## Traps

- ❌ **Batching `get_design_context` across sections.** It overflows context and the import stalls mid-page.
- ❌ **Redrawing an asset Figma already gave you a URL for.** Download it — the URL expires in about a week, so the moment to fetch is when it's returned.
- ❌ **Chaining sections without stopping for review.** Drift compounds: by section five you're rebuilding four.
- ❌ **Skipping the visual diff** because the markup looked right. Spacing steps and font sizes are exactly what reads correct in code and wrong on screen.
- ❌ **Building the header or footer as a pattern.** They're Twig templates — [adapt-header-footer](.claude/skills/chisel-adapt-header-footer/SKILL.md).
- ❌ **Ordering sections by complexity instead of top-to-bottom.** Simple-first feels safer and leaves the page looking empty through review.
- ❌ **Mapping Figma tokens by name.** Match the resolved value — the names collide and resolve differently. [design-tokens.md](.claude/chisel/reference/design-tokens.md#mapping-figma-tokens--themejson-hard-rule--match-values-never-names).
- ❌ **Leaving the `context/` files until the end of the import.** They exist to survive a session ending mid-section.

## Mechanical check

1. `npx chisel-verify` after each section — not once at the end. A token typo in section two is cheap now and expensive after six more.
2. Ask the user to run `npm run build-scripts`; never invoke it yourself.
3. Then the full screen gate: [screen-build-order.md "Verification checklist"](.claude/chisel/reference/screen-build-order.md#verification-checklist) — raw-value audit, markup color audit, margin-pair audit, slug sync.

## Related

Skills are in the Skill map above. Reference docs this import leans on:

- Per-screen build order and the done gate → [screen-build-order.md](.claude/chisel/reference/screen-build-order.md)
- Which block type each section becomes → [section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md)
- Matching Figma tokens to theme.json by value → [design-tokens.md](.claude/chisel/reference/design-tokens.md)
- Seeding sections into a page, and its silent-failure traps → [mcp-workflow.md](.claude/chisel/reference/mcp-workflow.md)
- Registering a downloaded icon → [base-styles.md](.claude/chisel/reference/base-styles.md#icons)
- Cleaning a Figma SVG export, and the `get_icon()` runtime → [assets-and-scripts.md](.claude/chisel/reference/assets-and-scripts.md#icon-system)
