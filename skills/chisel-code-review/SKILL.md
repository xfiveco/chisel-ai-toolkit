---
name: chisel-code-review
description: Review the code a phase or a fix batch changed, the way a developer reviews a commit before it goes in. A separate agent reads the diff and checks whether it works, whether it is safe, whether it fits this codebase and stays simple, and which other pages it touches; the findings go into a CR file for the phase, and the developer decides which ones get fixed. Asks the developer before starting. Use after npx chisel-verify passes and before a commit is offered, or when the user asks for a code review. Do NOT use for the mechanical checks (that's /chisel-verify), for checking the rendered page, or for reviewing a remote PR.
argument-hint: "[files or a commit range, or nothing for the uncommitted changes]"
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

# Code review

Theme root: `{{THEME_ROOT}}`. All paths below are relative to it.

A developer reading the commit before it goes in. It reads the changed files, checks them against
one short list, and writes what it found to a CR file, so the findings can be worked through and
discussed without getting lost in the chat. `chisel-verify` has already settled the mechanical
checks and the browser pass looks at the page; this is the reading in between. It also names the
other places the change shows up, so the browser pass knows which extra pages to open.

## 1. Ask first

Ask with `AskUserQuestion` before reading anything: **Run it** · **Skip this time** · **Always run
for this change**.

Don't ask when:

- the user typed `/chisel-code-review`. That is the approval.
- `PLAN.md` has a `**Code review:** always` line. Choosing **Always run for this change** writes
  that line, under the `**Status:**` line next to `**Ticket:**`, so no later phase asks again.

**Skipped** → the summary says `Code review: skipped`, and the browser pass has no list of other
pages to open. A skipped review never reads as a clean one.

## 2. Collect the diff

Review what this work changed, nothing else.

| Called from | What gets reviewed |
| --- | --- |
| `/chisel-change-implement` | the phase's touched-file set |
| `/chisel-quick-fix` | the batch's files |
| By hand, with an argument | those files, or that commit range (`HEAD~2..HEAD`) |
| By hand, no argument | everything uncommitted: `git diff HEAD` plus the untracked files in `git status --porcelain` |

Leave out `context/` (plans, not code), the auto-generated `_index.scss` barrels, and compiled build
output.

Nothing left → say "nothing to review" and stop. That is not a pass.

## 3. Hand it to a reviewer that didn't write it

Spawn **one** subagent with `Task`. Reviewing in this session means the code gets checked by the
same reasoning that wrote it. Give it:

- the file list and the git command that shows the diff
- the goal in one line: the phase's `Goal`, or the list of fixes
- this instruction: read `CLAUDE.md` and sections 4 and 5 of
  `.claude/skills/chisel-code-review/SKILL.md`, review **read-only**, confirm every finding in the
  code before reporting it, and answer with every finding as a table row plus its block, and
  **Also shows**, in the section 5 format

The reviewer reports. It never edits, and it doesn't write the CR file; this session does.

## 4. The checklist

In this order. A finding has to break one of these, not a preference.

**1. Does it work**

- Logic: a wrong condition, or a field name, slug or class spelled differently between PHP, Twig,
  ACF JSON, SCSS and JS.
- Real content, not the design's perfect case: an empty field, a missing image, no posts, one item
  vs twelve, a very long title. An empty wrapper or a broken `<img>` is a finding.
- JS that throws on a page without its block (no early return when the root is missing), or breaks
  with two instances on one page.
- Code that fatals when ACF, WooCommerce or WPML is switched off.

**2. Is it safe**

- Output escaped: PHP through `esc_html()`, `esc_attr()`, `esc_url()` or `wp_kses_post()`; Twig
  `|raw` only on HTML the theme built itself.
- Input from `$_GET`, `$_POST`, request params or fields sanitized and validated before use.
- Forms, AJAX and REST endpoints check a nonce, and `current_user_can()` wherever they write or
  reveal data. Every REST route has a `permission_callback`; `__return_true` only for public reads.
- `$wpdb` queries go through `$wpdb->prepare()`.
- No API keys, passwords or tokens in the code.

**3. Does it fit the codebase**

- Reuse: something in `views/components/`, `src/blocks/`, `src/blocks-acf/`, `patterns/` or
  `core/Helpers/` already does this. A near-copy is a finding.
- The project rules in `CLAUDE.md`: hooks in a `HooksSingleton` class, never in
  `custom/functions.php`; `WP/` vs `Plugins/`; content in blocks; no hardcoded editable text in
  Twig; content removed, not hidden with CSS; spacers between sibling blocks; no restated global
  styles; repeated values as tokens; asset URLs through `background-image()`.
- Done the way the theme already does it: naming, BEM prefixes, file layout, translatable strings
  (PHP `__()`, front-end JS through the `chisel_frontend_strings` filter).

**4. Is it simple**

- Nothing the goal didn't ask for: no extra options, settings, layers or files.
- A native React block without the asked-first justification.
- Leftovers: `dump()`, `var_dump()`, `error_log()`, `console.log()`, commented-out code, TODOs,
  placeholder text, unused files or functions.

**5. What else it touches**

For each shared thing the diff changed (a `theme.json` value, a base style or mixin, a block style,
a component or partial, shared JS, the header or footer), grep for where else it's used and list
those places. Also flag:

- **A changed pattern file.** Pages it was already inserted into keep the old markup; only new
  inserts get the change.
- **A renamed ACF field.** Values saved under the old name stop showing.
- **Changed attributes or saved markup on a native block.** Existing content shows a block
  validation error in the editor.

**Not findings:** formatting the linters catch, anything `chisel-verify` checks, and taste with no
rule behind it.

**Already there before this change:** report what you notice while reading, but don't go looking.
The review is of the diff. Section 6 sends these to `context/FINDINGS.md`.

## 5. The CR file

Each phase gets one CR file, and every review of that phase writes into it. That file is where the
findings live; the chat only points at it.

| Reviewed for | File |
| --- | --- |
| A phase | `context/changes/{NN}-{slug}/cr-{NN}-{phase-slug}.md`, next to its phase file: the phase file's name with `phase-` swapped for `cr-` |
| A single-phase change | `context/changes/{NN}-{slug}/cr.md` |
| A quick fix, or a by-hand review outside a change | `context/reviews/{YYYY-MM-DD}-{slug}.md` |

A short table to track status, then one block per finding to read and discuss:

```markdown
# Code review · Phase 03 · hero section

**Reviewed:** 2026-10-20 · **Files:** 6

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| 1 | must fix | Empty photo prints a broken image | fixed |
| 2 | must fix | Member link printed unescaped | open |
| 3 | should fix | Debug `error_log()` left in | skipped |
| 4 | should fix | Footer link printed with `\|raw` | skipped |
| 5 | nit | Modifier class doesn't follow the BEM naming | open |

## Findings

### 1 · must fix · Empty photo prints a broken image

- **Where:** `src/blocks-acf/team/team.twig:14`
- **Problem:** an empty photo field still prints `<img src="">`, which shows as a broken image.
- **Fix:** wrap the image in `{% if member.photo %}`.

### 2 · must fix · Member link printed unescaped

- **Where:** `src/blocks-acf/team/team.twig:31`
- **Problem:** the link is printed with `|raw`, so a pasted `javascript:` URL runs on click.
- **Fix:** print it with `|e('esc_url')`.

### 3 · should fix · Debug `error_log()` left in

- **Where:** `custom/app/WP/Assets.php:42`
- **Problem:** writes to the server log on every page load.
- **Fix:** remove it.

**Why skipped:** the user wants it kept until the API is stable.

### 4 · should fix · Footer link printed with `|raw`

- **Where:** `views/components/footer.twig:22`
- **Problem:** same escaping gap as 2, in code this phase didn't touch.
- **Fix:** print it with `|e('esc_url')`.

**Why skipped:** sent to FINDINGS.md.

### 5 · nit · Modifier class doesn't follow the BEM naming

- **Where:** `src/styles/blocks/_team.scss:20`
- **Problem:** `.b-team--Large` breaks the lowercase modifier naming used everywhere else.
- **Fix:** rename it `.b-team--large`.

## Also shows

- button mixin (`src/design/tools/_buttons.scss`): header CTA, footer form, post cards
- pattern `p-hero` changed: the home page already has it and keeps the old markup
```

- **Order:** `must fix` first, then `should fix`, then `nit`; by number inside each. The blocks
  below the table follow the same order and numbers.
- **Numbers never change.** "Finding 3" means the same thing all through the discussion.
- **Severity:** `must fix` breaks something, is unsafe, or breaks a `(HARD RULE)`. `should fix` is
  anything else on the checklist. `nit` is small and changes nothing for users or editors.
- **Status:** `open` (not done yet), `fixed` or `skipped`. The table is the only place the status
  is kept; a block never repeats it. The reason for a skip is written under that finding's block,
  as `**Why skipped:**`.
- A `|` inside a table cell is written `\|`, or the table breaks.

## 6. Stop, then fix what the developer approves

The developer decides what gets fixed. Not you, and not the reviewer.

1. **Write the CR file**: every finding `open`, with its block below.
2. **Already there before this change** → add one line to `context/FINDINGS.md`, set `skipped`,
   and write `**Why skipped:** sent to FINDINGS.md` under its block.
3. **Conflicts with a recorded decision** in `PLAN.md`'s `## Decisions` → leave it `open`, and name
   the decision under its block so the developer sees the conflict.
4. **Stop.** Give the summary line and the path to the file. Fix nothing yet.
5. **The developer goes through the findings** and decides, one by one or in bulk ("fix 1, 2 and
   5", "fix every must fix"): fix it, skip it (their reason goes under the block), or leave it open.
6. **Fix exactly what was approved**, nothing else, and set each one `fixed`. When a fix ends up
   different from the block's suggestion, write what was done under the block. Unsure how to fix
   it → ask.
7. Re-run `npx chisel-verify` after fixing. A fix can break a mechanical check.
8. Hand **Also shows** to the browser pass. Those are the extra pages it opens.
   → [browser-verification.md](.claude/chisel/reference/browser-verification.md#other-pages-the-change-shows-up-on)

**An open `must fix` blocks the commit.** The developer has each one fixed or skips it before the
commit is offered. Open `should fix` and `nit` findings can stay; the summary counts them.

**Going through it later**, with the user or in a new session: change the status in the table, and
write the reasons and anything agreed under the finding's block.

**A second review in the same phase** writes into the same file. Its findings join the same table
in severity order, numbering carries on from the last finding, their blocks go in at the matching
place, and its date is added to the `**Reviewed:**` line. Never delete or renumber a finding.

One line in the summary:

```text
Code review: must fix 2 (1 fixed, 1 open) · should fix 2 (2 skipped) · nit 1 (open) → context/changes/03-about-page/cr-03-hero.md
```

## What this does not cover

- **Mechanical checks.** `chisel-verify` runs first; the review starts from a clean run.
- **The rendered page**, seeded content in the database, and whether it matches the design. That's
  the browser pass and the user's eyes.
- **Sign-off.** A clean review ticks no `Done when · Manual` item.

## Anti-patterns

- ❌ Starting without asking, when it wasn't typed by hand and there's no `**Code review:** always` line.
- ❌ Leaving a skipped review out of the summary, or calling it clean.
- ❌ Reviewing in this session instead of handing it to a separate agent.
- ❌ A reviewer that edits files. It reports; this session fixes.
- ❌ Reviewing the whole theme instead of the diff.
- ❌ A finding with no file, no consequence, or no fix.
- ❌ Re-reporting what `chisel-verify` or the linters already catch.
- ❌ Fixing problems that were already there under this change. (Skip them: sent to `FINDINGS.md`.)
- ❌ Findings that live only in the chat. (They go in the CR file.)
- ❌ A status written anywhere but the table.
- ❌ Fixing a finding the developer hasn't approved, however obvious it looks.
- ❌ Marking a finding `skipped` on your own, except a problem that was already there.
- ❌ Deleting or renumbering a finding.
- ❌ Offering the commit with a `must fix` still open.

## Related

- The mechanical checks that run first → [chisel-verify](.claude/skills/chisel-verify/SKILL.md)
- Opening the pages the review lists → [browser-verification.md](.claude/chisel/reference/browser-verification.md)
- Where it sits in a phase → [chisel-change-implement](.claude/skills/chisel-change-implement/SKILL.md)
- Where it sits in a fix batch → [chisel-quick-fix](.claude/skills/chisel-quick-fix/SKILL.md)
- The rules it checks against → [CLAUDE.md](CLAUDE.md)
- Conventions in full → [coding-conventions.md](.claude/chisel/reference/coding-conventions.md)
