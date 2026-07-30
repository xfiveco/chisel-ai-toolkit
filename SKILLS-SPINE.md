# Skills spine + how/what re-homing

**Status:** planned, not started. Written 2026-07-29, after `47f61e5`.
**Companion:** [SKILLS-SPINE-LEDGER.md](SKILLS-SPINE-LEDGER.md) — the section-by-section
destination map. The ledger is the contract; this file is the method.

Two problems, one edit window:

1. **The twelve worker skills share no structure.** The five lifecycle skills (`chisel-new`,
   `chisel-implement`, `chisel-resume`, `chisel-quick-fix`, `chisel-verify`) already have a spine —
   scope line, hard rules, anti-patterns, Related. The other twelve each invented their own ending:
   `## Guidelines`, `## Conventions`, `## Rules`, `## What NOT to do`, or nothing.
2. **They leak across the how/what line.** [CLAUDE.md L12–15](rules/CLAUDE.md) declares a three-way
   split — reference owns the *what*, skills own the *how*, `templates/` owns code you copy. The
   reference docs hold their side. Several skills are hoarding reference material and inlining
   templates that should be files.

Doing these separately means formatting sections in pass one that move out in pass two. So: per
batch, re-home first, then re-spine what's left.

---

## The contract being enforced

From [CLAUDE.md L12–15](rules/CLAUDE.md) and the loading order at L157:

| Layer | Owns | Test |
| --- | --- | --- |
| `rules/reference/` | The **what** — file lists, decision ladders, inventories, constraints | Would a second skill need this sentence? |
| `rules/templates/` | Code you **copy** | Would you paste this into a new file? |
| `skills/` | The **how** — instructions in order | Is it a step? |

Everything in the ledger was sorted by those three questions, in that order.

## The spine

Eight slots. Skip what doesn't apply; never reorder. Lifecycle skills already sit on it — this
extends it to the other twelve.

1. **Frontmatter** — `name` · `description` (what it does · **Use when** · **Do NOT use**) ·
   `argument-hint` when it takes one · `allowed-tools`
2. **`# Title`**, one-sentence scope line, `Theme root:` line
3. **Before you start** — the load-first reference link, plus the gate that says when this is the
   wrong skill (create-block's STOP, extend-core-block's decision table, create-cpt's ladder already
   do this; they just aren't named alike)
4. **`## Procedure`** — numbered
5. **Body** — file maps, tables, whatever survives re-homing
6. **`## Traps`** — replaces Guidelines / Conventions / Rules / What NOT to do. Only things that
   **break**. Conventions that don't break move into the body
7. **`## Mechanical check`** — `npx chisel-verify`, then the two or three things it can't catch
8. **`## Related`** — 3–5 links, one line each saying why you'd follow it

## Rules of the pass

- **Ledger first, edits second.** Every `##`/`###` section in every touched file has a row before
  any file is opened for writing. A section with no row stops the pass.
- **Text moves verbatim.** Re-homing is cut-and-paste. Wording changes are a separate decision and
  get their own ledger note.
- **The skill keeps a pointer.** Where a section leaves, a one-line link replaces it — the reader
  who came for that content still finds it.
- **Nothing is deleted silently.** Sections that duplicate an existing reference home are listed in
  the ledger's *Duplicates* table with both texts, for a pick — not dropped.
- **New prose is written in exactly two places:** the `## Related` lists and the
  `## Mechanical check` lines. Everything else in this pass is moved, not authored.
- **Line accounting.** Lines out of skills ≈ lines into reference/templates, minus only what the
  Duplicates table names. Checked per batch with `git diff --stat`.

---

## Decisions — resolved 2026-07-29

**1. `chisel-theme-json` — gut it, keep the skill.** It has no procedure: protected slugs, a JSON
cookbook, guidelines. It is a reference doc in skill frontmatter. But it is also the **only** skill
using `paths:` auto-load (`**/theme.json`), a deliberate choice recorded at
[PLAN.md L138](PLAN.md) — it fires the guardrail whenever theme.json is edited, and
`design-tokens.md` is not auto-loaded.

Cookbook → `templates/theme-json-recipes.md`, protected-slug rule → `design-tokens.md`, and the
skill becomes a real four-step procedure: read current theme.json → make the edit → sync the
`src/design/tools/_theme.scss` accessor → verify. Auto-load survives, no inbound links break.

**2. Two new reference docs — create both.** [CLAUDE.md L73](rules/CLAUDE.md) currently admits
"`adapt-base-styles` / `adapt-header-footer` have no reference owner — open the skill directly."
That line exists because those two skills carry their own *what*. `rules/reference/base-styles.md`
and `rules/reference/header-footer.md` take the lookup tables; the admission line gets deleted in
batch 4.

**3. Pattern templates — append to `templates/pattern-markup.md`.** No new file. The PHP header
stub and SCSS stub join the block grammar already there, so building a pattern means opening one
template, not two.

---

## Batches

One commit per batch. Each batch is re-home → re-spine → verify.

### Batch 0 — spine on the two lifecycle stragglers

`chisel-resume`, `chisel-verify` — both are missing only `## Related`. Smallest possible proof the
spine reads right before touching twelve files.

### Batch 1 — the `create-*` family (6 skills)

`create-pattern` · `create-block` · `create-acf-block` · `create-component` · `create-cpt` ·
`create-acf-options`

Creates: `templates/acf-block-template.md`, `templates/component-template.md`,
`templates/cpt-template.md`, `templates/acf-options-template.md`, `rules/reference/cpt.md`
Appends to: `templates/pattern-markup.md`

### Batch 2 — theme.json + adapt family (4 skills)

`setup-theme-json` · `theme-json` · `adapt-base-styles` · `adapt-header-footer`

Creates: `rules/reference/base-styles.md`, `rules/reference/header-footer.md`,
`templates/theme-json-recipes.md`

### Batch 3 — orchestrator + tail (2 skills)

`figma-to-chisel` · `extend-core-block`

Appends to: `templates/block-mod-template.md`

### Batch 4 — the wiring

- `rules/CLAUDE.md`: add new reference docs to the list at L139–151, add their entry points at
  L67–72, delete the "no reference owner" line at L73
- `lib/emit.js` / `scripts/validate-skills.js`: confirm nothing enumerates skills or reference docs
  by name
- `PLAN.md`: a Phase 9 record

---

## Verification, per batch

1. Ledger reconciliation — every row's destination exists and holds the text
2. `node <scratchpad>/check-links.js` — all cross-doc links and `#anchor`s resolve
3. `npm run validate` — frontmatter, `name` = directory, cross-links
4. `git diff --stat` — moved-out lines ≈ moved-in lines
5. Read one restructured skill end to end, cold

## Risks

- **Anchor breakage.** Renaming `## Guidelines` → `## Traps` breaks any inbound `#guidelines` link.
  The checker catches it; the ledger flags known inbound links per file.
- **Four inbound links to `chisel-theme-json`** — `figma-to-chisel` L38, `coding-conventions.md`
  L170, `design-tokens.md` L5 and L182. Safe under decision 1 as resolved (the skill survives), but
  L5 says "see theme-json to modify" — check it still reads true once the cookbook has moved out.
- **`screen-build-order.md` phase numbers** are referenced in `figma-to-chisel` prose. Don't
  renumber during batch 3.
- **Scope creep into reference docs.** This pass may only *add* to reference docs. Restructuring
  them again is out of scope — they were done in `5b48ddc`.

## Not doing

- Rewriting any procedure. Steps stay as written.
- Touching the five lifecycle skills beyond adding `## Related` to two of them.
- Merging `chisel-setup-theme-json` and `chisel-theme-json` into one skill. They are genuinely
  bootstrap vs edit.
- Folding the link/anchor checker into `validate-skills.js` — still deferred from Phase 8.
