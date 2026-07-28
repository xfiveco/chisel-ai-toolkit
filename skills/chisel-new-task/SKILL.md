---
name: chisel-new-task
description: Start a new Chisel task — scope it, plan it in phases, then build one phase at a time behind review gates. Use whenever the user asks for something to be built, added, changed or fixed in a Chisel theme (a section, block, pattern, CPT, style change, Figma import). Do NOT use for questions about existing code, explanations, or read-only investigation.
argument-hint: [what you want built]
---

# Start a Chisel task

Theme root: `{{THEME_ROOT}}`. All paths below are relative to it.

## 0. Check for work already in flight

Read `{{THEME_ROOT}}/ai-progress/INDEX.md`. If anything is listed under `## Active`, this is
probably a resume, not a new task — hand off to `/chisel-resume` (naming the task if more than one
is active) and stop following this skill. Only continue below if the user confirms this is genuinely
separate work.

## 1. Pick the mode

- **Feedback on already-built work** (QA notes, code-review comments, bug report) → check
  `/chisel-quick-fix` first. Items that qualify skip everything below: triage, fix, report.
  Items that don't qualify come back here.
- **Figma URL provided** → `/chisel-figma-to-chisel` orchestrates; the phase rules below still apply.
- **Anything else** → continue.

## 2. Scope — then stop

Restate the task in your own words. List what you'll touch and what is explicitly out of scope.

Then ask your clarifying questions with `AskUserQuestion`, in rounds of 1–4. Give each 2–4 concrete
options, mark one `⭐ Recommended`, and end every option with its tradeoff — so the answer records a
*reason*, not just a pick. Size the count to the task: ~2–3 questions for a one-phase job, 3–5 for
two or three phases, 6–10 for an eight-section Figma import. Don't pad to look thorough, and don't
ask what the codebase or `CLAUDE.md` already answers.

Capture every answer as a decision — what was decided, what was chosen, why. These go into the
roadmap's `## Decisions` table in step 3. **They are the only part of this conversation that
survives the session**; the discussion itself does not.

Carry no open question past this step. If something is still unresolved, ask again — don't plan
around a hole. **Pause for the user.**

## 3. Plan — then stop

Produce a phased plan. A phase is **one reviewable, committable unit of work** — not one step.

Right-size it. Most tasks are 1–3 phases; more than 5 means you've over-split or the task should
have been two tasks. A single phase is a perfectly good plan for a small task — say so rather
than inventing structure.

- **Split** when a piece can be reviewed and committed on its own, when feedback on it would
  change what comes after, or when it's genuinely large. Figma imports split per section,
  top to bottom.
- **Don't split** by file type or mechanical step. "Add the SCSS", "add the Twig", "register the
  block" are one phase — they ship together and none can be verified alone. Don't make a phase
  out of running a build, and don't pad a plan to look thorough.

Say in one line why you split the way you did. Create the progress files per `/chisel-plan` —
including **one phase file per phase, written now**, while the scoping answers are still fresh.
Each carries the goal, what it touches, and the decisions behind it. Leave the step-by-step
checklist empty: it's a guess until the code exists, and it's cheap to write at the phase's gate.
**Pause for approval.**

## 4. Execute — one phase, three stops

For each phase, in order:

1. Flip the roadmap row to `[~]`. Re-read the phase file written back at planning time and check it
   against the code as it now stands — earlier phases may have invalidated parts of it, and the
   **code wins over the file**. Correct what drifted, then fill in the checklist.
   **Then stop — write no code.**
   The user may change the plan; apply changes to the plan, not after the fact.
2. On explicit go-ahead, build that phase only. Then run `npx chisel-verify` — it's the mechanical
   checklist (token references, pattern four-way sync, SCSS conventions, untouched `core/`) and it
   is not optional. Fix what it flags, or say why a finding stands. Summarize what changed and what
   the user should verify by eye. **Stop.**
3. Wait for "next" before touching the following phase.

Notice a bug or oddity along the way — even unrelated to this task? Append one line to
`{{THEME_ROOT}}/ai-progress/FINDINGS.md` and keep going. Don't derail the phase to chase it.

```text
- [ ] 2026-07-21 · bug · Mobile nav traps focus when submenu open · views/components/nav.twig · from 03-hero
```

`date · type · what · where · origin task`, newest last. `[ ]` open, `[x]` resolved,
`[-]` won't fix. Append only — never rewrite an existing line; the sole edit permitted is
flipping its box and appending the outcome. Full procedure: `/chisel-plan`.

## 5. Close every session

Every time you stop — phase done, user leaves, context running short — do this **before** your
final message, not after. A session that ends without it loses its trail.

- Roadmap row: set the status, and on `[x]` write the one-line outcome (mandatory).
- Roadmap `**Status:**`: `scoping` → `planned` → `building` → `done` as the task moves.
- `LOG.md`: one line, biased toward what's next. Even "no progress".
- INDEX row: refresh the one-phrase state (`on Phase 5`).
- Anything decided since the last stop: append it to `## Decisions`.

Then print the command to pick this up again, so the next session starts cold without archaeology:

```text
→ /chisel-resume 03-about-page
```

## 6. Wrap up

Final summary plus follow-ups after the last phase. Move the INDEX row to `## Done` and set the
roadmap `**Status:**` to `done`.

---

If anything is ambiguous at any point, ask before starting. Don't guess.
