# @xfive/chisel-ai-toolkit

Skills, rules and reference docs for AI coding agents working on [Chisel](https://getchisel.co)
WordPress themes. Installing the package drops everything into the right place for Claude Code and
writes an `AGENTS.md` pointer for other agents.

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
| `rules/README.md` | `.claude/chisel/README.md` — the "Using it" and "Verification" sections below, for whoever opens the theme repo |
| `rules/CLAUDE.md` | spliced into the project's `CLAUDE.md` between managed markers |
| `rules/AGENTS.md` | spliced into the project's `AGENTS.md` |
| `hooks/` | `.claude/chisel/hooks/` + one entry in `.claude/settings.json` |
| (manifest) | `.claude/.chisel-ai-toolkit.json` |

## Using it

Seventeen skills ship. You type five of them; the other twelve are opened automatically by the
skill doing the work.

### Skills you run yourself

| You type | When |
| --- | --- |
| `/chisel-change-new <Figma URL · screenshots · or describe it>` | Starting anything new. Scopes it with you, then plans it in phases. Writes no code. |
| `/chisel-change-implement` | Building a planned change, one phase at a time. |
| `/chisel-change-resume <NN-slug>` | Picking an unfinished change up in a fresh session. |
| `/chisel-quick-fix <feedback>` | Small fixes to work that already exists. No plan, no phases. |
| `/chisel-verify` | Optional. Runs the mechanical checks by hand — implement already runs them for you. |

### Skills picked automatically

Everything else — theme.json setup, base styles, header and footer, patterns, blocks, components,
CPTs, options pages, the Figma import. `/chisel-change-implement` opens whichever one the phase it's
building calls for. Don't invoke them; if you want one of those things built, start with
`/chisel-change-new`.

### How a change flows

```text
/chisel-change-new  ────►  /chisel-change-implement
scope, then plan            builds one phase at a time, three stops per phase:
in phases                   plan review → build + npx chisel-verify → summary, wait for "next"
                                     ▲
                                     │  a fresh session picks the change
                                     │  up cold with /chisel-change-resume
```

The plan lands in `context/changes/{NN}-{slug}/` — a `PLAN.md` plus one file per phase — and gets
committed, so the work survives `/compact`, a closed laptop, or a handoff to someone else. Every
phase stops three times: plan review before building, summary after, then wait for "next". The
mechanical checks run automatically before each summary; `/chisel-verify` is only for running them
by hand.

### What implement picks, and when

If the change was scoped from a Figma file, `/chisel-change-implement` hands each page section to
`/chisel-figma-to-chisel`, which then picks from the same list below.

**Project setup — phases 1–3 of the first change only, in this order:**

```text
tokens from the design spec ............. /chisel-setup-theme-json
buttons, typography, forms, spacing ..... /chisel-adapt-base-styles
header, footer, nav, logo ............... /chisel-adapt-header-footer
```

Order is load-bearing: tokens first so everything downstream references presets, base styles next
so patterns inherit correct defaults instead of overriding them. On the second screen they're
already done and get skipped.

**Then, per section — cheapest option that works, top of the list down:**

```text
a page section from core blocks ......... /chisel-create-pattern      ← default
field-driven repeating content .......... /chisel-create-acf-block    ← default custom block
editor-canvas interactivity ............. /chisel-create-block        ← last resort, asks first
shared UI rendered from PHP ............. /chisel-create-component
many entries of one content shape ....... /chisel-create-cpt
a site-wide editable value .............. /chisel-create-acf-options
a variant of a core block ............... /chisel-extend-core-block
one token added or changed .............. /chisel-theme-json
```

Frontend interactivity — a slider, tabs, an accordion — is not a reason to reach for a React
block. That's an ACF block plus `view.js`.

### The way around the spine

**`/chisel-quick-fix`** — QA notes, review comments, visual nits on work that already exists. No
change folder, no phases, no plan gate: it triages, fixes, reports. Anything that turns out to be
real scope gets handed back to `/chisel-change-new`.

## Verification

No test framework ships and none is added — Chisel has no Jest, PHPUnit or spec files, and the
toolkit doesn't scaffold any. What the theme produces is markup and SCSS driven by a design spec,
and "the hero renders a heading" passes while the section looks wrong. Verification is three layers
instead:

```text
automated ... npx chisel-verify + npm run build-scripts   reads files, never renders
rendered .... Playwright MCP: console, screenshots, a11y  the only pass that sees seeded
                                                          content, dead images, JS that throws
manual ...... the user's eyes                             editor behaviour, copy, sign-off
```

**Playwright MCP is optional** — unlike `xfive-mcp-chisel`, which is the default and falls back to
WP-CLI only with your explicit permission. Without Playwright the agent asks you for a screenshot
and reports the render as *not checked* rather than passed. With it, the agent catches its own drift
before handing the work over instead of after. Either way a screenshot the agent took never ticks a
manual item.

The site URL lives on a `**Site URL:**` line in `context/INDEX.md` — asked once, on the first change.

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
