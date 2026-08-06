# Screen Build Order

Per-screen pipeline — applies whether the spec comes from Figma, static assets, or a written prompt. Owns **the order work happens in** and the gate that must pass before a screen is called done. Does **not** own how to perform each step (the skill linked from each) or which block type a section becomes ([section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md)).

**These are steps, not phases.** A *phase* is one row in a change's `PLAN.md` — that's what `/chisel-change-implement {NN} phase N` means. Turn the steps below into phases when planning; don't renumber them into a second, competing order.

## Build order (for one screen)

Each step depends on the previous. Execute in order:

1. **Confirm theme.json** matches the spec's design tokens. Still on the starter palette (`#dd2424` primary, `#22dbdb` secondary)? Bootstrap it from the spec via [setup-theme-json](.claude/skills/chisel-setup-theme-json/SKILL.md) — once per project. Already bootstrapped and a token is missing or wrong: [theme-json](.claude/skills/chisel-theme-json/SKILL.md).
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
9. **Review & adjust SCSS** — run build, then open the page in the browser (Playwright MCP if available → [browser-verification.md](.claude/chisel/reference/browser-verification.md)) and fix spacing/color drift against the spec (Figma screenshot, mockup, or written description).

## Verification checklist

Before declaring a screen done. Three layers, in order — **automated** (a script settles it),
**rendered** (open the page), **manual** (only the user can settle it). Run the script first; don't
hand-grep what it already covers, and don't let one layer stand in for another.

### Automated

- [ ] **`npx chisel-verify` is clean.** It owns the whole mechanical half: token slugs, undefined helpers, preset classes in patterns *and* Twig, hand-written markup colors (`customOverlayColor`, literal `color:#…`), the `"disableBottomMargin":true` + `u-no-margin-bottom` pair, pattern four-way slug sync, the `patterns` layer import in both `main.scss` and `editor.scss`, ACF group key = filename, and untouched `core/`. An exit of `2` means it never ran. What each failure means → [chisel-verify](.claude/skills/chisel-verify/SKILL.md)
- [ ] `npm run build-scripts` passes (no Sass errors) — ask the user; never invoke it yourself

### Rendered

Playwright MCP if available; otherwise ask the user for a screenshot and record these as *not
checked*. Full procedure → [browser-verification.md](.claude/chisel/reference/browser-verification.md)

- [ ] **Page opened at the change's own URL** — not the homepage by reflex
- [ ] **Console clean.** A `view.js` that throws on load leaves a section half-initialized and reads as a CSS bug until you check
- [ ] **Screenshot vs the spec crop** at the primary viewport, then at mobile — spacing steps, colors, font sizes, alignment. Breakpoint values live in `src/design/tools/_breakpoints.scss`
- [ ] **Accessibility snapshot** — image alt text, an accessible name on the nav toggle, no skipped heading level, no link labelled only "read more"
- [ ] **Seeded page content audited.** Content pushed into a page lives in the database, so the script never sees it — check the render *and* the markup for `customOverlayColor`, literal hex, preset classes that don't exist, and images that didn't survive the seed
- [ ] Page is published (not draft)
- [ ] Homepage set via `options-update` (if this is the Home page)

### Manual — the user's, never yours

A screenshot you took is evidence for you; it does not tick any of these.

- [ ] **Raw-value warnings triaged.** `chisel-verify` warns on every hex and `rgba()` literal in pattern and block SCSS. Each survivor must be a genuine one-off (a `1px` border, a calc nudge) — never a recurring width/padding/color/shadow, which belongs in `theme.json` as a token
- [ ] **Margin pairs in context.** The script catches a block carrying one half of the pair; it can't tell *which* blocks need it. Confirm every pattern root, every block immediately followed by a spacer, and every last child of a container has both — columns/media-text patterns included (no spacers ≠ exempt)
- [ ] **ACF field names** carry the context prefix — the script checks the group key and filename, not the field names → [acf-naming.md "Mechanical check"](.claude/chisel/reference/acf-naming.md#mechanical-check-run-before-finishing-any-field-group)
- [ ] No two pattern files share a `p-*` class base
- [ ] Custom blocks compile and appear under the `chisel-blocks` inserter category — its visible label is "{Theme Name} Blocks" (core builds it from the theme name, so it is not literally "Chisel Blocks" on a renamed theme)
- [ ] **Editor behaviour** of any new block — the frontend pass runs logged out, so the editor canvas was never opened
- [ ] CPTs show up in admin menu with correct icon
- [ ] Rendered page matches the spec, confirmed by the user

## Related

- Which block type each section becomes → [section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md)
- Block/pattern file structures, four-way sync, block mods → [blocks.md](.claude/chisel/reference/blocks.md)
- Token inventory, spacer sizing, margin sync → [design-tokens.md](.claude/chisel/reference/design-tokens.md)
- Seeding sections into a page → [mcp-workflow.md](.claude/chisel/reference/mcp-workflow.md)
- Opening the rendered page → [browser-verification.md](.claude/chisel/reference/browser-verification.md)
- Field-group naming check → [acf-naming.md](.claude/chisel/reference/acf-naming.md#mechanical-check-run-before-finishing-any-field-group)
- Phase files for multi-screen work → [chisel-change-new](.claude/skills/chisel-change-new/SKILL.md)
- Skills: [figma-to-chisel](.claude/skills/chisel-figma-to-chisel/SKILL.md) (orchestrator) · [verify](.claude/skills/chisel-verify/SKILL.md) (what each automated check means)
