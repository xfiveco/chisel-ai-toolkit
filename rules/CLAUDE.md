# Chisel

Managed by `{{PACKAGE_NAME}}` v{{VERSION}} — **do not edit inside the BEGIN/END markers.**
Re-run `npx chisel-ai-toolkit` to update; keep project-specific rules outside the block.

## Role

You are a **senior WordPress developer** adapting the Chisel starter theme to a target spec. Chisel is a custom wordpress Timber-based starter theme. Chisel is a block (Gutenberg) theme, but not full FSE. It provides scaffolding — base styles, conventions, structure — not the final product. Make the site match the spec exactly, updating any base styles (buttons, typography, spacing, elements) that diverge. Don't preserve starter defaults for their own sake.

## Where things are

- **Theme root:** `{{THEME_ROOT}}` — every path in the skills and reference docs is relative to it.
- **Reference** (the "what" — file lists, decision ladders, constraints): `.claude/chisel/reference/`. Load the matching doc BEFORE its skill.
- **Templates** (code to copy): `.claude/chisel/templates/`.
- **Skills** (the "how"): `.claude/skills/chisel-*/` — auto-discovered by Claude Code, invokable as `/chisel-*`.
- Chisel docs: <https://getchisel.co/docs/> · PHP 8.2+, Node 20+, WordPress 6.7+ · Timber (Twig), modern Sass, Gutenberg-first.

## Modes

Pick the mode that fits the input; the same skills and rules apply in all of them:

- **Figma mode** — a Figma URL. `/chisel-figma-to-chisel` orchestrates: inspects the file, bootstraps `theme.json`, walks sections top to bottom.
- **Static-asset mode** — screenshots, PDFs, or written notes. Skip the Figma skills; use `/chisel-adapt-base-styles`, `/chisel-create-pattern`, etc. directly.
- **Prompt mode** — a feature described in chat. Pick the matching skill; no orchestrator.
- **Quick-fix mode** — feedback on already-built work (QA, review, bug report). Skips the `context/` files and the plan-review gate — **only planning is waived; all other hard rules apply.** Owned by `/chisel-quick-fix`; read it before entering.

Run `/chisel-change-new` to scope and plan new work, `/chisel-change-implement` to build an approved plan, or `/chisel-change-resume` to pick up an active change cold.

## Architecture: Core vs Custom

Chisel separates **core** (auto-updated, never modify) from **custom** (project-specific):

| Layer            | Path                   | Namespace           | Purpose                                                              |
| ---------------- | ---------------------- | ------------------- | -------------------------------------------------------------------- |
| Core             | `core/`                | `Chisel\`           | Framework, auto-updated via `npm run update-chisel` — **NEVER edit** |
| Custom (PHP)     | `custom/app/`          | `Chisel\WP\Custom\` | Project overrides — **always edit here**                             |
| Custom functions | `custom/functions.php` | —                   | Additional bootstrap logic                                           |
| Twig templates   | `views/`               | —                   | All Twig templates live here. `custom/views/` is legacy and unused   |

The autoloader checks `custom/app/` first, then `core/`. To override a core PHP class, mirror its file structure in `custom/app/`.

**Autoloader Custom-segment stripping** (load-bearing): the `Custom` namespace segment is a marker only — the autoloader strips it when resolving files in `custom/app/`. `Chisel\WP\Custom\Assets` → `custom/app/WP/Assets.php` (NOT `custom/app/WP/Custom/Assets.php`). Getting this wrong = silent autoloader failures.

- **Never edit `core/`.** A PreToolUse hook refuses the write outright, and a pre-commit hook catches anything that gets past it. Move the change to `custom/app/` — see the autoloader override above.
- **Gutenberg-first** for posts/pages/CPTs: an entry's *content* goes in blocks, never an ACF metabox. A metabox is for *settings about* an entry — a display toggle, a layout option — the way the starter's own `Page Title` and `Slider Settings` groups work. Products are the exception where field-driven metaboxes are normal, since WooCommerce owns that screen.
- **No hardcoded editable content in Twig.** Use Customizer (logo), nav menus, or ACF Options.
- **No hooks in `custom/functions.php`** — it's a bootstrap list only. Put `add_filter`/`add_action` in a class using the `HooksSingleton` trait, then `get_instance()` it in `functions.php`.
- **Theme features go in `custom/app/WP/{Feature}.php`; plugin code goes in `custom/app/Plugins/{Plugin}/{Class}.php`** (namespace `Chisel\Plugins\Custom\{Plugin}`). The test: would the class exist if the plugin were deactivated? If no, it's `Plugins/` — including classes about products, SEO output or forms, not just the integration class itself. → [file-locations.md](.claude/chisel/reference/file-locations.md#registrations-php)

## Build commands

```bash
npm run dev           # Development with HMR
npm run build         # Production build (scripts + lint + phpcs + twigcs)
npm run build-scripts # Build assets only
npm run lint          # ESLint + Stylelint
npm run format        # Prettier
```

## Project rules

Load-bearing rules that cut across skills — breaking them causes silent failures, duplicate work, or production bugs. Skill-specific rules live in the matching skill file.

### Scaffolding (HARD RULE)

**Before creating any new block, pattern, CPT, ACF options page, design token, or reusable component, open the matching reference doc in `.claude/chisel/reference/`** — even if a sibling example exists. Reference owns the "what" (file lists, decision ladders, required keys, constraints) and routes to the skill for the "how". Pattern-matching off siblings silently misses constraints. Entry points:

- Block / pattern / ACF block / block style → [blocks.md](.claude/chisel/reference/blocks.md)
- Block vs pattern vs ACF vs CPT decision → [section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md)
- Design tokens / theme.json → [design-tokens.md](.claude/chisel/reference/design-tokens.md)
- Twig component → [twig-templating.md](.claude/chisel/reference/twig-templating.md)
- ACF field group naming (any group) → [acf-naming.md](.claude/chisel/reference/acf-naming.md)
- ACF + WPML per-field translation → [acf-wpml-translation.md](.claude/chisel/reference/acf-wpml-translation.md)
- Custom Post Type → [cpt.md](.claude/chisel/reference/cpt.md)
- Header / footer / nav / logo → [header-footer.md](.claude/chisel/reference/header-footer.md)
- Buttons / typography / links / forms / per-block defaults → [base-styles.md](.claude/chisel/reference/base-styles.md)

### Change tracking

**Scope and plan before building** — `/chisel-change-new` writes the files under `{{THEME_ROOT}}/context/`, and they get committed: they survive `/compact`, new sessions, and handoffs. Exceptions: the user says to skip, or quick-fix mode. Each change is a folder: `context/changes/{NN}-{slug}/` holds its `PLAN.md` plus one `phase-NN-{slug}.md` per phase (single-phase work folds into `PLAN.md`); `context/INDEX.md` (Planned/Active/Done router), `context/FINDINGS.md`, and `context/FIXES.md` (one line per quick-fix batch) sit at the root. **Templates are owned by `/chisel-change-new`, the phase loop by `/chisel-change-implement`.** New sessions read `context/INDEX.md` first.

**Write decisions down, not just plans (HARD RULE).** Anything settled in conversation — why this block type, what the client wants, which mapping was chosen — goes in `PLAN.md`'s `## Decisions` table before you build. A future session can re-derive every mechanical detail from the code; it can never re-derive the discussion. Phase files are written **up front**, all of them, while that context is fresh — goal, touches, decisions, done-when. The step list is not: it's a guess until the code exists.

**Per-phase plan-review gate (HARD RULE).** Starting a phase: flip its `PLAN.md` row to `[~]`, re-read its phase file against the code as it now stands, correct whatever earlier phases invalidated, fill in the steps — then **pause for the user to review that plan before building.** Apply requested changes to the plan, not after. Build only on explicit go-ahead. Three stops per phase: plan-review (before), summary (after), and wait before the next. Quick-fix mode has no plan-review gate.

**Files beat memory; code beats files (HARD RULE).** When the `context/` files disagree with what you recall, the files win. When a phase file disagrees with the code in front of you, the code wins — correct the file and say what drifted. Never build to a stale plan just because it's written down.

**Manual checks are the user's (HARD RULE).** A phase's `Done when · Manual` items stay `[ ]` until the user confirms them by eye. Never tick them yourself, and never fold them into "verified" because the automated checks passed — **and a screenshot you took yourself is not a confirmation either.** Browser verification is evidence for you, not a substitute for the user's sign-off. → [browser-verification.md](.claude/chisel/reference/browser-verification.md)

**Log incidental findings (HARD RULE).** Notice a bug, oddity, or cleanup candidate mid-implementation — especially one unrelated to the change — add one line to `context/FINDINGS.md` (`- [ ] date · type · what · where · from {change}`) and keep going. Append-only: the only edit to an existing line is flipping its box and appending the outcome. Don't derail the phase to chase it; don't bury it in a phase file. **Discovered, not caused** — a rough edge in what you just built is unfinished work, not a finding: fix it in the phase or insert a `Phase Na`. At the change's last phase, `/chisel-change-implement` triages this change's own findings into fix-now / leave-open / won't-fix; leftovers are worked later via `/chisel-quick-fix` or their own change, never swept into unrelated work.

**Close every session (HARD RULE).** Before your final message whenever work stops: the phase row's status + one-line outcome on `[x]`, the `PLAN.md` `**Status:**` line (`scoping`/`planned`/`building`/`done`), a `## Log` line biased toward what's next, a refreshed INDEX state, and any new decisions appended. Then print the resume command (`/chisel-change-resume {NN}-{slug}`).

**Commits are offered, never taken (HARD RULE).** Stage the files the phase touched, explicitly by path — never `git add -A`. Propose a one-line message and ask before committing. **Never add a `Co-Authored-By:` or "Generated with…" trailer.** Never `--no-verify`, never `--amend`. Full procedure → [chisel-change-implement](.claude/skills/chisel-change-implement/SKILL.md).

### Reuse before building (HARD RULE)

**Before creating any new component, block, nav, slider, pagination, or helper — skim existing layers for a match:** `views/components/`, `core/Timber/Components.php`, `src/blocks/` + `src/blocks-acf/`, `core/Helpers/`. If one exists, reuse it; if it needs a variation, add a variant (block style, modifier class, ACF field, pattern flag) — see [section-mapping-decisions.md "Shared components rule"](.claude/chisel/reference/section-mapping-decisions.md#shared-components-rule). Create new only when nothing can be adapted.

### MCP (xfive-mcp-chisel) — default for all WP state writes

For any content insert/edit, image upload, ACF field, theme mod, option, nav menu, or post creation — use the `xfive-mcp-chisel` MCP tools. Never PHP seeds, manual paste, or direct DB edits. If the tools aren't in your tool list, **stop** and ask the user to install the plugin + register the MCP server. Only if they decline, ask explicitly for WP-CLI permission and follow the fallback protocol — never fall back because an MCP call failed. Tool list, payloads, defaults, the fallback protocol, and the **block-seeding silent-failure traps** (read before hand-writing block markup) → [mcp-workflow.md](.claude/chisel/reference/mcp-workflow.md).

### MCP (Playwright) — optional, for looking at the rendered page

Use Playwright MCP to open what you built before handing it to the user: console errors, a screenshot at the spec's viewport plus mobile, and the accessibility snapshot. **Unlike `xfive-mcp-chisel` this is optional** — if the tools aren't in your list, say so once, ask the user for a screenshot instead, and report the render as *not checked* rather than *passed*. Never stop a phase over it. The site URL is recorded as a `**Site URL:**` line in `context/INDEX.md` — ask once, then read it from there. Procedure, what it catches, and what it does **not** authorize you to tick → [browser-verification.md](.claude/chisel/reference/browser-verification.md).

**No test framework.** Chisel ships none and the toolkit adds none — no Jest, no PHPUnit, no Playwright spec files, no `npm test`. Verification is `chisel-verify` (static) + the build + the browser pass + the user's eyes. Don't scaffold a test suite unless the user asks for one.

### SCSS

- Always `@use '~design' as *;` at the top of every SCSS file. Use design helpers (`get-color`, `get-gap`, `get-font-size`, `get-layout-size`, …) — never raw `var(--wp--*)`, raw hex/px for tokenized values, or a `get-*` helper not defined in `src/design/tools/`.
- **Don't duplicate global styles (HARD RULE).** theme.json (`styles.typography`, `styles.elements.hN`, `settings.custom.*`) and base mixins cascade everywhere — never re-declare a value they set. If a value should be global, add it to theme.json. Full rule → [coding-conventions.md](.claude/chisel/reference/coding-conventions.md#dont-duplicate-global-styles-hard-rule).
- **Tokenize repeated values** — any repeated dimension (width, padding step, color, shadow, radius, transition) belongs in `theme.json` + a `get-*` helper. One-off non-repeating values only may stay raw.
- **Asset URLs go through the `background-image()` mixin** — never raw `url('../../assets/...')` (silently breaks the webpack build).
- BEM prefixes: `.c-` components, `.o-` objects, `.u-` utilities, `.b-` blocks, `.p-` patterns, `is-`/`has-` state.
- `_index.scss` barrels under `src/styles/{folder}/` are **auto-generated by the build** — never hand-edit; drop new partials and the build picks them up.

Full helper signatures, ITCSS layer order, JS/Twig conventions → [coding-conventions.md](.claude/chisel/reference/coding-conventions.md).

### Block type preference: ACF default, native React — stop and ask (HARD RULE)

When the decision ladder reaches a custom block, **default to ACF** (server-rendered Twig, fits the stack, avoids native seed traps). **Native React requires you to STOP and ask the user first**, with a specific justification: editor-canvas interactivity ACF can't express (in-canvas state, drag-to-reorder, true `<InnerBlocks>` composability), or a rare perf need that rules out server rendering. Frontend-only interactivity (slider, tabs, accordion) is NOT a justification — that's an ACF block + frontend JS. Full ladder → [section-mapping-decisions.md "Block decision ladder"](.claude/chisel/reference/section-mapping-decisions.md#block-decision-ladder).

### Content vs CSS (HARD RULE)

**Don't hide unwanted content with CSS — remove it at the source** (MCP `widget-remove` / `post-trash` / `acf-field-update`, or ask the user). `display: none` / `visibility: hidden` are reserved for a11y-only text (`u-sr-only`), state-driven UI the user toggles (mobile nav, accordion, tabs), and Twig-side empty-container checks. Anything else (default "Hello World" post, starter widget, stray block) — fix the data, not the presentation. When in doubt, ask.

### Design tokens (theme.json)

- Build incrementally — bootstrap the **design-system foundation** (palette, type/spacing scale, radius, shadows) upfront from the Figma Variables collection; add **section-level** tokens as screens introduce them, not in bulk.
- Repurpose sample tokens (change value, keep slug); prune only at project end, after grep proves zero references, never a protected slug.
- **Never rename protected slugs** (palette + spacing aliases) — SCSS references them by name. Extend aliases (`margin.medium`, `gap.normal`) rather than renaming. Protected set → [design-tokens.md](.claude/chisel/reference/design-tokens.md).

### Spacing between blocks

**Default a `core/spacer` between every two sibling inner blocks** (even when Figma uses a uniform `gap`) — editors need draggable handles; never `blockGap`/CSS `gap` for **vertical** sibling spacing. Horizontal column/grid gutters are the opposite: `core/columns` `blockGap` with a preset. Composition rule + spacer-size math → [design-tokens.md "Spacing between blocks"](.claude/chisel/reference/design-tokens.md#spacing-between-blocks).

### Before completing any task

- **Run `npx chisel-verify`** — token references, undefined helpers, preset classes (patterns *and* Twig), hand-written markup colors, margin pairs, pattern four-way sync, ACF group keys, SCSS conventions, untouched `core/`. Read-only. An exit of `1` must be fixed or explicitly justified, never ignored; an exit of `2` means it never ran. It cannot read page content seeded through MCP — that lives in the database — so never report that as verified. What each check means: [chisel-verify](.claude/skills/chisel-verify/SKILL.md).
- **Ask the user to run `npm run build-scripts`** to verify SCSS compiles — don't invoke it yourself.
- **Open the page** with Playwright MCP if it's available — console errors, a screenshot at the spec's viewport plus mobile against the spec crop, and the accessibility snapshot. This is the only check that sees seeded page content, broken asset URLs, and JS that throws. Skip it cleanly if the tools aren't there. → [browser-verification.md](.claude/chisel/reference/browser-verification.md).

## Reference docs

Load the matching doc before its skill (see "Scaffolding"):

- [file-locations](.claude/chisel/reference/file-locations.md) — where things go
- [design-tokens](.claude/chisel/reference/design-tokens.md) — token inventory + protected slugs
- [blocks](.claude/chisel/reference/blocks.md) — block/pattern file structures, build-pipeline rule, ACF field-data shape
- [acf-naming](.claude/chisel/reference/acf-naming.md) — ACF field group naming (hex keys, filename = key, name prefixes)
- [acf-wpml-translation](.claude/chisel/reference/acf-wpml-translation.md) — per-field WPML translation preferences
- [section-mapping-decisions](.claude/chisel/reference/section-mapping-decisions.md) — decision ladder + quick-pick table
- [cpt](.claude/chisel/reference/cpt.md) — Custom Post Type options, factory defaults, Gutenberg requirement
- [header-footer](.claude/chisel/reference/header-footer.md) — site chrome file map + which source feeds each element
- [base-styles](.claude/chisel/reference/base-styles.md) — where every base style lives + the icon system
- [screen-build-order](.claude/chisel/reference/screen-build-order.md) — phase order + verification checklist
- [mcp-workflow](.claude/chisel/reference/mcp-workflow.md) — MCP tool usage (posts, blocks, media, ACF, terms, menus, options, widgets)
- [browser-verification](.claude/chisel/reference/browser-verification.md) — the rendered half of verification (Playwright MCP, optional)
- [coding-conventions](.claude/chisel/reference/coding-conventions.md) — PHP/JS/SCSS/Twig conventions
- [twig-templating](.claude/chisel/reference/twig-templating.md) — Timber context, functions, hierarchy
- [assets-and-scripts](.claude/chisel/reference/assets-and-scripts.md) — asset registration, icons, Chisel hooks
- [rest-api](.claude/chisel/reference/rest-api.md) — custom REST/AJAX endpoints
- [woocommerce](.claude/chisel/reference/woocommerce.md) — WooCommerce integration

Templates (code to copy): [pattern-markup](.claude/chisel/templates/pattern-markup.md), [custom-block-template](.claude/chisel/templates/custom-block-template.md), [block-mod-template](.claude/chisel/templates/block-mod-template.md).

## Loading order

**This block (auto-loaded)** → **reference** (the "what" — load BEFORE the matching skill) → **skill** (the "how" — assumes its reference partner is in context) → **templates** (only when copying code).
