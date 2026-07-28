---
name: chisel-figma-to-chisel
description: End-to-end Figma -> Chisel import. Orchestrates theme setup, base style adaptation, pattern creation, image upload, and page assembly. Use when user provides a Figma URL to import.
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

This skill calls other skills — don't reinvent their work.

## Required prerequisites

1. Load `figma:figma-use` skill before any `mcp__plugin_figma_figma__*` call.
2. Read [reference/screen-build-order.md](.claude/chisel/reference/screen-build-order.md) for the phase checklist.

## Load-bearing rules for Figma mode

- **The `ai-progress/` files are the source of truth across sessions.** This import lives in its own folder, `ai-progress/changes/{NN}-{task-name}/`. Update its roadmap + the active phase file after every section (patterns, blocks, CPTs, phase checkboxes) and append a session log line with an absolute date to that folder's `LOG.md`. Incidental bugs/oddities → one line in `ai-progress/FINDINGS.md`. They survive `/compact` and new sessions; your in-context memory does not. Layout + procedure owned by the [chisel-plan skill](.claude/skills/chisel-plan/SKILL.md).
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

### Phase 0 — Project setup (first time)

If `theme.json` still has example palette (`#dd2424` primary, `#22dbdb` secondary), run `setup-theme-json` first.

### Phase 0.5 — ai-progress/ roadmap

Read `ai-progress/INDEX.md`, then this import's `changes/{NN}-{task-name}/ROADMAP.md`. If missing, create them using the [chisel-plan skill](.claude/skills/chisel-plan/SKILL.md) (Figma mode → a per-import `changes/{NN}-{task-name}/` folder holding `ROADMAP.md` + `LOG.md` + phase files, plus an INDEX row under `## Active`).

### Phase 1 — Scope

Ask user (unless answered):

1. Figma URL + node (parse fileKey + nodeId)
2. What is this screen? (static page / CPT / archive / global)
3. Editor-driven or hardcoded content?
4. Interactive behavior? (accordion, tabs, slider → forces custom block)

### Phase 2 — Inspect

1. `get_metadata(fileKey, nodeId)` — cheap skeleton, extract section node IDs
2. `get_screenshot(fileKey, nodeId)` — visual reference (full page)
3. `get_variable_defs(fileKey, dsNodeId)` — confirm tokens match theme.json

Do NOT call `get_design_context` on all sections at once — overflow risk.

### Phase 3-4 — Section loop (one at a time, end-to-end)

For each section from top to bottom:

1. `get_design_context(fileKey, sectionNodeId)` — extract every property
2. Decide mapping via [reference/section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md) ladder
3. If first section or new elements appear → adapt base styles via `adapt-base-styles`
4. Build pattern via `create-pattern` (or appropriate skill)
5. Upload section images via `xfive-media-media-upload`
6. Push section to page via `xfive-posts-post-update-content` (full page markup; for partial updates fetch with `post-get-content`/`block-tree`, modify the markup string, write the whole thing back)
7. Update the `ai-progress/` files with what was built (phase file checklist + roadmap row outcome)
8. **Visual diff (mandatory before the next section):** call `get_screenshot(fileKey, sectionNodeId)` and compare against the rendered section in the browser — take a browser screenshot if you have the tooling, otherwise ask the user for one. Check spacing steps, colors, font sizes, and alignment against the Figma crop; fix drift now, not in a later QA round.

Header/footer: use `adapt-header-footer` skill, not patterns.

#### Asset download (HARD RULE)

**When `get_design_context` returns an asset URL (`const imgFoo = "https://www.figma.com/api/mcp/asset/..."`), DOWNLOAD it — never redraw from scratch.** This applies to icons, illustrations, logos, photos, decorative SVGs — anything Figma exposes as an asset reference. Use `curl` to fetch the URL, then either:

- For raster (PNG/JPG/WEBP): upload via `xfive-media-media-upload` and use the attachment ID.
- For SVG icons that should join Chisel's mask-based icon system: save to `assets/icons-source/{name}.svg` (and convert stroke-only paths to fills if the icon will be masked — Chisel uses `mask: url(...)` + `background-color: currentColor`, which needs filled shapes; round-trip the SVG to a fill-equivalent silhouette if needed).
- For SVG illustrations used as `<img>` or background-image: upload via `xfive-media-media-upload`.

Asset URLs returned by Figma are short-lived (~7 days) but stable for the duration — download them at the moment `get_design_context` returns them, alongside the rest of the section's work. If you skip the download and "draw something close" instead, the section won't match Figma and the user will catch it in browser review (wasted round-trip).

### Phase 5 — Verification

Run checklist in [reference/screen-build-order.md](.claude/chisel/reference/screen-build-order.md) > "Phase 5".

### Phase 6 — Iteration

When refining: fresh screenshot → compare rendered → adjust tokens first, then pattern SCSS, then block code.

### Phase 7 — Update ai-progress/

Flip the phase file's checkboxes + the roadmap row (status + one-line outcome), add patterns/blocks/CPTs to artifacts, append a session log line with absolute date to `LOG.md`, and refresh the INDEX row's state. When the whole import is done, move its INDEX row from `## Active` to `## Done`.

## Output report

- Screen built: Figma node → WP page ID
- New artifacts: CPTs, blocks, patterns, theme.json changes
- Compile status: build-scripts pass/fail
- Follow-ups: missing assets, unclear copy, deferred interactivity
