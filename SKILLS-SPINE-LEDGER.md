# Ledger — skills spine + how/what re-homing

Companion to [SKILLS-SPINE.md](SKILLS-SPINE.md). Every `##` and load-bearing `###` section in every
touched file, with its destination. **A section not in this ledger does not get moved.**

Line ranges are section-boundary derived (a section runs to the next heading of equal or higher
level) and were taken before any edit — they will drift as the pass runs. They locate content; they
are not offsets to edit by.

| Verdict | Meaning |
| --- | --- |
| KEEP | Stays in the skill, possibly renamed into a spine slot |
| RENAME | Same content, spine heading (`## Guidelines` → `## Traps`) |
| SPLIT | Part stays, part moves — both destinations given |
| MOVE | Goes to a reference doc; skill keeps a one-line pointer |
| TEMPLATE | Goes to `rules/templates/`; skill keeps a one-line pointer |
| MERGE | Content already has a home elsewhere — see *Duplicates* |
| NEW | Written by this pass (only `## Related` and `## Mechanical check`) |
| DECIDE | Blocked on a decision in SKILLS-SPINE.md — **none remain, all three resolved 2026-07-29** |

---

## Batch 0 — lifecycle stragglers

### `skills/chisel-resume/SKILL.md`

| Section | Lines | Verdict | Destination / note |
| --- | --- | --- | --- |
| Frontmatter | 1–11 | KEEP | Already on spine |
| Title + scope + theme root | 13–19 | KEEP | |
| `## 1. Find the change` … `## 4. Report, then stop` | 21–71 | KEEP | |
| `## Notes` | 73–81 | KEEP | Traps-equivalent; keep the name, it is genuinely notes |
| — | — | NEW | `## Related` → chisel-new, chisel-implement, chisel-quick-fix |

### `skills/chisel-verify/SKILL.md`

| Section | Lines | Verdict | Destination / note |
| --- | --- | --- | --- |
| Frontmatter · title · scope | 1–17 | KEEP | |
| `## 1. Run it` … `## 3. Report, then fix on request` | 19–51 | KEEP | |
| `## What this does not cover` | 53–57 | KEEP | The mechanical-check slot inverted — correct as-is |
| — | — | NEW | `## Related` → chisel-implement, chisel-quick-fix, screen-build-order.md |

---

## Batch 1 — the `create-*` family

### `skills/chisel-create-pattern/SKILL.md`

| Section | Lines | Verdict | Destination / note |
| --- | --- | --- | --- |
| Frontmatter | 1–14 | KEEP | Add `Use when` / `Do NOT use` to `description` |
| Title + load-first + intro | 16–20 | KEEP | Becomes **Before you start** |
| `## Scope rules` | 22–26 | KEEP | Joins **Before you start** — it is a gate |
| `## When to use` | 27–30 | KEEP | Joins **Before you start** |
| `## Procedure` | 31–51 | KEEP | |
| `## Pattern PHP template` | 52–70 | TEMPLATE | Append to `templates/pattern-markup.md` — no new file |
| `## Pattern SCSS template` | 71–82 | TEMPLATE | Same target |
| `## Spacing between children` | 83–86 | KEEP | Already pure pointers to blocks.md + design-tokens.md |
| `## Guidelines` 1 — name by function | 89 | RENAME | → `## Traps` |
| `## Guidelines` 2 — presets over pattern SCSS | 90–91 | SPLIT | The rule → `blocks.md` (it governs any block markup, not just patterns); the pattern-specific "section padding on the outer block" half stays in `## Traps` |
| `## Guidelines` 3–5 — realistic copy, flag unknowns, interactivity → create-block | 92–94 | RENAME | → `## Traps` |
| `## Guidelines` 6 — tokenize | 95 | MERGE | Duplicate of coding-conventions.md "Tokenize repeated values" — see *Duplicates* |
| `## Guidelines` 7 — don't hide with CSS | 96 | MERGE | Duplicate of CLAUDE.md "Content vs CSS" — see *Duplicates* |
| `## Guidelines` 8 — asset URLs via mixin | 97 | MOVE | `coding-conventions.md` — it already owns "Asset URLs in SCSS (build trap)" |
| `## Guidelines` 9 — no dead media in pattern source | 98 | MOVE | `blocks.md` "Pattern" section — a file-content constraint |
| — | — | NEW | `## Mechanical check`, `## Related` |

### `skills/chisel-create-block/SKILL.md`

| Section | Lines | Verdict | Destination / note |
| --- | --- | --- | --- |
| Frontmatter | 1–14 | KEEP | Add exclusion to `description` |
| `## STOP. Did you ask the user first?` | 18–29 | KEEP | The canonical **Before you start** gate — model the other five on it |
| Load-first + intro + seed shape | 31–35 | KEEP | Joins **Before you start** |
| `## Procedure` | 37–43 | KEEP | |
| `## Optional files` | 44–48 | MOVE | `blocks.md` "Custom WP Block" already lists the file set |
| `## Conventions` | 49–57 | MOVE | `blocks.md` — class prefixes and block naming are cross-skill |
| `## Guidelines` | 58–66 | RENAME | → `## Traps`; items 1–3 are the same gate as the STOP block, collapse the repetition |
| — | — | NEW | `## Mechanical check`, `## Related` |

### `skills/chisel-create-acf-block/SKILL.md`

| Section | Lines | Verdict | Destination / note |
| --- | --- | --- | --- |
| Frontmatter | 1–14 | KEEP | Add `Use when` / `Do NOT use` |
| Title + load-first | 16–21 | KEEP | **Before you start** |
| `## Procedure` | 22–29 | KEEP | |
| `## Templates` → `### block.json` | 32–81 | TEMPLATE | `templates/acf-block-template.md` |
| `### {block-name}.twig` | 82–111 | TEMPLATE | Same |
| `### style.scss` | 112–122 | TEMPLATE | Same |
| `### script.js (CSS entry — always)` | 123–128 | TEMPLATE | Same |
| `### view.js (frontend behavior)` | 129–148 | TEMPLATE | Same |
| `### acf-json/group_{hash}.json` | 149–171 | TEMPLATE | Same — **but** the naming rules inside are `acf-naming.md`'s; template keeps the shape, links out for the rules |
| `## Validation defaults` | 172–175 | MOVE | `blocks.md` "ACF field data shape" |
| `## Default alignment` | 176–191 | MOVE | `blocks.md` — it is a filter + registration fact, and `assets-and-scripts.md` L120–142 already links to this section as the filter-shape example. **Redirect that inbound link.** |
| `## Guidelines` | 192–end | RENAME | → `## Traps` |
| — | — | NEW | `## Mechanical check`, `## Related` |

This is the file the whole pass exists for: ~140 of ~193 lines are templates, while its sibling
`create-block` correctly links out to `templates/custom-block-template.md`.

### `skills/chisel-create-component/SKILL.md`

| Section | Lines | Verdict | Destination / note |
| --- | --- | --- | --- |
| Frontmatter | 1–13 | KEEP | Add `Use when` / `Do NOT use` |
| Title + load-first + "not for Gutenberg" | 15–19 | KEEP | **Before you start** |
| `## Procedure` | 21–26 | KEEP | |
| `## Twig template` | 27–45 | TEMPLATE | `templates/component-template.md` |
| `## SCSS` | 46–57 | TEMPLATE | Same |
| `## JS module (optional)` | 58–88 | TEMPLATE | Same |
| `## Conventions` | 89–95 | MERGE | Prefixes duplicate `file-locations.md` "Naming" L65–66 — see *Duplicates* |
| `## Objects (simpler, more abstract)` | 96–102 | SPLIT | Paths → `file-locations.md` (it already lists `views/objects/`); the "when is it an object not a component" judgement stays as **Before you start** |
| — | — | NEW | `## Mechanical check`, `## Related` |

### `skills/chisel-create-cpt/SKILL.md`

| Section | Lines | Verdict | Destination / note |
| --- | --- | --- | --- |
| Frontmatter | 1–13 | KEEP | |
| Title + ladder link | 15–18 | KEEP | **Before you start** — already correct |
| `## Rules` | 20–24 | RENAME | → `## Traps`, or promote into **Before you start** if they are gates |
| `## Procedure` | 25–48 | SPLIT | Steps stay; the PHP registration block → `templates/cpt-template.md` |
| `## Taxonomy` | 49–63 | TEMPLATE | `templates/cpt-template.md` |
| `## All CPT options` | 64–76 | MOVE | **`rules/reference/cpt.md`** (new) — a `register_post_type()` inventory is textbook *what* |
| `## Block template (default layout)` | 77–87 | TEMPLATE | `templates/cpt-template.md` |
| `## Templates (only if user asks)` | 88–95 | MOVE | `twig-templating.md` "Template hierarchy" already owns `single-{slug}.twig` / `archive-{slug}.twig` |
| `## After registering` | 96–99 | KEEP | Last procedure step — fold into `## Procedure` |
| `## Pair with a custom block` | 100–end | MOVE | `section-mapping-decisions.md` "CPT decision" — it is the *don't use an ACF repeater* ladder, and that doc already owns the ladder |
| — | — | NEW | `## Mechanical check`, `## Related` |

### `skills/chisel-create-acf-options/SKILL.md`

| Section | Lines | Verdict | Destination / note |
| --- | --- | --- | --- |
| Frontmatter | 1–13 | KEEP | Add `Use when` / `Do NOT use`; it is the only create-\* skill with no load-first line |
| Title + intro | 15–19 | KEEP | Add load-first → `acf-naming.md` + `file-locations.md` |
| `## Procedure` | 20–26 | KEEP | |
| `## 1. Register options page` (+ `### Top-level`, `### Sub-page`) | 27–56 | TEMPLATE | `templates/acf-options-template.md`; the `chisel_acf_options_pages` filter row already lives in `file-locations.md` L11–12 |
| `## 2. Add options to Timber context` | 57–76 | TEMPLATE | Same file; `file-locations.md` L16 owns the filter |
| `## 3. ACF field group JSON` | 77–112 | TEMPLATE | Same file — naming rules stay `acf-naming.md`'s, template links out |
| `## 4. Populate fields` | 113–121 | MOVE | `mcp-workflow.md` "ACF fields" L76 |
| `## Common field types` | 122–125 | KEEP | Two lines, skill-specific enough to leave |
| `## Accessing in Twig` | 126–end | MOVE | `twig-templating.md` — it owns Twig access |
| — | — | NEW | `## Mechanical check`, `## Related` |

---

## Batch 2 — theme.json + adapt family

### `skills/chisel-theme-json/SKILL.md`

Resolved: **gut it, keep the skill.** The `paths:` auto-load is the only guardrail that fires
without anyone invoking a skill — it survives.

| Section | Lines | Verdict | Destination / note |
| --- | --- | --- | --- |
| Frontmatter (incl. `paths:` auto-load) | 1–18 | KEEP | Add `Use when` / `Do NOT use` to `description` |
| Title + "always read theme.json first" | 20–24 | KEEP | Becomes step 1 of the new procedure (1A) |
| `## Protected slugs` | 26–29 | MERGE | Already delegates to `design-tokens.md` — collapse to the pointer |
| `## Common modifications` (`### Add a color` … `### Duotone`) | 30–146 | TEMPLATE | `templates/theme-json-recipes.md` — ten copy-paste JSON shapes |
| `## Current tokens` | 147–150 | MERGE | Pointer to `design-tokens.md` already |
| `## Guidelines` | 151–end | SPLIT | Cross-skill rules → `design-tokens.md`; edit-time traps → `## Traps` |
| — | — | NEW | A four-step `## Procedure` (read → edit → sync `_theme.scss` accessor → verify), which the skill currently lacks entirely |
| — | — | NEW | `## Mechanical check`, `## Related` |

Four inbound links stay valid because the skill survives — but re-read `design-tokens.md` L5
("see theme-json to modify") once the cookbook has moved out, and confirm it still points somewhere
useful.

### `skills/chisel-setup-theme-json/SKILL.md`

| Section | Lines | Verdict | Destination / note |
| --- | --- | --- | --- |
| Frontmatter | 1–13 | KEEP | Add `Use when` / `Do NOT use` (it is run-once — say so) |
| Title | 15–19 | KEEP | Add `Theme root:` line |
| `## Spec source` | 20–29 | KEEP | **Before you start** |
| `## Prerequisites` | 30–34 | KEEP | **Before you start** |
| `## Procedure` `### 1`–`### 8` | 35–116 | KEEP | Except ↓ |
| `### 4. Protected slugs (DO NOT RENAME)` | 70–81 | MERGE | Third copy of the protected-slug list (`design-tokens.md`, `chisel-theme-json`, here) — see *Duplicates* |
| `## Output report` | 117–126 | KEEP | Skill-specific hand-off format |
| `## Guidelines` | 127–end | RENAME | → `## Traps` |
| — | — | NEW | `## Mechanical check`, `## Related` |

### `skills/chisel-adapt-base-styles/SKILL.md`

Resolved: **`rules/reference/base-styles.md` gets created.**

Two-thirds of this file is a where-does-it-live map. `file-locations.md` declares it "Owns paths"
but has no per-block SCSS map — so this is not duplication, it is content held in the wrong layer.

| Section | Lines | Verdict | Destination / note |
| --- | --- | --- | --- |
| Frontmatter | 1–13 | KEEP | Add `Use when` / `Do NOT use` |
| Title + "do this before pattern SCSS" | 15–19 | KEEP | Scope line |
| `## Starter values vs current values` | 21–24 | MOVE | `design-tokens.md` — it is a fact about every documented token value in the toolkit, not about this skill |
| `## Decision: global vs pattern-scoped` | 25–34 | KEEP | **Before you start** — the gate |
| `## Procedure` | 35–41 | KEEP | |
| `## File map` `### Buttons` | 44–64 | SPLIT | Table → **`rules/reference/base-styles.md`** (new); the "read the Figma component description, not the section context" variant-reading rule stays as a **Trap** |
| `### Per-block defaults` | 65–78 | MOVE | `base-styles.md` |
| `### Elements` | 79–87 | MOVE | `base-styles.md` |
| `### Typography` | 88–96 | MOVE | `base-styles.md` |
| `### Links` | 97–104 | MOVE | `base-styles.md` |
| `### Forms` | 105–111 | MOVE | `base-styles.md` |
| `### Spacing` | 112–119 | MERGE | Three rows, all already in `design-tokens.md` — see *Duplicates* |
| `### Icons` | 120–143 | MERGE | `assets-and-scripts.md` "Icon system" L57–89 owns this, including SVG cleaning — see *Duplicates* |
| `### Colors, radius, shadows` | 144–153 | SPLIT | Table → `design-tokens.md`; the border-radius spec check stays as a **Trap** |
| `### Global components` | 154–160 | MOVE | `base-styles.md` (or `file-locations.md` — same two rows) |
| `## Tokenize before you write SCSS (HARD RULE)` | 161–166 | MERGE | Duplicate of coding-conventions.md — see *Duplicates* |
| `## Removing unwanted seeded content (HARD RULE)` | 167–170 | MERGE | Duplicate of CLAUDE.md "Content vs CSS" — see *Duplicates* |
| `## Verification` | 171–174 | RENAME | → `## Mechanical check`; add `npx chisel-verify`, which it does not currently mention |
| — | — | NEW | `## Traps`, `## Related` |

### `skills/chisel-adapt-header-footer/SKILL.md`

Resolved: **`rules/reference/header-footer.md` gets created.**

| Section | Lines | Verdict | Destination / note |
| --- | --- | --- | --- |
| Frontmatter | 1–13 | KEEP | Add `Use when` / `Do NOT use` |
| Title + "headers are Twig, not patterns" | 17–19 | KEEP | Scope line — and a gate; it is the most-missed fact in the file |
| `## Files involved` | 21–30 | MOVE | **`rules/reference/header-footer.md`** (new) |
| `## Content source rule` | 31–44 | MOVE | `header-footer.md` — an element→source mapping table is pure *what* |
| `### Footer columns + copyright: widgets first (load-bearing)` | 45–52 | SPLIT | The registered-sidebar facts → `header-footer.md`; the "don't rebuild with an ACF repeater" instruction stays as a **Trap** |
| `## Procedure` `### 1`–`### 7` | 53–104 | KEEP | |
| `## Mobile nav toggle` | 105–108 | MOVE | `header-footer.md` |
| `## What NOT to do` | 109–end | RENAME | → `## Traps` |
| — | — | NEW | `## Mechanical check`, `## Related` |

---

## Batch 3 — orchestrator + tail

### `skills/chisel-figma-to-chisel/SKILL.md`

| Section | Lines | Verdict | Destination / note |
| --- | --- | --- | --- |
| Frontmatter | 1–14 | KEEP | `description` needs `Do NOT use`; add `argument-hint: "[Figma URL]"` |
| Title + "this skill calls other skills" | 17–19 | KEEP | Scope line; add `Theme root:` |
| `## Required prerequisites` | 21–25 | KEEP | **Before you start** |
| `## Load-bearing rules for Figma mode` | 26–32 | KEEP | Genuinely this skill's own rules |
| `## Skill map` | 33–48 | KEEP | This *is* its Related section — keep as-is, do not duplicate into `## Related` |
| `## Procedure` `### Phase 0`–`### Phase 7` | 49–115 | KEEP | **Do not renumber** — `screen-build-order.md` L3 pins Phase 4/5 to these numbers |
| `## Output report` | 116–end | KEEP | |
| — | — | NEW | `## Traps` (currently has none), `## Mechanical check` |

### `skills/chisel-extend-core-block/SKILL.md`

| Section | Lines | Verdict | Destination / note |
| --- | --- | --- | --- |
| Frontmatter | 1–13 | KEEP | Add `Use when` / `Do NOT use` |
| Title + load-first + three approaches | 15–23 | KEEP | **Before you start** |
| `## Decision` (table + "don't style a default as a variant") | 25–36 | KEEP | The gate — second-best example after create-block's STOP |
| `## 1. Block Style` → `### Procedure` | 37–47 | KEEP | |
| `### JS pattern` | 48–71 | TEMPLATE | Append to `templates/block-mod-template.md` |
| `### SCSS pattern` | 72–83 | TEMPLATE | Same |
| `## 2. Block Mod` + `### Procedure` | 84–118 | SPLIT | Steps stay; code → `templates/block-mod-template.md` |
| `## 3. SCSS-Only Customization` + `### Procedure` | 119–end | KEEP | |
| — | — | NEW | `## Traps`, `## Mechanical check`, `## Related` |

---

## Duplicates — pick one wording, delete the other

Nothing here is dropped without a decision. Both texts get shown at the point of edit.

| # | Content | Copy A | Copy B | Recommendation |
| --- | --- | --- | --- | --- |
| D1 | Tokenize before hardcoding | `coding-conventions.md` "Tokenize repeated values" | `adapt-base-styles` L161–166 (HARD RULE) + `create-pattern` Guideline 6 | Keep reference copy. A hard rule inside a skill binds only sessions that invoke it |
| D2 | Never hide content with CSS | `CLAUDE.md` "Content vs CSS (HARD RULE)" | `adapt-base-styles` L167–170 + `create-pattern` Guideline 7 | Keep CLAUDE.md copy — it is auto-loaded |
| D3 | Protected slugs | `design-tokens.md` (canonical) | `chisel-theme-json` L26–29 + `setup-theme-json` L70–81 | Keep reference copy; both skills already link to it |
| D4 | Icon system | `assets-and-scripts.md` "Icon system" L57–89 | `adapt-base-styles` L120–143 | Compare first — the skill copy has the `$static-icons` + `chisel_editor_scripts` add-an-icon steps, which the reference may lack. Merge upward, don't discard |
| D5 | Spacing token locations | `design-tokens.md` | `adapt-base-styles` L112–119 | Keep reference copy |
| D6 | CSS class prefixes | `file-locations.md` "Naming" L65–66 | `create-component` L89–95 + `create-block` L49–57 | Keep reference copy |
| D7 | Asset URLs via `background-image()` | `coding-conventions.md` "Asset URLs in SCSS (build trap)" L138 — already covers the `$is-block: true` case | `create-pattern` Guideline 8 + `create-acf-block` Guideline 5 | **Resolved in batch 1** — reference copy kept, both skills reduced to a Trap line linking to it |
| D8 | `acf-field-update` with `post_id: "option"` | `mcp-workflow.md` "ACF fields" L76–85 | `create-acf-options` "4. Populate fields" | **Resolved in batch 1** — verbatim duplicate, skill keeps the step and links out |
| D9 | `view.js` / `init.php` optional files | `blocks.md` "Custom WP Block" L61, L66 | `create-block` "Optional files" | **Resolved in batch 1** — folded into procedure step 1 as a parenthetical |
| D10 | "Documented values are starter state — read the file" | `design-tokens.md` L3 (token values) | `adapt-base-styles` "Starter values vs current values" | **Batch 2: deliberately kept in both.** `design-tokens.md` scopes it to token values; `base-styles.md` hard rule 1 extends it to mixin defaults and block-style lists. Each doc needs it standalone |

## Source verification

`cpt.md` and `header-footer.md` were written from what the skills asserted, then checked against the
real theme at `H:\localhost\test\xfive-co\wp\wp-content\themes\xfive-co-chisel`. `header-footer.md`
held up; `cpt.md` had three errors (see below). Everything in `base-styles.md` was checked against
the theme **before** writing.

| Doc | Claim | Verdict |
| --- | --- | --- |
| `cpt.md` | Factory generates labels, **capabilities** and REST | **Wrong** — labels only. `capability_type` defaults to `post`, `capabilities` to empty |
| `cpt.md` | `title`/`page-attributes`/`revisions`/`author` "always present" | **Too strong** — correct defaults, but filterable globally and per post type |
| `cpt.md` | Option list | **Too thin** — ~12 pass-through args and every default value were missing |
| `cpt.md` | `supports` merges rather than replaces | ✓ confirmed (`array_merge` on numeric keys appends) |
| `header-footer.md` | 4 footer columns + copyright in `core/WP/Sidebars.php` | ✓ confirmed; a `blog` sidebar exists alongside |
| `header-footer.md` | `footer.twig` renders them via `footer_sidebars` / `copyright` | ✓ confirmed (`Site.php` L80–81) |
| `base-styles.md` | Elements layer | Skill listed 4 files; theme has 7 (`_html`, `_images`, `_table` were missing) |
| `base-styles.md` | `$static-icons` in `src/design/settings/_index.scss` | ✓ confirmed, same five icons |
| `base-styles.md` | Design tools layer | Skill named 3 files; theme has 11 — full table added |

## Accounting

Filled in as each batch lands.

| Batch | Lines out of skills | Lines into reference/templates | Delta explained by |
| --- | --- | --- | --- |
| 0 | — | — | Two `## Related` blocks added, nothing moved |
| 1 | ~600 removed across 7 skills | ~530 into 4 new templates + 2 new reference docs + 57 into `blocks.md` | New prose: `## Related` and `## Mechanical check` on 7 skills, plus `## Traps` rewrites of Guidelines lists. 465 links resolve (was 326) |
| 2 | ~230 removed across 3 skills | ~200 into `base-styles.md` + ~150 into `theme-json-recipes.md` | `chisel-theme-json` gained a `## Procedure` it never had; `setup-theme-json` gained Traps + Mechanical check |
| 3 | | | |

### Batch 1 scope change

`chisel-adapt-header-footer` and `rules/reference/header-footer.md` were **pulled forward from batch 2**.
`create-component` and `create-acf-options` both needed to point at the content-source mapping, and
leaving those links dangling would have failed batch 1's own verification. Batch 2 is correspondingly
smaller: `setup-theme-json`, `theme-json`, `adapt-base-styles`.

### Batch 1 deviations from the plan

- **`create-cpt` "Pair with a custom block"** was marked MOVE → `section-mapping-decisions.md`. On
  reading it, the section is a five-step build recipe, not a decision — so it **split**: the rule
  ("never an ACF repeater, always a CPT-driven block") went to `section-mapping-decisions.md`, the
  PHP went to `cpt-template.md`, and the steps stayed in the skill where they belong. The ledger's
  own sorting test (is it an instruction in order? → skill) picked this up.
- **`acf-options` "4. Populate fields"** was marked MOVE → `mcp-workflow.md`. It was already there
  verbatim at L76–85, so it was a duplicate, not a move. Skill keeps a pointer. Logged as D8 below.
- **`create-block` "Optional files"** was likewise already in `blocks.md`'s Custom WP Block file
  list. Deleted from the skill, folded as a parenthetical into procedure step 1. Logged as D9.
