# @xfive/chisel-ai-toolkit

Skills, rules and reference docs for AI coding agents working on [Chisel](https://getchisel.co)
WordPress themes. Installing the package drops everything into the right place for Claude Code and
writes an `AGENTS.md` pointer for other agents.

> Building this? See [PLAN.md](PLAN.md).

## Install

```bash
npm i -D @xfive/chisel-ai-toolkit
```

A `postinstall` step runs the installer. Re-run it any time with `npx chisel-ai-toolkit`.

## What gets installed

| Bundled | Installed to |
| --- | --- |
| `skills/<name>/` | `.claude/skills/<name>/` — invokable as `/<name>` |
| `rules/reference/` | `.claude/chisel/reference/` |
| `rules/templates/` | `.claude/chisel/templates/` |
| `rules/CLAUDE.md` | spliced into the project's `CLAUDE.md` between managed markers |
| `rules/AGENTS.md` | spliced into the project's `AGENTS.md` |
| `hooks/` | `.claude/chisel/hooks/` + one entry in `.claude/settings.json` |
| (manifest) | `.claude/.chisel-ai-toolkit.json` |

## The `core/` guard

`core/` is upstream Chisel — anything you change there is overwritten by the next Chisel update.
The toolkit installs a `PreToolUse` hook that refuses writes into it, so the agent is stopped at the
moment of the edit rather than told off afterwards. Put the change in `custom/` instead.

The hook is one entry inside `.claude/settings.json`. The installer rewrites only that entry and
leaves the rest of the file alone; uninstall removes it and deletes the file only if nothing else is
in it. If that file isn't valid JSON the installer skips the hook and says so rather than guessing.

Editing the hook by hand doesn't stick — the next install puts it back.

Everything lands in the **theme directory** — the same place npm and the build already run.

## Where it installs

Always the theme: the nearest directory above the install location with `style.css`,
`functions.php` and `theme.json`. Nothing outside it is touched, and if no theme is found the
installer stops rather than guessing.

**Launch your agent from the theme directory.** That's the only place `.claude/` and `CLAUDE.md`
are discovered, and it's what puts `npx chisel-verify` on the path. In a full WordPress project
that means opening the theme folder, not the site root.

Check what was detected with:

```bash
npx chisel-ai-toolkit --dry-run
```

Override it with `--root <path>` or `CHISEL_AI_TOOLKIT_ROOT` if detection guesses wrong.

## Options

```
--agent=claude,agents   emit only for the listed agents (default: both)
--root <path>           override theme detection
--dry-run               report the detected theme, write nothing
```

## Local edits

Don't edit the installed files. `.claude/skills/` and `.claude/chisel/` are deleted and rewritten on
every install — including the `postinstall` that fires on any unrelated `npm install` — so local
changes disappear without warning. Make the change in this repo instead.

`CLAUDE.md` and `AGENTS.md` are the exception: only the text between the managed markers is
replaced, so anything you write outside them is safe.

## Uninstall

```bash
node node_modules/@xfive/chisel-ai-toolkit/uninstall.js
```

Uses the manifest to remove exactly what it installed, strips the managed blocks from `CLAUDE.md`
and `AGENTS.md`, and leaves your own content untouched.

## Adding a skill

Drop a directory under `skills/` containing a `SKILL.md`. The frontmatter `name` must match the
directory name. Use `{{THEME_ROOT}}` for any theme-relative path. Then:

```bash
npm run validate
```
