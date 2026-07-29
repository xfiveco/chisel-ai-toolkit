# Skills refactor — plan

> **Done 2026-07-29.** All 11 steps landed; `npm run validate` and the link/anchor checker are
> green. Kept as the record of *why* — the outcome is summarised in `PLAN.md` Phase 8.
> References to `chisel-new-task`, `chisel-plan`, `ai-progress/` and `ROADMAP.md` below describe
> the state before the refactor and are deliberately left as written.

## Why

The lifecycle skills are cut along the wrong axis. [`chisel-new-task`](skills/chisel-new-task/SKILL.md)
(114 lines) does scope + plan + build + close in one file; [`chisel-plan`](skills/chisel-plan/SKILL.md)
(328 lines) is a standalone file-format spec that four other skills half-restate.

The reference set at `H:\localhost\test\ai-toolkit\new-skills` (`start` / `new` / `implement`) shows
the better cut: split **plan vs build**, and put each file template inline in the skill that writes
it. The spec then disappears — nothing needs to load 328 lines to write a roadmap row.

Most of the CLAUDE.md ↔ new-task ↔ plan duplication exists *because* the spec is a separate file.
Dissolving it removes the duplication as a side effect.

## Decisions made

| Decision | Choice | Why |
| --- | --- | --- |
| Skill split | `chisel-new` (scope + plan) + `chisel-implement` (build) | Single-purpose each; matches the new-skills cut |
| `chisel-plan` | **Delete.** Templates → `chisel-new`, update rules → `chisel-implement` | Nothing should load a 328-line spec to write one file |
| Folder | `ai-progress/` → **`context/`** | Align with new-skills. Toolkit is unreleased, so no installed theme to migrate |
| Roadmap file | `ROADMAP.md` → **`PLAN.md`** | Same |
| `reference/progress-template.md` | **Delete** | It exists only to point at `chisel-plan`; with templates inline it's a hop with no payload |
| Commit flow | Port from new-skills `implement`, including ticket detection | Worth writing down: stage by path, one-line message, no trailers |
| `PROJECT.md` | **Skip** | `CLAUDE.md` + the design spec already cover that layer |
| `LOG.md` | **Drop the conditional** — always fold `## Log` into `PLAN.md` | The multi-phase/single-phase split buys little |
| `/start` equivalent | **Skip** | The toolkit ships `CLAUDE.md`; `chisel-new` creates `context/` on first run |
| Grounding step | Fixed-path checklist, **not** `Explore` fan-out | Chisel's reference docs already give the framework shape; only project *state* needs reading, and its paths are known |

## Scope

- **In:** the four lifecycle skills (`new-task`, `plan`, `resume`, `quick-fix`), the 7 files that
  reference them, and the `ai-progress/` → `context/` rename.
- **Out:** the 11 `create-*` skills, `chisel-verify`, `chisel-figma-to-chisel`'s own phase logic
  (only its cross-references get repointed). Applying the reference-doc spine to all 17 skills is
  a separate follow-up.

## Target shape

| Now | → | After |
| --- | --- | --- |
| `chisel-new-task` (114) — scope + plan + build + close | → | **`chisel-new`** — mode → ground → scope ⏸ → plan ⏸ → hand off. Writes no code. |
| `chisel-plan` (328) — format spec | → | **`chisel-implement`** — resolve → load → phase loop (3 stops) → commit ⏸ → close |
| `chisel-resume` (75) | → | unchanged behaviour; hands to `chisel-implement` |
| `chisel-quick-fix` (42) | → | unchanged behaviour |

```
context/
  INDEX.md                     # router — Planned / Active / Done
  FINDINGS.md                  # append-only, project-level
  changes/
    {NN}-{slug}/
      PLAN.md                  # status, goal, scope, decisions, phase table, deferred, log
      phase-NN-{slug}.md       # multi-phase only; single-phase folds into PLAN.md
```

## What to port from new-skills

Source: `H:\localhost\test\ai-toolkit\new-skills\{new,implement}\SKILL.md`

**Into `chisel-new`**

- Grounding step — but as the fixed-path checklist below, not `Explore` agents.
- Question-sizing table (Small 2–3 / Medium 4–6 / Large 7–10), minus what `CLAUDE.md` already settles.
- Option contract: `[what this is] · Strength: [advantage] · Tradeoff: [what it costs].`, exactly one `⭐ Recommended`.
- "What's worth asking / never worth asking" lists.
- `PLAN.md` + `phase-NN-{slug}.md` templates, inline.
- **Done-when, split `Automated:` / `Manual:`** — chisel has no acceptance criteria today. Biggest single gain.
- "Done-when now, steps at the gate" rule.
- Hand-off block naming the next command.
- `## Hard rules` + `## Anti-patterns` sections.

**Into `chisel-implement`**

- Three-stop phase loop (gate → verify/summary → close-and-wait).
- "Read every file you're about to change, fully" at the gate.
- Steps filled at the gate against real code, never at planning time.
- **Plan-vs-reality escalation** — the `Expected / Found / Why it matters` block plus the three-way
  ask (adapt · skip · re-plan). Chisel currently has no branch for divergence too big to absorb.
- **Touched-file set** tracked during build; it — not `git status` — decides what gets staged.
- **Commit section, as updated by the user**: stage explicitly by path (never `git add -A`);
  `git status --porcelain` check with the three-way ask if anything dirty sits outside the set;
  ticket detection (`**Ticket:**` in `PLAN.md` → branch name → conversation, ask once, record the
  answer); two message formats — `<ticket>: <phase title>` or `<type>(<NN-slug>): <title> (p<N>)`;
  **never add a trailer**; never `--no-verify`, never `--amend`.
- Manual done-when items are the user's — never tick them.
- Close-every-session block + resume command.
- `## Hard rules` + `## Anti-patterns` sections.

## What stays chisel-specific

- Mode picker: Figma / static-asset / prompt / quick-fix.
- `## Source` block carrying the Figma file key, node id, URL.
- Figma phase sets and multi-screen guidance (currently `chisel-plan` "Mode-specific guidance").
- `npx chisel-verify` in place of `/verify`.
- **Ask the user to run `npm run build-scripts`** — never invoke it directly.
- MCP-only rule for WordPress state writes.

## Grounding checklist (replaces Explore fan-out)

`chisel-new` reads these before scoping — this is [`CLAUDE.md`'s "Reuse before building" HARD
RULE](rules/CLAUDE.md) turned into a step, which no skill performs today:

1. `theme.json` — current token values (the reference doc only holds starter values)
2. `patterns/` — existing slugs
3. `src/blocks/` + `src/blocks-acf/` — existing blocks
4. `src/scripts/editor/blocks-styles.js` + `mods/` — registered styles and mods
5. `views/components/` — existing Twig components
6. `context/INDEX.md` — what prior changes built and decided

Scale to the job — a copy tweak needs none of it. Spawn a subagent **only** for a genuine search
with no known path ("is there already a slider anywhere?"), never for these six lookups.

## Steps

- [x] **1 — Write `chisel-new`.** New folder `skills/chisel-new/SKILL.md`. Absorb `chisel-new-task`
      §0–3 + `chisel-plan`'s creation templates and Figma phase sets. Add grounding, done-when,
      hard rules, anti-patterns.
- [x] **2 — Write `chisel-implement`.** New folder `skills/chisel-implement/SKILL.md`. Absorb
      `chisel-new-task` §4–6 + `chisel-plan`'s "Updating mid-work" / "At session end". Add the
      escalation block, touched-file set, commit section, hard rules, anti-patterns.
- [x] **3 — Delete** `skills/chisel-new-task/`, `skills/chisel-plan/`, `rules/reference/progress-template.md`.
- [x] **4 — Update `chisel-resume`.** Repoint L66 (`/chisel-new-task` step 4 → `/chisel-implement`
      stop 1) and L75 (`/chisel-plan` → `/chisel-implement`). Rename paths to `context/` + `PLAN.md`.
- [x] **5 — Update `chisel-quick-fix`.** Repoint its `chisel-plan` reference; rename paths.
- [x] **6 — Update `chisel-figma-to-chisel`.** Repoint two `chisel-plan` references; rename paths.
- [x] **7 — Update `rules/CLAUDE.md`.** L27 (`/chisel-new-task` → `/chisel-new`), L77 ("owned by
      `/chisel-plan`" → `/chisel-new`), L81 plan-review gate wording, the whole `ai-progress/` →
      `context/` rename, and drop `progress-template` from the `## Reference docs` list.
- [x] **8 — Update `rules/reference/screen-build-order.md`** — it references `ai-progress/`.
- [x] **9 — Update `scripts/validate-skills.js`** L60 — the link-check exemption names `chisel-plan`.
- [x] **10 — Update `PLAN.md`** — 5 stale references; add a phase entry recording this refactor.
- [x] **11 — Verify.** `npm run validate`, plus the link/anchor checker (below). Grep for
      `ai-progress`, `ROADMAP.md`, `chisel-plan`, `chisel-new-task` — expect zero hits.

## Verification

`npm run validate` covers skill frontmatter and cross-links. The link + anchor checker used during
the reference-doc pass is worth re-adding — it caught nothing only because it was run every step:

- every `](...)` target resolves to a real file under the theme-root convention
- every `#anchor` matches a heading in the target file
- markdown tables have uniform rendered row width

Worth folding into `scripts/validate-skills.js` so a bad cross-link fails `prepublishOnly`.

## Notes

- **No external ripple.** The toolkit is unreleased, so no installed theme has an `ai-progress/`
  folder. The rename is free. Internal repointing (steps 4–10) still has to happen.
- Skill folder name = the slash command. `skills/chisel-new/` → `/chisel-new`.
- Keep the `chisel-` prefix: skills install into a shared `.claude/skills/` alongside other packages.
- Reference-doc restructure (spine: scope line · hard rules · body · traps · mechanical check ·
  related) landed across all 14 files before this. Apply the same spine to the skills as a
  follow-up, once these two are written.
