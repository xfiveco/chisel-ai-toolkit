---
name: chisel-quick-fix
description: Apply QA / code-review / visual-review feedback to already-built work without the planning ceremony — no progress files, no plan-review gate. Triage each feedback item against the quick-fix criteria; escalate anything that is really new scope.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
---

# Quick fix

For feedback on work that already exists: QA notes, code-review comments, visual-review nits, bug reports. The planning process (task file / phase file / plan-review gate) is waived — **nothing else is**. All project hard rules still apply: reuse-before-building, MCP for WP state writes, SCSS/token rules, don't-duplicate-globals, content-vs-CSS, and the "Before completing any task" checklist.

## Entry criteria (all three must hold, per item)

1. **Existing files only.** The fix edits files that already exist — no new block, pattern, CPT, options page, Twig component, or token slug. (A new *value* on an existing token, a new modifier class, or a new ACF field on an existing group is fine.)
2. **No cross-cutting decision.** No mapping-ladder choice (block vs pattern vs ACF), no theme.json restructuring, no protected-slug change, no architectural call.
3. **Correction, not scope.** It fixes built work to match the spec/review — it doesn't add a feature that was never built.

Deliberately **not** a criterion: file count. A review batch may touch many files trivially; that's still a quick fix.

## Procedure

1. **Announce the mode.** One line — "treating this as a quick fix (N items)" — so the user can override. Don't pause for approval; proceed unless told otherwise.
2. **Triage each feedback item** against the three criteria:
   - Passes all three → fix-now list.
   - Fails any → **escalate**: name the item and why (new artifact / decision needed / new scope), and handle it via normal mode — a new `changes/{NN}-{task-name}/` folder or a new phase on the related task per the [chisel-plan skill](.claude/skills/chisel-plan/SKILL.md), with its plan-review gate. Never silently downgrade an escalation back into the quick-fix batch.
   - Mixed batch → fix the passing items now; the escalated ones wait for their plan.
3. **Fix the passing items.** Before touching a shared selector or global partial, read it first (diff-only overrides). Content problems → MCP tools, never CSS hiding. If a fix reveals mid-flight that it needs a new artifact after all, stop that item and escalate it — don't create the artifact under quick-fix.
4. **Log if a task folder exists.** If the fixed work belongs to a task with a `changes/{NN}-{task-name}/` folder, append one session-log line (`{YYYY-MM-DD} — agent — QA fixes: {short list}`) to its `LOG.md` (or the single-phase roadmap's inline log). No new folder, no phase file, no INDEX row. Orphan fixes get no progress entry. If a fixed item was tracked in `ai-progress/FINDINGS.md`, update that line's status; anything incidental you notice while fixing goes to `FINDINGS.md` as usual.
5. **Close out.** Run the "Before completing any task" checklist from CLAUDE.md (ask the user to run `npm run build-scripts`, verify `get-color`/preset references, pattern four-way sync if patterns were touched). Then summarize: items fixed, items escalated (with why), files touched.

## Anti-patterns

- ❌ Creating a new block/pattern/component "while I'm here". (That's normal mode — escalate.)
- ❌ Skipping the escalation and quietly planning-free-building new scope because it started as feedback.
- ❌ Creating a `changes/{NN}-{task-name}/` folder for a quick-fix batch. (The whole point is no ceremony; the session-log line is the only trail.)
- ❌ Hiding a reviewed-out element with `display: none`. (Content vs CSS hard rule still applies.)
- ❌ Batching unrelated feature requests into the "feedback" list to dodge the plan-review gate.
