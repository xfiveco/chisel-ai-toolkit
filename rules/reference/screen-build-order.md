# Screen Build Order

Per-screen pipeline — applies whether the spec comes from Figma, static assets, or a written prompt. Owns **the order work happens in** and the gate that must pass before a screen is called done. Does **not** own how to perform each step (the skill linked from each) or which block type a section becomes ([section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md)).

**These are steps, not phases.** A *phase* is one row in a change's `PLAN.md` — that's what `/chisel-implement {NN} phase N` means. Turn the steps below into phases when planning; don't renumber them into a second, competing order.

## Build order (for one screen)

Each step depends on the previous. Execute in order:

1. **Confirm theme.json** matches the spec's design tokens.
2. **Adapt base styles** to match the spec via [adapt-base-styles](.claude/skills/chisel-adapt-base-styles/SKILL.md). Do this BEFORE creating patterns — patterns should inherit correct defaults.
3. **Adapt header and footer** via [adapt-header-footer](.claude/skills/chisel-adapt-header-footer/SKILL.md) — Twig templates and the nav menu, never patterns. Once per project, not per screen; on the second screen it is already done.
4. **Register new CPTs / taxonomies** via [create-cpt](.claude/skills/chisel-create-cpt/SKILL.md).
5. **Create custom blocks** via [create-block](.claude/skills/chisel-create-block/SKILL.md) / [create-acf-block](.claude/skills/chisel-create-acf-block/SKILL.md). Compile after.
6. **Add block styles / mods** via [extend-core-block](.claude/skills/chisel-extend-core-block/SKILL.md). Compile after.
7. **Create patterns** via [create-pattern](.claude/skills/chisel-create-pattern/SKILL.md). Each pattern has root wrapper `p-{slug}` class + matching `src/styles/patterns/_{slug}.scss` (filename unprefixed — the folder provides context; only the CSS class carries `p-`).
   - **Build sections in spec reading order — top to bottom.** The page assembles visually as you go, making review easier and matching the user's mental model. Do NOT order by complexity (simple-first), even though it feels safer — the cost of getting stuck on a hard section early is lower than the cost of an empty-looking page during review.
   - **Upload images for each section as part of the section build** (not deferred). Capture attachment IDs.
   - **Wire images into block markup** in the same step — no placeholder `src=""` left behind.
8. **Assemble section into page via MCP** — see [mcp-workflow.md](.claude/chisel/reference/mcp-workflow.md). Each section fully reviewable before moving on.
9. **Review & adjust SCSS** — run build, open page, fix spacing/color drift against the spec (Figma screenshot, mockup, or written description).

## Verification checklist

Before declaring a screen done. **Run the script first — don't hand-grep what it already covers.**

- [ ] **`npx chisel-verify` is clean.** It owns the whole mechanical half: token slugs, undefined helpers, preset classes in patterns *and* Twig, hand-written markup colors (`customOverlayColor`, literal `color:#…`), the `"disableBottomMargin":true` + `u-no-margin-bottom` pair, pattern four-way slug sync, the `patterns` layer import in both `main.scss` and `editor.scss`, ACF group key = filename, and untouched `core/`. An exit of `2` means it never ran. What each failure means → [chisel-verify](.claude/skills/chisel-verify/SKILL.md)
- [ ] `npm run build-scripts` passes (no Sass errors) — ask the user; never invoke it yourself

Then the part no script can settle:

- [ ] **Raw-value warnings triaged.** `chisel-verify` warns on every hex and `rgba()` literal in pattern and block SCSS. Each survivor must be a genuine one-off (a `1px` border, a calc nudge) — never a recurring width/padding/color/shadow, which belongs in `theme.json` as a token
- [ ] **Margin pairs in context.** The script catches a block carrying one half of the pair; it can't tell *which* blocks need it. Confirm every pattern root, every block immediately followed by a spacer, and every last child of a container has both — columns/media-text patterns included (no spacers ≠ exempt)
- [ ] **Seeded page content audited by hand.** Content pushed into a page lives in the database, so the script never sees it — check it for `customOverlayColor`, literal hex, and preset classes that don't exist
- [ ] **ACF field names** carry the context prefix — the script checks the group key and filename, not the field names → [acf-naming.md "Mechanical check"](.claude/chisel/reference/acf-naming.md#mechanical-check-run-before-finishing-any-field-group)
- [ ] No two pattern files share a `p-*` class base
- [ ] Custom blocks compile and appear under the `chisel-blocks` inserter category — its visible label is "{Theme Name} Blocks" (core builds it from the theme name, so it is not literally "Chisel Blocks" on a renamed theme)
- [ ] CPTs show up in admin menu with correct icon
- [ ] Rendered page matches the spec at primary viewport
- [ ] Page is published (not draft)
- [ ] Homepage set via `options-update` (if this is the Home page)

## Related

- Which block type each section becomes → [section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md)
- Block/pattern file structures, four-way sync, block mods → [blocks.md](.claude/chisel/reference/blocks.md)
- Token inventory, spacer sizing, margin sync → [design-tokens.md](.claude/chisel/reference/design-tokens.md)
- Seeding sections into a page → [mcp-workflow.md](.claude/chisel/reference/mcp-workflow.md)
- Field-group naming check → [acf-naming.md](.claude/chisel/reference/acf-naming.md#mechanical-check-run-before-finishing-any-field-group)
- Phase files for multi-screen work → [chisel-new](.claude/skills/chisel-new/SKILL.md)
- Skills: [figma-to-chisel](.claude/skills/chisel-figma-to-chisel/SKILL.md) (orchestrator) · [verify](.claude/skills/chisel-verify/SKILL.md) (what each automated check means)
