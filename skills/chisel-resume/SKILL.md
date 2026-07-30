---
name: chisel-resume
description: Pick up an in-flight Chisel change in a fresh session — read the context files, state where the work stands, and open the next phase. Use when the user says "resume", "continue", "what's next", "where were we", or names a change folder. Do NOT use to start new work (that's /chisel-new) or to answer questions about existing code.
argument-hint: "[NN-slug]"
allowed-tools:
  - Read
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
---

# Resume a Chisel change

Theme root: `{{THEME_ROOT}}`. All paths below are relative to it.

Your job is to reload state from the files and hand the user a decision, not to start building.
Read in the order below and stop reading as soon as you can state where the work stands — the
layout exists so you *don't* load everything.

## 1. Find the change

Read `{{THEME_ROOT}}/context/INDEX.md`.

- **Argument given** (`/chisel-resume 03-about-page`) — use that folder. Accept a bare number
  (`03`), the full folder name, or a path; match against `changes/`. No match → say so, list what
  is under `## Active`, stop.
- **No argument, one change Active** — use it.
- **No argument, several Active** — list them with their one-phrase states and ask which. Don't
  guess.
- **Nothing Active** — say so, mention the most recent `## Done` change in case they meant that, and
  point at `/chisel-new`.

## 2. Reload state

Open `changes/{NN}-{slug}/PLAN.md` and read `**Status:**`, `## Source`, `## Scope`,
`## Decisions`, and the phase table.

The `[x]` rows' one-line outcomes are what happened — **don't open completed phase files.** If a
row is `[x]` with no outcome, that's a gap: note it, and reconstruct from `## Log` rather than
reopening the phase file.

Then find the current phase — the first row that is `[~]`, or the first `[ ]` after the last `[x]`
— and open **only that** `phase-NN-*.md`. Read `## Log` only if the phase table leaves you unsure
where the trail ends.

**Single-phase change:** there is no phase table and no phase file. `PLAN.md`'s `## Phase` block is
the whole picture, and `**Status:**` carries the state.

## 3. Reconcile against the code

The phase file was written back at planning time, before the earlier phases were built. Before you
report anything, spot-check its `Touches` against what's actually on disk.

Where they disagree, **the code wins** — correct the file and say what drifted. Never present a
stale plan as the current one. Decisions in `## Decisions` are not subject to this: they came from
the user, not the code, and only the user changes them.

## 4. Report, then stop

Give the user, in a few lines:

- Where the change stands — status, phases done, what's next.
- What the next phase is for, and the decisions that shaped it.
- Anything that drifted in step 3.
- Open items: `[!]` blocked phases, unresolved notes, anything in `## Deferred`.

Then ask whether to start that phase. **Stop.** Starting it means stop 1 of
[`/chisel-implement`](.claude/skills/chisel-implement/SKILL.md) — flip the row to `[~]`, fill in the
steps against the code as it now stands, pause again. Don't skip ahead to code because the plan was
already written.

## Notes

- Blocked (`[!]`) phase and the user wants to move? Offer the next unblocked phase rather than
  forcing order — then note the reorder in `PLAN.md`'s `## Log`.
- Findings triage isn't part of resuming. If `FINDINGS.md` has open lines relevant to the next
  phase, mention them in one line; don't work them.
- If the files and your recollection disagree, the files win. Full procedure:
  [`/chisel-implement`](.claude/skills/chisel-implement/SKILL.md).

## Related

- Building the phase you just opened → [chisel-implement](.claude/skills/chisel-implement/SKILL.md)
- Scoping work that has no change folder yet → [chisel-new](.claude/skills/chisel-new/SKILL.md)
- Feedback on built work, no plan needed → [chisel-quick-fix](.claude/skills/chisel-quick-fix/SKILL.md)
- What each automated check means → [chisel-verify](.claude/skills/chisel-verify/SKILL.md)
