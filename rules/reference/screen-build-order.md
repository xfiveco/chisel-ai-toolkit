# Screen Build Order

Per-screen pipeline — applies whether the spec comes from Figma, static assets, or a written prompt.

## Phase 4 — Build order (for one screen)

Each phase depends on previous. Execute in order:

1. **Confirm theme.json** matches the spec's design tokens (Phase 0).
2. **Adapt base styles** to match the spec via [adapt-base-styles](.claude/skills/chisel-adapt-base-styles/SKILL.md). Do this BEFORE creating patterns — patterns should inherit correct defaults.
3. **Register new CPTs / taxonomies** via [create-cpt](.claude/skills/chisel-create-cpt/SKILL.md).
4. **Create custom blocks** via [create-block](.claude/skills/chisel-create-block/SKILL.md) / [create-acf-block](.claude/skills/chisel-create-acf-block/SKILL.md). Compile after.
5. **Add block styles / mods** via [extend-core-block](.claude/skills/chisel-extend-core-block/SKILL.md). Compile after.
6. **Create patterns** via [create-pattern](.claude/skills/chisel-create-pattern/SKILL.md). Each pattern has root wrapper `p-{slug}` class + matching `src/styles/patterns/_{slug}.scss` (filename unprefixed — the folder provides context; only the CSS class carries `p-`).
   - **Build sections in spec reading order — top to bottom.** The page assembles visually as you go, making review easier and matching the user's mental model. Do NOT order by complexity (simple-first), even though it feels safer — the cost of getting stuck on a hard section early is lower than the cost of an empty-looking page during review.
   - **Upload images for each section as part of the section build** (not deferred). Capture attachment IDs.
   - **Wire images into block markup** in the same step — no placeholder `src=""` left behind.
7. **Assemble section into page via MCP** — see [mcp-workflow.md](.claude/chisel/reference/mcp-workflow.md). Each section fully reviewable before moving on.
8. **Review & adjust SCSS** — run build, open page, fix spacing/color drift against the spec (Figma screenshot, mockup, or written description).

## Phase 5 — Verification checklist

Before declaring a screen done:

- [ ] `npm run build-scripts` passes (no Sass errors)
- [ ] Every `get-color('...')` in new SCSS refers to a slug that exists in theme.json
- [ ] **Raw-value audit** — grep new/changed SCSS (`src/styles/patterns/`, `src/blocks*/`, touched components) for hex literals (`#[0-9a-fA-F]{3,8}`), `rgba(` with literal channels, and `px-rem(`: expect ~zero hits. Every survivor must be a genuine one-off (a `1px` border, a calc nudge) — never a recurring width/padding/color/shadow; those belong in `theme.json` as tokens
- [ ] **Markup color audit** — grep `patterns/` and seeded page content for `customOverlayColor`, `background-color:#`, `color:#`: zero expected (cover overlays use `overlayColor` slugs; block colors use presets)
- [ ] **Margin-pair audit** — every pattern root, every block immediately followed by a spacer, and every last child of a container carries BOTH `"disableBottomMargin":true` and `u-no-margin-bottom` — columns/media-text patterns included (no spacers ≠ exempt)
- [ ] Every `has-*-color` / `has-*-background-color` class in patterns refers to an existing palette slug
- [ ] Every `has-*-font-size` refers to an existing fontSize slug
- [ ] **Slug sync (mechanical check)** — for every `patterns/{slug}.php`: the `Slug:` header is `chisel/{slug}`, the root wrapper class equals `p-{slug}`, and the SCSS scope is `.p-{slug}`; grep each file's root `className` against its filename. No two pattern files share a `p-*` class base
- [ ] Pattern SCSS file `src/styles/patterns/_{slug}.scss` exists and is scoped under `.p-{slug}` (the build auto-regenerates `_index.scss` to forward it)
- [ ] **ACF naming (mechanical)** — every new field-group JSON: key matches `group_[0-9a-f]{13}`, filename = key, every field/sub-field `name` carries the context prefix — run [acf-naming.md "Mechanical check"](.claude/chisel/reference/acf-naming.md#mechanical-check-run-before-finishing-any-field-group)
- [ ] Custom blocks compile and appear in "Chisel Blocks" inserter category
- [ ] CPTs show up in admin menu with correct icon
- [ ] Rendered page matches the spec at primary viewport
- [ ] Page is published (not draft)
- [ ] Homepage set via `options-update` (if this is the Home page)
