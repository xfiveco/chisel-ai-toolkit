---
name: chisel-code-review
description: Review the code a phase or a fix batch changed, the way a developer reviews a commit before it goes in. A separate agent reads the diff and checks whether it works, whether it is safe, whether it fits this codebase and stays simple, and which other pages it touches; this session fixes what it finds. Asks the developer before starting. Use after npx chisel-verify passes and before a commit is offered, or when the user asks for a code review. Do NOT use for the mechanical checks (that's /chisel-verify), for checking the rendered page, or for reviewing a remote PR.
argument-hint: "[files or a commit range, or nothing for the uncommitted changes]"
allowed-tools:
  - Read
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
one short list, and reports what has to be fixed. `chisel-verify` has already settled the mechanical
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
  code before reporting it, and answer in the section 5 format

The reviewer reports. It never edits.

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

**Not findings:** formatting the linters catch, anything `chisel-verify` checks, taste with no rule
behind it, and problems in code this change didn't touch (those go to `context/FINDINGS.md`).

## 5. What comes back

```text
Must fix
1. src/blocks-acf/team/team.twig:14 · empty photo field prints a broken <img> · wrap it in {% if member.photo %}

Should fix
1. custom/app/WP/Assets.php:42 · debug error_log() left in · remove it

Also shows
- button mixin (src/design/tools/_buttons.scss): header CTA, footer form, post cards
- pattern p-hero changed: the home page already has it and keeps the old markup

Verdict: fix first
```

- **Must fix:** it breaks something, it's unsafe, or it breaks a `(HARD RULE)`.
- **Should fix:** everything else on the list.
- Each line is `file:line · what's wrong and what happens · the fix`. An empty section says `None`.
- **Verdict:** `ready to commit` or `fix first`.

## 6. Fix, then report

- **Must fix** → fix it. Fix the clear ones directly; ask when the fix could go either way, same as
  `chisel-verify`.
- **Should fix** → fix the obvious ones; list the rest in the summary for the user to decide.
- **Contradicts a recorded decision** in `PLAN.md`'s `## Decisions` → drop it. The decision stands;
  say so in one line.
- After fixing, re-run `npx chisel-verify`. A fix can break a mechanical check.
- Hand **Also shows** to the browser pass. Those are the extra pages it opens.
  → [browser-verification.md](.claude/chisel/reference/browser-verification.md#other-pages-the-change-shows-up-on)

One line in the summary:

```text
Code review: 2 must fix (fixed) · 1 should fix (left for you) · also shows header, footer, post cards
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
- ❌ Fixing old problems in untouched code under this change. (One line in `FINDINGS.md`.)

## Related

- The mechanical checks that run first → [chisel-verify](.claude/skills/chisel-verify/SKILL.md)
- Opening the pages the review lists → [browser-verification.md](.claude/chisel/reference/browser-verification.md)
- Where it sits in a phase → [chisel-change-implement](.claude/skills/chisel-change-implement/SKILL.md)
- Where it sits in a fix batch → [chisel-quick-fix](.claude/skills/chisel-quick-fix/SKILL.md)
- The rules it checks against → [CLAUDE.md](CLAUDE.md)
- Conventions in full → [coding-conventions.md](.claude/chisel/reference/coding-conventions.md)
