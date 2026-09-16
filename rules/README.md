# Chisel AI toolkit

Installed by `{{PACKAGE_NAME}}` {{VERSION}}. This file is rewritten on every install — don't edit
it here; the source is `rules/README.md` in the toolkit repo.

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

**Playwright MCP is optional** — unlike `xfive-mcp-chisel`, which is required. Without it the agent
asks you for a screenshot and reports the render as *not checked* rather than passed. With it, the
agent catches its own drift before handing the work over instead of after. Either way a screenshot
the agent took never ticks a manual item.

The site URL lives on a `**Site URL:**` line in `context/INDEX.md` — asked once, on the first change.
