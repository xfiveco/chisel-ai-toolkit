---
name: chisel-change-new
description: Start a new Chisel change — scope it with the user, then plan it in phases behind two review stops. Writes context/changes/{NN}-{slug}/ with a PLAN.md and one file per phase, then hands off to /chisel-change-implement. Use whenever the user asks for something to be built, added, changed or fixed in a Chisel theme — a section, block, pattern, CPT, style change, or Figma import. Do NOT use for questions about existing code, explanations, or read-only investigation.
argument-hint: "[what you want built]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---

# Start a Chisel change

Theme root: `{{THEME_ROOT}}`. All paths below are relative to it.

Two stops, then hand off. You scope it and pause. You plan it and pause. `/chisel-change-implement` builds it.

**Write no code in this skill. Not one line.**

## 0. Check what's already in flight

Read `context/INDEX.md`.

- **Something under `## Active`** → this is probably a resume, not a new change. Hand off to
  `/chisel-change-resume` (naming the change if more than one is active) and stop. Only continue if the
  user confirms this is genuinely separate work.
- **Feedback on already-built work** — QA notes, a code-review comment, a bug report on something
  that exists → check `/chisel-quick-fix` first. What qualifies there skips this skill entirely.
- **No `context/` folder** → this is the project's first change. You create it in step 4; nothing
  else is needed now.

## 1. Pick the mode

The mode decides the `## Source` block and the typical phase set, nothing else — the phase shape,
the gates, and every hard rule are identical across all of them.

| Input | Mode | Notes |
| --- | --- | --- |
| A Figma URL | **Figma** | `/chisel-figma-to-chisel` orchestrates the build; scope and plan here first |
| Screenshots, PDFs, written notes | **static-asset** | Skip the Figma skills |
| A feature described in chat | **prompt** | No orchestrator; pick the matching `create-*` skill per phase |

## 2. Ground yourself

The reference docs describe how **Chisel** works; only the repo tells you what **this project**
already has. Read both before scoping — this step is what
[CLAUDE.md's "Reuse before building"](CLAUDE.md#reuse-before-building-hard-rule) asks for, at the
one moment it's cheap to act on.

Read, in this order:

1. `CLAUDE.md` — the project's rules, especially anything marked `(HARD RULE)`. Anything settled
   there is not a question.
2. The reference doc that owns whatever this change creates — entry points are in
   [CLAUDE.md "Scaffolding"](CLAUDE.md#scaffolding-hard-rule). Load it before scoping, not after.
3. `context/INDEX.md`, and the `PLAN.md` of anything related — what earlier changes built, and
   what they already decided.

Then check what exists, on the paths that answer it:

| Question | Look at |
| --- | --- |
| What are the tokens actually set to? | `theme.json` — the reference doc holds starter values, not this project's |
| Which patterns exist? | `patterns/` |
| Which blocks exist? | `src/blocks/`, `src/blocks-acf/` |
| Which block styles and mods are registered? | `src/scripts/editor/blocks-styles.js`, `src/scripts/editor/mods/` |
| Which Twig components exist? | `views/components/`, `core/Timber/Components.php` |

Scale it to the job — a copy tweak needs none of this. Spawn a subagent only for a genuinely
open-ended search ("is there a slider anywhere in this theme?"). Never for the six lookups above:
their paths are known, and reading them is cheaper than briefing an agent.

## 3. Scope — then stop

Restate the task in your own words. Name what you'll touch and what is explicitly out.

Then ask with `AskUserQuestion`, in rounds of 1–4:

| Size | Questions | Looks like |
| --- | --- | --- |
| Small | 2–3 | One pattern or one component, established convention, no real unknowns. |
| Medium | 4–6 | Several parts that interact, a mapping decision or two, edge cases worth naming. |
| Large | 7–10 | A full screen import, a new CPT plus its templates, anything expensive to get wrong. |

Subtract from that count for everything `CLAUDE.md` and the reference docs already settle.

**Worth asking about:** scope boundaries · which sections are editor-driven vs hardcoded · block
vs pattern vs ACF vs CPT where the [decision ladder](.claude/chisel/reference/section-mapping-decisions.md#block-decision-ladder)
leaves a real choice · what happens when content is empty or overflows · how we'll know it worked ·
and, for anything Medium and up, the content model and what gets cut if time runs out.

**Never worth asking:** anything the codebase answers, anything the reference docs already decide
(spacer-vs-gap, ACF-vs-native, naming conventions), and preferences that don't change what's built.

Rules for the questions:

- 2–4 concrete options each. Mark exactly one `⭐ Recommended`, and ground that recommendation in
  what you found in step 2 — not in a guess.
- Every option's description ends in its cost:
  `[what this is] · Strength: [advantage] · Tradeoff: [what it costs].`
- Don't pad to look thorough.

Capture every answer as a decision — what was chosen and **why**. These go into `## Decisions` in
step 4. **They are the only part of this conversation that survives the session**; the discussion
itself does not.

Carry no open question past this step. If something is unresolved, ask again — don't plan around a
hole. **Pause for the user.**

## 4. Plan — then stop

A phase is **one reviewable, committable unit of work** — not one step.

Right-size it. Most changes are 1–3 phases. More than 5 means you over-split, or this should have
been two changes. One phase is a perfectly good plan — say so rather than inventing structure.

- **Split** when a piece can be reviewed and committed on its own, when feedback on it would change
  what comes after, or when it's genuinely large.
- **Don't split** by file type or mechanical step. "Add the SCSS", "add the Twig", "register the
  block" are one phase — they ship together and none can be verified alone. Running a build is not
  a phase.

**The standing exception is a screen import:** one phase per section, top to bottom, so 8–12 rows
is normal and correct. Sections are independently reviewable, which is exactly the test.

Say in one line why you split the way you did.

### Typical phase sets

**Figma / static-asset — one screen.** The build order is owned by
[screen-build-order.md](.claude/chisel/reference/screen-build-order.md) — read its steps and turn
them into phases. Don't restate a second, competing order here. What planning adds on top:

- **The project-wide steps happen once.** Tokens, base styles, header and footer are done on the
  first screen and already done on the second — say so in `## Scope` and start at the sections.
- **Steps with no visible section of their own** — a CPT, a custom block, a block style — ride
  along in the phase of the first section that needs them, unless one is big enough to review alone.
- **The last phase is the gate**, run against the
  [verification checklist](.claude/chisel/reference/screen-build-order.md#verification-checklist).

Multi-screen imports get **one change folder per screen** (`01-home`, `02-about`), sharing the
token and base-style phases by reference. Only fold two screens into one folder if they're tightly
coupled — then suffix the section phases (`5-home`, `5-about`) and list both in `## Source`.

**Prompt mode.** Tailor it. Defaults:

- **Greenfield feature** — tokens → content model (CPTs) → view model (Twig context, helpers) →
  templates → editor experience (block styles, ACF) → styling → behavior (JS)
- **Rebuild** — audit → token migration → base styles → component-by-component port → parity check → cutover
- **Large refactor** — inventory usages → introduce the new abstraction → migrate callers in
  batches → remove the old one → cleanup

Unsure? The canonical default is the
[feature-building sequence](.claude/chisel/reference/section-mapping-decisions.md#recommended-feature-building-sequence).

### Files to write

Pick the next free number in `context/changes/` (highest + 1, zero-padded). Never renumber an
existing folder — INDEX links and cross-change references point at it.

```text
context/
  INDEX.md                     # router — Planned / Active / Done. Always read first.
  FINDINGS.md                  # project-level, append-only
  FIXES.md                     # quick-fix batches — owned by /chisel-quick-fix
  changes/
    {NN}-{slug}/
      PLAN.md                  # always
      phase-NN-{slug}.md       # one per phase — multi-phase only
```

**One phase → no phase file.** Fold the goal, done-when, and steps straight into `PLAN.md`. Don't
spawn a near-empty file for small work.

Create `INDEX.md` and `FINDINGS.md` if this is the project's first change, then add the change's
line under `## Active`.

### `PLAN.md`

```markdown
# {Title}

<!-- Source of truth across sessions. When in doubt this file wins — unless the code says otherwise.
     Per-phase detail → phase-NN-*.md (open only the phase you're working).
     Project rules → ../../../CLAUDE.md · Incidental findings → ../../FINDINGS.md -->

**Status:** `scoping | planned | building | done` · **Started:** {YYYY-MM-DD}

## Source

<!-- Figma mode -->

- Mode: Figma
- File key: `{fileKey}` · File name: {name}
- URL: {full URL}
- Root node: `{nodeId}` ({screen name})

<!-- static-asset / prompt mode -->

- Mode: {static-asset | prompt}
- Spec source: {screenshots in /docs, Linear epic FOO-123, prompt in chat}

## Goal

{One paragraph. What works, from the user's side, once this is done.}

## Scope

- **In:** {what this covers}
- **Out:** {what it explicitly does not}

## Decisions

<!-- Everything settled in conversation rather than derived from code. Append; never rewrite.
     A future session can re-derive any mechanical detail from the code — never the discussion. -->

| Decision | Choice | Why | Phase |
| --- | --- | --- | --- |
| {Hero: ACF block or pattern} | {ACF block} | {client edits the copy weekly} | scoping |
| {wideSize} | {1296px} | {matches the Figma frame} | scoping |

## Phases

<!-- One row per phase: status + one-line outcome + link. No expanded plan here.
     `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked -->

- `[ ]` **Phase 1 — {name}** — {not started} → [phase-01-{slug}.md](phase-01-{slug}.md)
- `[ ]` **Phase 2 — {name}** — {not started} → [phase-02-{slug}.md](phase-02-{slug}.md)

## Shared / cross-phase

- {component, treatment, or font used by more than one phase — added once, reused}

## Deferred

- {thing} — {why it's deferred, what would unblock it}

## Log

<!-- One line per working session, even "no progress". Newest at bottom.
     Bias toward what's next so the following session resumes cold. -->

- {YYYY-MM-DD} — scoped and planned, {N} phases. Phase 1 next.
```

**The one-line outcome on a `[x]` row is mandatory.** It's what lets a later session understand a
finished phase without opening its file. A `[x]` row still reading "not started" defeats the whole
layout.

### `phase-NN-{slug}.md`

Write **all of them now**, while the scoping answers are fresh.

```markdown
# Phase {NN} — {title}

> Plan: [PLAN.md](PLAN.md) · Status: `[ ] | [~] | [x] | [!]`

- **Goal:** {one sentence}
- **Touches:** {files, blocks, patterns, tokens, MCP tools, Figma node ids}
- **Decisions:** {the mapping call, the block-type choice, what the user said about this section —
  and why. Cross-cutting ones live in PLAN.md's `## Decisions`; this is what's specific here.}
- **Done when:**
  - _Automated:_ `npx chisel-verify` clean · `npm run build-scripts` passes (ask the user to run it)
  - _Manual:_ {what a human has to look at — rendered section vs the Figma crop, editor behaviour,
    responsive breakpoints}
- **Artifacts produced:** {pattern slugs, block names, CPTs, theme.json deltas}
- **Steps:** _filled at this phase's gate, not now._
- **Notes / blockers:** {only if non-empty}
```

**Done-when now, steps at the gate.** Done-when is an *outcome* — it's what the user is approving,
and it doesn't depend on code that doesn't exist yet. Steps are a *guess* until the code is real,
and they're cheap to write later against what's actually there.

### `PLAN.md` — single-phase change

Same file, same headings, with `## Phases` replaced by the phase body inline. Everything else —
`## Source`, `## Scope`, `## Decisions`, `## Deferred`, `## Log` — stays exactly as above, so a
small change reads the same way as a big one.

```markdown
## Phase

<!-- Single-phase change: no phase file. Status lives on the `**Status:**` line above. -->

- **Goal:** {one sentence}
- **Touches:** {files, blocks, patterns, tokens, MCP tools}
- **Done when:**
  - _Automated:_ `npx chisel-verify` clean · `npm run build-scripts` passes (ask the user to run it)
  - _Manual:_ {what a human has to look at}
- **Artifacts produced:** {pattern slugs, block names, CPTs, theme.json deltas}
- **Steps:** _filled at the gate, not now._
- **Notes / blockers:** {only if non-empty}
```

Drop `## Shared / cross-phase` — with one phase there is nothing to share. Keep `## Decisions`
even for small work: it's the only part of the conversation that survives.

### `INDEX.md` and `FINDINGS.md` (first change only)

```markdown
# Index

<!-- Router. Read this first every session. One line per change.
     Things noticed in passing → FINDINGS.md. Project rules → ../CLAUDE.md -->

## Planned

## Active

- `[~]` [Home Figma import](changes/02-home-import/PLAN.md) — Figma · 8 sections · on Phase 6

## Done

- `[x]` [Contact form](changes/01-contact-form/PLAN.md) — prompt · done 2026-06-02
```

```markdown
# Findings

<!-- Incidental bugs, oddities, cleanup candidates noticed during any change — including ones
     unrelated to the active work. One line, then keep going; don't derail the phase.
     Append-only; newest at bottom. `[ ]` open · `[x]` resolved · `[-]` won't fix. -->

- [ ] 2026-07-21 · bug · Mobile nav traps focus when submenu open · views/components/nav.twig · from 03-hero
```

Each line: `date · type · what · where · from {origin change}`, plus an outcome once it closes.
Type tags are loose (`bug`, `note`, `cleanup`, `perf`, `a11y`, `security`).

Set `PLAN.md` `**Status:** planned`. **Pause for approval.**

## 5. Hand off

```text
✓ context/changes/{NN}-{slug}/  — {N} phases
✓ context/INDEX.md              — moved to Active

Next:
  → /chisel-change-implement {NN}-{slug}
```

Stop. Don't start Phase 1 because the plan looks approved.

## Hard rules

1. **Write no code.** Two stops, then hand off. Building here skips the gate this whole shape
   exists to enforce.
2. **Decisions go in the file before you plan around them.** If it came out of a conversation,
   `## Decisions` is the only copy that survives the session.
3. **One change, one goal, one mode.** Never mix Figma and prompt work in one `PLAN.md`, and never
   bolt an unrelated new goal onto a finished one — new goal, new folder, new INDEX row.
4. **Insert, never renumber.** New work mid-flight becomes `Phase 2a` between 2 and 3, filed as
   `phase-02a-{slug}.md` — the padded number it follows, plus the letter. Renumbering breaks every
   reference already written down.
5. **Absolute dates.** `2026-07-21`, never "today" or "next Tuesday". These files are read months later.
6. **Incidental findings go to `context/FINDINGS.md`** — one line, then keep going. A bug you
   notice while scoping doesn't derail the scoping. Append-only: the sole edit permitted to an
   existing line is flipping its box and appending the outcome.
7. **Completed changes stay put.** Status lives in `INDEX.md`, never in the filesystem path. There
   is no `archive/`.

## Anti-patterns

- ❌ Planning before scoping. (The questions change the plan; that's the point of asking them.)
- ❌ Re-asking what `CLAUDE.md` or a reference doc already settles.
- ❌ Expanded phase plans inside `PLAN.md`. (Rows are status + outcome + link. Detail lives in the phase file.)
- ❌ Pre-writing the step list. (It's a guess about code that doesn't exist. Done-when now, steps at the gate.)
- ❌ Splitting by layer — "the SCSS phase", "the Twig phase". Neither can be reviewed alone.
- ❌ Five phases for a two-file change.
- ❌ A phase file for a single-phase change. (Fold it into `PLAN.md`.)
- ❌ Leaving a question open and planning around it.
- ❌ Decisions left in the transcript.
- ❌ Skipping the grounding step and planning a component that already exists.
- ❌ Starting Phase 1 in the same breath as presenting the plan.

## Related

- Building the plan → [chisel-change-implement](.claude/skills/chisel-change-implement/SKILL.md)
- Picking up an active change → [chisel-change-resume](.claude/skills/chisel-change-resume/SKILL.md)
- Feedback on built work, no plan needed → [chisel-quick-fix](.claude/skills/chisel-quick-fix/SKILL.md)
- Figma import orchestration → [chisel-figma-to-chisel](.claude/skills/chisel-figma-to-chisel/SKILL.md)
- Which block type a section becomes → [section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md)
- Per-screen phase order and the done gate → [screen-build-order.md](.claude/chisel/reference/screen-build-order.md)
