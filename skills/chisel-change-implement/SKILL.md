---
name: chisel-change-implement
description: Build an approved Chisel plan one phase at a time, behind three stops per phase — plan gate, verify and summary, then wait. Reads context/changes/{NN}-{slug}/PLAN.md, keeps its status current, and closes out every session so the next one resumes cold. Use when the user says "implement", "build it", "go", "next phase", or names a planned change. Do NOT use to scope or plan new work (that's /chisel-change-new).
argument-hint: "[NN-slug] [phase N]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - AskUserQuestion
---

# Implement a Chisel change

Theme root: `{{THEME_ROOT}}`. All paths below are relative to it.

One phase, three stops. Never two phases in one go unless the user explicitly says so.

## 0. Resolve the change

- **Argument given** (`/chisel-change-implement 03-about-page`, or bare `03`, or a path) → match it
  against `context/changes/`. No match: say so, list what's under `## Active` in
  `context/INDEX.md`, stop.
- **No argument, one change Active** → use it.
- **No argument, several Active** → list them with their one-phrase states and ask which. Don't guess.
- **Nothing Active** → point at `/chisel-change-new` and stop.
- **`PLAN.md` `**Status:**` is `scoping`** → the plan was never approved. Say so and hand back to
  `/chisel-change-new`.

## 1. Load state

Read `PLAN.md` — `**Status:**`, `## Source`, `## Scope`, `## Decisions`, and the phase table.

The `[x]` rows' one-line outcomes are what already happened. **Don't open completed phase files.**
If a row is `[x]` with no outcome, that's a gap: note it, and reconstruct from `## Log` rather than
reopening the phase file.

Then read `CLAUDE.md` — anything marked `(HARD RULE)` applies to every line you write. Load the
reference doc that owns whatever this phase creates *before* the skill that builds it; entry points
are in [CLAUDE.md "Scaffolding"](CLAUDE.md#scaffolding-hard-rule).

Find the current phase: the first row that is `[~]`, or the first `[ ]` after the last `[x]`. If a
`phase N` argument was passed, jump to that row instead.

**Figma-mode change?** If `## Source` says `Mode: Figma`, the section phases are built through
[chisel-figma-to-chisel](.claude/skills/chisel-figma-to-chisel/SKILL.md) — it owns the section loop,
the asset-download hard rule and the mandatory visual diff, none of which are repeated here. The
three stops still apply and are still yours: gate the phase, hand the build to the orchestrator,
come back for verify, summary and close-out.

## 2. The phase loop

### Stop 1 — the gate

1. Flip the phase's row in `PLAN.md` to `[~]` and set `**Status:** building`.
2. Open **only that** `phase-NN-*.md` (single-phase change: `PLAN.md`'s `## Phase` block — there
   is no phase file and no row, so the `**Status:**` line carries the status on its own).
3. **Re-read it against the code as it stands now.** It was written before the earlier phases
   existed. Check `Touches` against what's actually on disk. Where the file and the code disagree,
   **the code wins** — correct the file and say what drifted. Decisions are exempt: they came from
   the user, and only the user changes them.
4. Read the files you're about to change. All of them, fully. Before overriding a shared selector
   or global partial, read it first — diff-only overrides, never a restated block.
5. Fill in **Steps** now — against real code, not the guess from planning time.
6. Present the phase plan: goal, what you'll touch, the steps, what drifted, and the done-when criteria.

**Stop. Write no code.** The user may change the plan — apply changes to the plan, not after the
fact. Build only on explicit go-ahead.

### Build

Build that phase. Nothing from the next one.

Track a **touched-file set** as you go: every path you `Edit` or `Write`. It always includes
`PLAN.md` and the phase file. This set — not `git status` — decides what gets staged later.

Flip a step's `[ ]` → `[x]` in the phase file as you finish it. Don't batch them to the end.

Two rules that bite hardest here, both from `CLAUDE.md`:

- **WordPress state goes through MCP.** Content, images, ACF values, theme mods, options, menus,
  post creation — `xfive-mcp-chisel` tools. Never a PHP seed or a manual paste; WP-CLI only after
  the user declined the plugin and explicitly granted it. Read the
  [block-seeding traps](.claude/chisel/reference/mcp-workflow.md) before hand-writing block markup.
- **Never edit `core/`.** A PreToolUse hook refuses the write. Mirror the file into `custom/app/`.
  The hook only sees file-editing tools — a shell redirect into `core/` walks straight past it, so
  this one is on you when you're in `Bash`.

**If the plan doesn't match reality**, stop and say so plainly:

```text
Issue in Phase {N}:
Expected: {what the plan says}
Found:    {what's actually there}
Why it matters: {consequence}
```

Then ask with `AskUserQuestion`: **adapt and continue** (adjust to reality, explain the adaptation)
· **skip this part** (not needed after all) · **stop and re-plan** (too big to absorb — back to
`/chisel-change-new`).

**Blocked outright?** Flip the phase row to `[!]`, write what's blocked and what unblocks it under
the phase file's `Notes / blockers`, and stop there. Don't half-build around it.

**New work appears mid-flight?** Insert `Phase 2a` between 2 and 3 — a new row plus a new
`phase-02a-{slug}.md` (same zero-padded number as the phase it follows, plus the letter). Never
renumber. A whole new *goal* is not a phase: that's a new change folder via `/chisel-change-new`.

Notice a bug or oddity along the way, even unrelated? One line in `context/FINDINGS.md`, then keep going:

```text
- [ ] 2026-07-21 · bug · Mobile nav traps focus when submenu open · views/components/nav.twig · from 03-hero
```

Don't derail the phase to chase it.

**But first ask which kind it is.** A rough edge in what *this phase just built* is not a finding —
it's unfinished work. Fix it now, or make it a `Phase Na`. `FINDINGS.md` is only for what you
*discovered* while working, not for what you *caused*. Logging your own loose end there ships the
phase with a known defect and buys a line nobody scheduled.

### Stop 2 — verify and summarize

1. Run `npx chisel-verify`. It's the mechanical checklist — token references, undefined helpers,
   preset classes, hand-written markup colors, margin pairs, pattern four-way sync, ACF group keys,
   SCSS conventions, untouched `core/` — and it is not optional. **Fix what's unambiguous; ask when
   the fix could go either way** (a missing token vs. a mistyped reference). A failing check is
   never "probably fine". Two things it won't tell you: exit code `2` means it never ran, and it
   can't read page content you seeded through MCP — that lives in the database. Full detail:
   [chisel-verify](.claude/skills/chisel-verify/SKILL.md).
2. **Ask the user to run `npm run build-scripts`** to confirm the SCSS compiles. Never invoke it
   yourself. Tick that done-when item once they report it passed.
3. **Open the page.** Playwright MCP, at the URL this phase actually touched — console messages
   first, then a screenshot at the spec's viewport and at mobile against the spec crop, then the
   accessibility snapshot. It's the only pass that sees seeded content, dead asset URLs and JS that
   throws. **Optional:** if the tools aren't in your list, say so once, ask the user for a
   screenshot, and report the render as *not checked* — never stop the phase over it. Procedure and
   the site-URL lookup → [browser-verification.md](.claude/chisel/reference/browser-verification.md).
4. Tick the phase file's **Done when · Automated** items that now pass.
5. Summarize: what changed, which files, what drifted from the plan, the render result on its own
   line, and — separately — **what the user needs to check with their own eyes**, taken from
   **Done when · Manual**.

**Do not tick manual items yourself.** They stay `[ ]` until the user confirms. **A screenshot you
took is not a confirmation** — it's what lets you catch drift before the handoff, not a substitute
for the user looking.

**Stop.** Wait for the user to confirm the manual checks.

### Commit

Once the user confirms, offer a commit — don't just make one.

1. Stage the touched-file set, **explicitly by path**. Never `git add -A` or `git add .`.
2. Run `git status --porcelain`. If anything dirty sits *outside* the touched set, name those paths
   and ask: **stage only the planned set** (recommended — leave the rest for the user) · **stage
   all** · **abort**.
3. **Find the ticket.** Look for an issue key — `ABC-123`, `ENG-4501` — in this order: a
   `**Ticket:**` line in `PLAN.md`, the current branch name, the conversation. If none turns up,
   **ask once**: "Is there a ticket for this?" Record the answer (or "none") as a `**Ticket:**`
   line under `PLAN.md`'s `**Status:**` line, so no later phase asks again. Never invent a key from
   the folder name or the branch.
4. **Propose a one-line message.** One line — no body, no bullet list of changes.

   | | Format | Example |
   | --- | --- | --- |
   | With a ticket | `<ticket>: <phase title>` | `ABC-123: hero section` |
   | Without | `<type>(<NN-slug>): <phase title> (p<N>)` | `feat(01-home-import): hero section (p5)` |

   `<type>` is `feat` / `fix` / `chore` / `refactor` / `docs`. Either way the subject is enough to
   find the commit later — which is why the plan file doesn't store a SHA.

   **Never add a trailer.** No `Co-Authored-By:`, no "Generated with Claude Code", no attribution of
   any kind. The message is one line and ends there.
5. Ask: **commit as proposed** · **edit the message** · **skip the commit for now**.
6. Never `--no-verify`, never `--amend`, never `CHISEL_SKIP_CORE_CHECK=1`. If a hook fails, fix the
   cause and make a new commit. The theme's pre-commit hook does two things: it blocks *modified*
   files under `core/` — a newly **added** file there slips through, so don't lean on it — and then
   runs lint-staged, so eslint, stylelint, phpcs or twigcs can fail the commit on their own.
7. Clear the touched-file set.

### Stop 3 — close the phase, then wait

1. Flip the phase row to `[x]` and **write its one-line outcome** — mandatory. "Hero pattern built,
   images seeded, matches Figma at 1440." Not "done".
2. Set the phase file's status and fill in `Artifacts produced` — pattern slugs, block names, CPTs,
   theme.json deltas.
3. Append anything newly decided to `## Decisions`.
4. Add a `## Log` line, biased toward what's next.
5. Refresh the change's line in `context/INDEX.md`.

Then ask whether to continue to the next phase, or stop here. **Wait.** If the user asked up front
for several phases in one run, skip this question — but keep every other stop.

## 3. When the last phase lands

- Set `PLAN.md` `**Status:** done`.
- Move the change's line in `context/INDEX.md` from `## Active` to `## Done` with the date.
  **Leave the folder where it is** — moving it breaks every link pointing into it.
- **Triage the findings from this change** — see below.
- Final summary: what was built, what's deferred (from `## Deferred`), and the findings triage
  result.

### Findings triage

Read every open `[ ]` line in `context/FINDINGS.md` whose `from` is this change. Each one gets
exactly one of three outcomes:

| Outcome | When | What you do |
| --- | --- | --- |
| **Fix now** | This change caused it, or leaving it makes the change incomplete | Fix it *before* `Status: done`, flip the box, append the outcome. It was never a finding. |
| **Leave open** | Real, but a separate piece of work | Nothing. Say the count in the summary. |
| **Won't fix** | Not worth doing | `[-]` plus a one-line reason. |

**Only the first bucket gets fixed here, and only because the change isn't finished without it.**
Everything else stays open on purpose — it was logged precisely because it was out of scope, and
sweeping it up now puts unrelated edits in this change's commits where no one will review them.

Findings from *other* changes are not yours to triage. Leave them alone.

The leftovers get worked when the user asks, through the paths that already exist: small and
mechanical → [`/chisel-quick-fix`](.claude/skills/chisel-quick-fix/SKILL.md) on a batch; big, or
several related ones → its own change via
[`/chisel-change-new`](.claude/skills/chisel-change-new/SKILL.md).

## Close every session

Every time you stop — phase done, user leaves, context running short — do this **before** your
final message, not after. A session that ends without it loses its trail.

- Phase row: status, plus the one-line outcome on `[x]`.
- `PLAN.md` `**Status:**` line — `scoping` → `planned` → `building` → `done`.
- A `## Log` line, even if it's "no progress".
- The `context/INDEX.md` state.
- Anything decided since the last stop, appended to `## Decisions`.

Then print how to pick it up:

```text
→ /chisel-change-resume 03-about-page
```

## Hard rules

1. **Three stops per phase.** Gate before, summary after, wait before the next. Skipping the gate
   is how a plan silently becomes something else.
2. **Code beats files; files beat memory.** A phase file that disagrees with the code is stale —
   correct it and say what drifted. Never build to a stale plan because it's written down. When the
   files disagree with what you recall, the files win.
3. **The phase row is the only status surface.** One row per phase, one `**Status:**` per change.
   No parallel checklists.
4. **Manual checks are the user's.** Never tick them, never assume them, never fold them into
   "verified" — and a screenshot you took yourself doesn't tick one either.
5. **`npx chisel-verify` before every summary.** A non-zero exit is fixed or explicitly justified,
   never ignored.
6. **Never commit without asking.** One line, no trailers, no `Co-Authored-By:`. Prefix with the
   ticket key when there is one.
7. **Stage by path.** The touched-file set decides, not `git status`.
8. **Insert, never renumber.** New work mid-flight becomes `Phase 2a`, filed as `phase-02a-{slug}.md`.
9. **Absolute dates.** `2026-07-21`, never "today".

## Anti-patterns

- ❌ Writing code at the gate. (The gate exists so the user can change the plan first.)
- ❌ A `[x]` row with no outcome. (Forces the next session to reopen the file — defeats the whole layout.)
- ❌ Reopening completed phase files to work out what happened. (That's what the outcome line is for.)
- ❌ Ticking manual items because the automated ones passed.
- ❌ Running `npm run build-scripts` yourself instead of asking the user.
- ❌ Building the next phase because this one went well.
- ❌ Hand-building a Figma section instead of routing the phase through the orchestrator. (You lose
  the asset download and the visual diff, and the section won't match.)
- ❌ Reporting "verify clean" for content seeded into a page. (That lives in the database, not a
  file — the script never sees it. Open the page.)
- ❌ Summarizing a phase without opening the page when the browser tools were available.
- ❌ Stopping a phase because Playwright MCP isn't installed. (It's optional — say "not checked".)
- ❌ Reporting the render as passed when it was never opened.
- ❌ Seeding content with a PHP script or WP-CLI because the MCP call was fiddly. (WP-CLI needs the
  user's explicit no on the plugin, then an explicit yes — a failed call is neither.)
- ❌ Hiding unwanted content with `display: none` instead of removing it at the source.
- ❌ `git add -A`. (Sweeps in whatever else was dirty.)
- ❌ Committing unprompted, or amending to "fix" a message.
- ❌ A `Co-Authored-By:` trailer or a "Generated with…" line. Ever.
- ❌ A multi-line commit body listing the files. (The diff already says that.)
- ❌ Guessing a ticket key from the branch or folder name. Ask, or go without.
- ❌ Fixing an unrelated bug you noticed mid-phase. (One line in `FINDINGS.md`, keep going.)
- ❌ Logging a defect in what you just built as a finding. (You caused it — fix it or phase it.)
- ❌ Clearing the whole `FINDINGS.md` backlog at close-out. (Only what this change caused.)
- ❌ Marking a change `done` without triaging its own findings.
- ❌ Ending a session without the log line and the resume command.
- ❌ Moving a finished change folder into an archive path. (Mark it Done in `INDEX.md`.)

## Related

- Scoping and planning a change → [chisel-change-new](.claude/skills/chisel-change-new/SKILL.md)
- Picking up an active change cold → [chisel-change-resume](.claude/skills/chisel-change-resume/SKILL.md)
- Feedback on built work, no plan needed → [chisel-quick-fix](.claude/skills/chisel-quick-fix/SKILL.md)
- What each automated check means → [chisel-verify](.claude/skills/chisel-verify/SKILL.md)
- Opening the rendered page → [browser-verification.md](.claude/chisel/reference/browser-verification.md)
- Building a Figma-mode phase → [chisel-figma-to-chisel](.claude/skills/chisel-figma-to-chisel/SKILL.md)
- Per-screen build order and the done gate → [screen-build-order.md](.claude/chisel/reference/screen-build-order.md)
- WordPress state writes and seeding traps → [mcp-workflow.md](.claude/chisel/reference/mcp-workflow.md)
