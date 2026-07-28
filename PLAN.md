# Chisel AI Toolkit — build plan

> **Starting a new session?** Read this file top to bottom, then check `## Status` for the next
> unchecked phase. Everything you need to resume is here.

## What this is

An npm package that distributes Chisel's AI artifacts — skills, rules, reference docs — into
consumer projects. Installing it drops slash-command skills into `.claude/skills/`, splices a
managed rules block into `CLAUDE.md`, and writes an `AGENTS.md` pointer for non-Claude agents.

It replaces the current `chisel-scripts check-ai-ruleset-update` / `update-ai-ruleset` flow, which
copies an `ai/` folder into the theme where **Claude Code never discovers it as skills**. That is
the bug this project exists to fix: skills only load from `.claude/skills/`, never from `ai/skills/`.

## Decisions already made

| Decision | Choice | Why |
| --- | --- | --- |
| Distribution | npm package, not a Claude Code plugin | Plugins cannot install `CLAUDE.md`/`AGENTS.md`, and are Claude-only. npm can target any agent. |
| Registry | npmjs.com, **public** | GitHub Packages demands a `read:packages` token on every read even for public packages. Nothing here is secret. |
| Package name | `@xfive/chisel-ai-toolkit` | npm scope is `@xfive` (same as `@xfive/coding-standards`, which the generator already installs). GitHub org is `xfiveco` — they differ. |
| Install target | The theme directory, always | It's where npm already runs, so `npx chisel-verify` resolves the local bin; it's where the theme's own `CLAUDE.md` already lives; and one rule beats two layouts. Devs open the agent in the theme. |
| Theme paths | `{{THEME_ROOT}}` token, rendered at install | Now always `.`. Kept so skills stay layout-agnostic and 22 references need no rewrite. |
| Source of truth | This repo | The theme's `ai/` folder becomes generated output, not something you hand-edit. |

### Detection

The nearest ancestor of the install directory with `style.css` + `functions.php` + `theme.json`.
No theme found → the installer stops with an error instead of guessing at an ancestor.
`--root` or `CHISEL_AI_TOOLKIT_ROOT` overrides.

**The tradeoff, accepted:** the agent sees only the theme — no `wp-config.php`, no plugins, no
sibling themes. Fine for Chisel work, and WordPress writes go through MCP regardless.

## Status

- [x] **Phase 1 — Scaffolding.** Installer, root detection, manifest, uninstall,
      two emitters (`claude`, `agents`), skill validator, one real skill (`chisel-new-task`).
      (The two-layout detection it shipped with was collapsed to theme-only — see Decisions.)
- [x] **Phase 2 — Migrate real content.** 14 skills + reference/templates copied; all `ai/…`
      cross-links repointed to `.claude/…`; `rules/CLAUDE.md` authored as the managed block
      (hard rules + reference map, skill anchors preserved); `npm run validate` green. The
      reference theme is left untouched — it was the content source, not a target.
- [x] **Phase 3 — Checks, not skills.** Cross-link check in the validator (`prepublishOnly`),
      `verify.js` as a read-only `chisel-verify` bin, wired into `chisel-new-task` at
      phase-complete, thin skill over it, `chisel-review` dropped into the script, `paths:` on
      `chisel-theme-json` only, model/effort left alone. `chisel-resume` also landed.
- [x] **Phase 6 — The `core/` guard hook.** Built early, out of order: a `PreToolUse` hook that
      refuses writes into `core/`, plus the settings-merge machinery it needed. The lint hook was
      left out on purpose; MCP was split off into Phase 7.
- [ ] **Phase 4 — Publish.**
- [ ] **Phase 5 — More agents.** (optional)
- [ ] **Phase 7 — MCP config.** (optional)

**No cutover phase.** `xfive-co-chisel` is legacy and stays on the old `chisel-scripts` ai-ruleset
flow. Which theme becomes the first real consumer install is still open — until one is picked, the
only proof the package works end-to-end is Phase 4's scratch-theme test.

---

## Phase 2 — Migrate real content

Source: `H:\localhost\test\xfive-co\wp\wp-content\themes\xfive-co-chisel\`

1. Copy `ai/skills/chisel-*/SKILL.md` (14 skills) → `skills/`.
2. Copy `ai/rules/reference/*` (15 docs) → `rules/reference/`, `ai/rules/templates/*` → `rules/templates/`.
3. **Rewrite every path.** Sources use theme-relative paths like `ai/rules/reference/blocks.md`.
   They must become `{{THEME_ROOT}}/...` for theme files, or `.claude/chisel/reference/...` for
   docs that now ship with the toolkit. This is the bulk of the work and the easiest thing to get
   subtly wrong — grep for `ai/rules/`, `ai/skills/`, `src/`, `custom/`, `core/`, `views/` afterwards.
4. Author `rules/CLAUDE.md` — the managed block. At install there is only ONE CLAUDE.md: the
   consumer project's own, at the project root (where `.claude/` loads). The toolkit's
   `rules/CLAUDE.md` is the *source* of the block spliced into it, not a second file.
   - Distill the generic Chisel rules from the theme's current CLAUDE.md (architecture core/custom,
     hard rules, SCSS, scaffolding, progress tracking, loading order) into the block. It's all
     Chisel — the theme *is* Chisel, so there's no generic-vs-project split to make.
   - Keep it lean: it loads every turn. Task-specific detail lives in skills/reference (already
     migrated in steps 1–3); the block keeps only always-relevant hard rules + a reference map.
     Drop the redundant skills catalog — skills self-advertise via auto-discovery.
   - Preserve the heading anchors the skills link to: `#architecture-core-vs-custom`,
     `#content-vs-css-hard-rule`, `#block-type-preference-…`.
   - Anything genuinely project-local (a table prefix, a deviation) lives in the consumer's own
     CLAUDE.md *outside* the block — the same one file; the installer never touches outside the markers.
5. Fix the false claim in the old CLAUDE.md that `ai/skills/` is auto-discovered.
6. `npm run validate` must pass.

### FINDINGS.md format (implemented in `chisel-plan`)

A single global `ai-progress/FINDINGS.md` holds every finding, each line recording the task that
surfaced it. Findings are usually unrelated to the task in hand, so they must outlive it.

Format is a checkbox list — findings contain paths and code, which break table cells.

```text
- [ ] 2026-07-21 · bug · Mobile nav traps focus when submenu open · views/components/nav.twig · from 03-hero
- [x] 2026-07-20 · cleanup · Unused _legacy-buttons.scss · src/styles/components/ · from 04-cta → fixed in 06-buttons
- [-] 2026-07-19 · perf · Slider re-inits on resize · src/scripts/slider.js · from 02-tokens → won't fix, upstream Swiper
```

`[ ]` open · `[x]` resolved · `[-]` won't fix. Fields: date · type · what · where · origin task
· outcome.

Rules for the agent:

- **Append-only.** The only permitted edit to an existing line is flipping the box and appending
  an outcome. Never rewrite the original observation.
- A finding that turns into real work is promoted to a task; the line points at it.
- Still one line, still no derailing the current phase to chase it.

## Phase 3 — New skills

Reshaped: the two proposed check-skills collapsed into one script. A model can skip a checklist;
a script that exits non-zero can't — and the checks were all deterministic anyway.

- [x] **Cross-link check** in `scripts/validate-skills.js`. Every `.claude/chisel/…` and
      `.claude/skills/…` link in `skills/` + `rules/` must resolve to a file the package ships.
      Fenced blocks are skipped (they hold generated-file examples). Wired to `prepublishOnly`,
      so a dangling link can't reach npm. Phase 4 should call it from CI too.
- [x] **`verify.js`** — `npx chisel-verify`, exposed as a second `bin`. Read-only. Six checks:
      token args resolve in `theme.json`, `get-*` helpers are defined, pattern preset classes
      exist, pattern four-way sync, SCSS conventions (`@use '~design'` where helpers are used,
      no raw `var(--wp--*)`, unitless `px-rem`), and no modified files under `core/`.
      Run against the reference theme it found 4 real issues, 0 false positives.
- [x] **Wired into the flow** — `chisel-new-task` runs it at phase-complete; the four-line
      checklist in `rules/CLAUDE.md` shrank to a one-line pointer (it loaded every turn for
      something that only matters at the end of a task).
- [x] **`chisel-verify` skill** — thin wrapper: runs the command, explains each failure class,
      reports before fixing. Not forked; output is small and fixes usually follow.
- [x] **~~`chisel-review`~~ dropped.** Its mechanical rules (`core/` edits, raw `var(--wp--*)`,
      `px-rem` misuse, missing `@use '~design'`) are in `verify.js`. What was left —
      "duplicated global styles" — is one judgement call, not a skill. Revisit only if it
      keeps biting.
- [x] **`paths:` on `chisel-theme-json` only.** Verified against current docs: the field exists,
      and it limits auto-loading to sessions touching a matching file. That makes it wrong for
      the `create-*` skills — they run *before* their target file exists, so `paths:` would
      silence them in exactly the case they're for.
- [x] **`model` / `effort` — left alone deliberately.** Pinning `chisel-quick-fix` to a cheap
      model is the risky one: its first job is triage (quick fix, or escalate to a real task?),
      and getting that wrong quietly turns new scope into an unplanned patch. `effort: low` is
      the safer lever if cost becomes a problem.

Not done, deliberately: the reference theme's own verify failures (4 SCSS/pattern issues, plus
whatever the `core/` check reports for its working tree at the time). Different repo, and a legacy
one — left alone.

## Phase 4 — Publish

**Goal:** put `@xfive/chisel-ai-toolkit` on the public npm registry so any Chisel project can
`npm i -D` it and have the installer run itself. The mechanism: the package's `postinstall`
(`package.json`) runs `install.js` on every consumer `npm install` — it finds the theme
(`lib/roots.js`), runs the emitters (`lib/emit.js`), and writes the manifest
`.claude/.chisel-ai-toolkit.json`. It never fails
the install (warns and exits 0) — including when the package is installed outside a theme.

### The seven steps

| # | Step | Who |
| --- | --- | --- |
| 1 | Add a `LICENSE` file | agent |
| 2 | Set `version` to `0.1.0` | agent |
| 3 | Check the tarball with `npm pack --dry-run` | agent |
| 4 | `npm login` | **you** |
| 5 | `npm org ls xfive` — confirm publish rights on the scope | **you** |
| 6 | `npm publish` | **you** |
| 7 | Install from the registry into a scratch theme, then uninstall | agent |

Steps 1–3 need no account and can run before anything else. Step 7 can only run once 6 succeeds.

### What you have to do by hand

Steps 4–6 need your npm account, so they can't be automated from here.

**4. Log in.** Run `npm login`. It opens a browser; sign in as the npm user that belongs to the
`xfive` organisation. Confirm it worked with `npm whoami` — it currently returns a 401.

**5. Check the scope.** Run `npm org ls xfive`. The scope definitely exists (`@xfive/coding-standards`
is published under it — the generator installs it during scaffold), so the question is only whether
your account can publish to it. If the command errors or your username isn't listed as `developer`
or `owner`, ask whoever owns the org to add you. Nothing else in the plan works until this does.

**6. Publish.** Run `npm publish` from the repo root. `publishConfig.access` is already `public`, and
`prepublishOnly` runs the skill validator first, so a broken cross-link stops the release.

Three things to know before you press it:

- **It's permanent.** The name `@xfive/chisel-ai-toolkit` is taken forever once published, and a
  version number can never be reused — not even after unpublishing. Unpublishing is only allowed
  within 72 hours and only if nothing depends on it.
- **It goes out to everyone immediately.** There's no staging step. If you want a trial run first,
  publish as `npm publish --tag next`, which uploads it without moving the `latest` tag — anyone
  running `npm i -D @xfive/chisel-ai-toolkit` still gets nothing until you promote it.
- **Don't test it in the real theme.** Installing the package runs `postinstall`, which writes
  `.claude/` and splices a block into `CLAUDE.md` in whatever theme it lands in. Step 7 uses a
  throwaway directory for exactly this reason.

### Separately: the GitHub remote

`repository.url` points at `github.com/xfiveco/chisel-ai-toolkit`, and no remote is configured
locally. Create that repo on GitHub (org is `xfiveco`, note it differs from the npm scope `@xfive`)
and push `main`. npm doesn't require it — the publish works without it — but the repo link on the
npm page will 404 until it exists.

### Step 7 in full

In a scratch directory, create an empty `style.css`, `functions.php` and a minimal `theme.json` —
the installer refuses anything that isn't a theme. Then `npm init -y` and
`npm i -D @xfive/chisel-ai-toolkit`, and confirm `.claude/skills/`, `.claude/chisel/`,
`.claude/settings.json` and the `CLAUDE.md` block all appear with no auth prompt. Zero-credential
install is the whole reason for public npm over GitHub Packages — see Decisions.

Then run `node node_modules/@xfive/chisel-ai-toolkit/uninstall.js` and confirm it leaves nothing
behind. The removal path has never been exercised against a published tarball, only against this
working copy.

**Done when:** `npm i -D` in a fresh theme installs everything with zero config and zero credentials,
and uninstall reverses it cleanly.

## Phase 5 — More agents (optional)

**Goal:** emit the same single source (`skills/`, `rules/`) for editors beyond Claude Code. An
*emitter* is a function that renders that shared source into one agent's expected on-disk layout.

**Blocker to solve first: skills hardcode `.claude/…` paths in their prose.** Every cross-link
(`.claude/chisel/reference/blocks.md`, `.claude/skills/chisel-plan/SKILL.md`) is Claude's installed
layout baked into supposedly agent-neutral source. A `cursor` emitter would copy those paths
verbatim into `.cursor/` and every one would be wrong. Needs a rendered token the way
`{{THEME_ROOT}}` handles theme paths — e.g. `{{REFERENCE_DIR}}` / `{{SKILLS_DIR}}` per emitter.
The link check in `scripts/validate-skills.js` resolves those paths from one array
(`INSTALLED_PREFIXES`) — update it to validate the token form when the token lands.

Add an emitter in `lib/emit.js` and register it in `EMITTERS` (today `{ claude, agents }`). Each is
`fn({ packageDir, projectRoot, vars, record })`; reuse the existing helpers — `copyTree` (renders
`{{TOKEN}}`s + copies a tree), `writeManaged` (BEGIN/END splice into a memory file), `render`. Note
`copyTree` only substitutes tokens — it can't rewrite frontmatter, and Cursor's `.mdc` needs
different keys than `SKILL.md`, so that emitter needs a per-file transform rather than a plain copy.
**Call
`record(absPath)` for every file written** — that's what lists it in the manifest so `uninstall.js`
removes it. Add the name to `DEFAULT_AGENTS` in `install.js` only if it
should run by default; otherwise it stays opt-in via `--agent=cursor`.

- `cursor` → `.cursor/rules/*.mdc` (frontmatter: `description`, `globs`, `alwaysApply`) plus
  `.cursor/commands/*.md` for slash commands. Map each skill to a command file, the managed rules to
  an always-apply rule.
- `codex` → **research first.** Codex reads `AGENTS.md` (already covered by the `agents` emitter),
  but its prompt/skill support may be user-level `~/.codex/prompts/` only — which a project-scoped
  installer can't write cleanly. Confirm current behaviour before building anything.

**Done when:** `node install.js --agent=cursor` produces working Cursor rules/commands, all recorded
in the manifest and removed cleanly by `uninstall.js`.

## Phase 6 — The `core/` guard hook

**Why it existed:** "never edit `core/`" was guarded three weak ways — a CLAUDE.md rule the model can
skip, `chisel-verify` which only reports afterwards, and a git pre-commit hook that fires long after
the edit. None stop it happening.

- [x] **`hooks/guard-core.js`** — a `PreToolUse` hook on `Edit|Write|MultiEdit|NotebookEdit`. Reads
      the tool payload on stdin, resolves `tool_input.file_path` against `CLAUDE_PROJECT_DIR`, and
      exits 2 (blocking, stderr shown to the model) if it lands inside `<theme>/core/`. Only the
      top-level `core/` — `src/scripts/core/` is untouched. Case-insensitive on Windows. Anything
      unexpected — malformed payload, no file path — exits 0: a guard that misfires on its own bugs
      is worse than no guard.
- [x] **`lib/settings.js`** — the merge strategy the old plan said to solve first. `.claude/settings.json`
      is shared, and JSON has no comments to splice against, so instead of tracking the file the
      installer rewrites **only its own entry** on every run. Ours is identified by the script path in
      its `args`, so there's no marker field for Claude Code to have to tolerate. Removal is at the
      hook level, not the group level, in case someone adds a command alongside ours.
- [x] **Uninstall** strips the entry and deletes the file only if nothing else is left in it —
      alongside the existing `CLAUDE.md`/`AGENTS.md` special case, not through the normal delete path.
- [x] **Invalid JSON is not guessed at.** If `settings.json` won't parse, install skips the hook and
      warns; uninstall leaves the file alone and says to remove the entry by hand.
- [x] **Not silent.** Reformatting is accepted (the file is rewritten with 2-space JSON), and a
      hand-tuned hook is reset on the next run — it's the toolkit's entry, the rest of the file is
      yours.

**Deliberately not built: the PostToolUse lint hook.** phpcs needs `vendor/` present and stylelint
costs seconds of startup, and it would fire on *every* edit. Wrong trade for a linter that already
runs in `npm run build`. Revisit only if formatting problems actually reach review.

## Phase 7 — MCP config (optional)

**Goal:** register the `xfive-mcp` server with Claude so a consumer install doesn't hand-write
`.mcp.json`. Same merge approach as the guard hook — own one named entry, leave the rest.

**Not in scope: installing the WordPress plugin.** `chisel-scripts`' `check-mcp-update` / `update-mcp`
download `xfiveco/xfive-mcp` from GitHub and install it through WP-CLI. That needs a database and a
running site, which an npm `postinstall` can't assume. Those commands stay where they are; this phase
only writes the client-side config that points at the server.

**Opt-in, not default** — it wires up something external that may not be installed. Add it as an
emitter and leave it out of `DEFAULT_AGENTS`, so it's `--agent=mcp` rather than a new flag, and gets
manifest tracking and clean removal for free. `postinstall` takes no arguments, so enabling it means
running the installer by hand once.

**Done when:** `node install.js --agent=mcp` registers the server, and uninstall removes it without
touching anything else in the file.

---

## Repo map

```text
install.js                  CLI + postinstall entry; arg parsing, emitter dispatch, manifest write
uninstall.js                manifest-driven removal; strips managed blocks, prunes empty dirs
verify.js                   `chisel-verify` bin — read-only mechanical checks over the theme
lib/roots.js                theme detection (marker files, overrides) — install target is the theme
lib/manifest.js             .claude/.chisel-ai-toolkit.json read/write; records a hash per file
lib/emit.js                 per-agent emitters, {{TOKEN}} rendering, BEGIN/END splicing
lib/settings.js             .claude/settings.json — adds/removes only the toolkit's own hook entry
hooks/guard-core.js         → .claude/chisel/hooks/ — PreToolUse guard, blocks writes to core/
skills/<name>/SKILL.md      bundled skills → .claude/skills/<name>/
rules/CLAUDE.md             managed block spliced into the project's CLAUDE.md
rules/AGENTS.md             managed block spliced into the project's AGENTS.md
rules/reference/            → .claude/chisel/reference/   (Phase 2)
rules/templates/            → .claude/chisel/templates/   (Phase 2)
scripts/validate-skills.js  frontmatter + template-token check + cross-link resolution
```

## Commands

```bash
npm run validate                      # skill frontmatter, tokens, cross-links
npx chisel-verify                     # read-only mechanical checks over the theme
npx chisel-verify --theme <path>      # when the theme isn't auto-detected
node install.js --dry-run             # show the detected theme, write nothing
node install.js --agent=claude        # emit for one agent only
node install.js --root <path>         # override theme detection
node uninstall.js --root <path>       # remove everything in the manifest
```

## Conventions

- Skills are authored once with `{{THEME_ROOT}}`; never hardcode a theme path.
- A skill's frontmatter `name` must equal its directory name (the validator enforces this).
- Leave skills model-invocable by default — gate them with a precise `description` (what it's for
  *and* what it isn't), not with `disable-model-invocation`. Use `user-invocable: false` for
  skills meant to run inside a workflow rather than be typed.
- Only `.md .mdc .json .txt .yml .yaml` get token substitution; anything else is copied verbatim.
- Managed files are wholly owned by the installer between the BEGIN/END markers — user content
  lives outside them.
- **Installed files are disposable.** `.claude/skills/` and `.claude/chisel/` are deleted and
  rewritten on every run, and `postinstall` fires on any unrelated `npm install` — so a local edit
  vanishes silently. Fix things in this repo, not in the installed copy.
- `postinstall` never fails the install; it warns and exits 0.

**Deferred to a later version:** drift detection. The manifest still records a hash per file, so
warning about (or backing up) a locally edited managed file is a small addition whenever it's wanted.
It was dropped from v1 because the right answer to "I edited a skill" is always "change the source",
and it would have needed a second rule for files the toolkit only partly owns.
