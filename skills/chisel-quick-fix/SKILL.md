---
name: chisel-quick-fix
description: Apply feedback to already-built Chisel work — QA notes, code-review comments, visual nits, small bug reports — without the planning ceremony. No change folder, no phases, no plan-review gate. Triages every item first and kicks anything that is really new scope back to /chisel-change-new. Use when the user pastes a list of fixes, reports something broken in built work, or says "quick fix", "small change", "just fix". Do NOT use to build something new.
argument-hint: "[the feedback, or a list of items]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - AskUserQuestion
---

# Quick fix

Theme root: `{{THEME_ROOT}}`. All paths below are relative to it.

For corrections to work that already exists: QA notes, code-review comments, visual-review nits, bug reports. **Only the planning is waived — nothing else is.** Every rule in `CLAUDE.md` still applies, especially anything marked `(HARD RULE)`: reuse-before-building, MCP (or explicitly permitted WP-CLI) for WP state writes, SCSS/token rules, don't-duplicate-globals, content-vs-CSS. And `npx chisel-verify` still runs before you're done.

## Entry criteria (all three must hold, per item)

Judge each item separately. A batch is rarely all one thing.

1. **Existing files only.** The fix edits files that already exist — no new block, pattern, CPT, options page, Twig component, or token slug. (A new *value* on an existing token, a new modifier class, or a new ACF field on an existing group is fine.)
2. **No decision that outlives the fix.** No mapping-ladder choice (block vs pattern vs ACF), no theme.json restructuring, no protected-slug change, no architectural call. **If the answer would have to be written down for the next person, it isn't a quick fix.**
3. **Correction, not scope.** It brings built work in line with what was already intended — it doesn't add a feature that was never built.

**File count is deliberately not a criterion.** A review batch can touch twenty files trivially — still a quick fix. One file can hide a theme.json restructure — not one.

## Procedure

### 1. Announce the mode

One line — *"treating this as a quick fix (6 items)"* — so the user can override. Don't pause for approval; proceed unless told otherwise.

### 2. Triage every item

- **Passes all three** → fix-now list.
- **Fails any** → **escalate.** Name the item and which criterion it failed (new artifact / decision needed / new scope), and handle it through [chisel-change-new](.claude/skills/chisel-change-new/SKILL.md) — a new `context/changes/{NN}-{slug}/` folder, or a new phase on the related change, with its plan-review gate.
- **Mixed batch** → fix the passing items now; the escalated ones wait for their plan. Say clearly which is which before you start.

Never quietly demote an escalation back into the batch because it turned out to be small.

### 3. Fix

Read before you edit — especially anything shared. A change to a Twig component, a global partial, a base mixin, or a token value ripples into places you weren't asked to touch; check who else uses it first, then write a diff-only override rather than restating the block.

Content problems go through MCP tools, never CSS hiding.

**If a fix turns out mid-way to need a new artifact or a real decision**, stop that item, leave it undone, and escalate it. Don't create the artifact under quick-fix cover — that's exactly the failure the triage exists to prevent.

### 4. Verify

Run `npx chisel-verify` and fix what it flags. A batch of small fixes is the easiest way to break something unrelated. Then **ask the user to run `npm run build-scripts`** — never invoke it yourself.

**It can't see seeded content.** SCSS, patterns, Twig and ACF groups are all read — but content pushed into a page through MCP lives in the database, and a fix batch is often exactly that. A clean run says nothing about it.

So **open the page** — Playwright MCP at the URL the batch touched (site URL from `context/INDEX.md`): console messages, a screenshot against the spec, the accessibility snapshot. Quick-fix mode is where this matters most, because most of these items *came from* someone looking at the rendered page, and the render is the only place the fix is visible. If the tools aren't available, say the render is unchecked and ask the user to look. → [browser-verification.md](.claude/chisel/reference/browser-verification.md)

Then list what still needs a human eye. Your own screenshot isn't that.

### 5. Leave a trail

Skipping the plan doesn't mean skipping the record. **Every batch gets one line**, written *before* the commit so it lands in it.

1. **`context/FIXES.md`** — always, one line per batch: `date · what · where`, newest at bottom, append-only. If the batch belongs to a change, append ` · {NN}-{slug}`. Create the file if it doesn't exist yet.

   ```text
   - 2026-07-21 · header contrast, hero spacing, empty-cart copy · views/components/header.twig, src/styles/patterns/_hero.scss · 03-about-page
   ```

2. **If the fixed work belongs to an existing change folder** — also append one line to its `PLAN.md` `## Log`, so someone reading that change sees it: `{YYYY-MM-DD} — quick fix: {short list}`.
3. **If an item was already tracked** in `context/FINDINGS.md` — flip its box and append the outcome.
4. **Anything you notice while fixing** goes to `context/FINDINGS.md` as usual — one line, keep going.

Still no change folder, no phase file, no `INDEX.md` row. One line in `FIXES.md` is the whole ceremony.

### 6. Commit

Same rules as [chisel-change-implement](.claude/skills/chisel-change-implement/SKILL.md), and for the same reason — a fix nobody can find later isn't finished.

1. Stage the files you touched, **explicitly by path**, plus `context/FIXES.md`. Never `git add -A`.
2. Look for a ticket key — a `**Ticket:**` line in the related `PLAN.md`, the branch name, the conversation. If none turns up, ask once. Never invent one.
3. Propose **one line**: `ABC-123: fix header contrast and hero spacing` with a ticket, `fix: header contrast and hero spacing` without. No body. **No `Co-Authored-By:`, no "Generated with…", no trailers of any kind.**
4. Ask: **commit as proposed** · **edit the message** · **skip for now**.
5. Never `--no-verify`, never `--amend`.

One commit per batch, not per item — unless the items are genuinely unrelated, in which case split them.

### 7. Close out

Summarize: items fixed, items escalated (with why), files touched, and anything the user should check by eye.

## Anti-patterns

- ❌ Creating a new block/pattern/component "while I'm here". (That's `/chisel-change-new` — escalate.)
- ❌ Skipping the escalation because the new work looked small once you started it.
- ❌ Batching unrelated feature requests into the "feedback" list to dodge the plan-review gate.
- ❌ Creating a `context/changes/{NN}-{slug}/` folder for a quick-fix batch. (The `FIXES.md` line is the only trail.)
- ❌ Hiding a reviewed-out element with `display: none`. (Content vs CSS hard rule still applies.)
- ❌ Editing a shared partial, component, or token without checking who else depends on it.
- ❌ Skipping `npx chisel-verify` because the fixes were small.
- ❌ Reporting a clean `chisel-verify` as proof a content fix landed. (It can't read the database — open the page.)
- ❌ Closing a batch of visual fixes without ever looking at the rendered page.
- ❌ Running `npm run build-scripts` yourself instead of asking the user.
- ❌ Fixing the escalated items anyway, at the end, quietly.
- ❌ A batch that leaves no line in `FIXES.md`.

## Related

- Escalating an item into a planned change → [chisel-change-new](.claude/skills/chisel-change-new/SKILL.md)
- Building an approved plan → [chisel-change-implement](.claude/skills/chisel-change-implement/SKILL.md)
- What each automated check means → [chisel-verify](.claude/skills/chisel-verify/SKILL.md)
- Opening the rendered page → [browser-verification.md](.claude/chisel/reference/browser-verification.md)
