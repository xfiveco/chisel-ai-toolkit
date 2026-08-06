---
name: chisel-verify
description: Run the Chisel mechanical checks over the theme — token references, undefined helpers, preset classes, pattern four-way sync, SCSS conventions, untouched core/ — and explain anything that fails. Use before finishing a phase or a task, or when the user asks to verify/check the theme. Do NOT use for judgement-based review or for questions about how the code works.
argument-hint: "[path to theme]"
allowed-tools:
  - Bash
  - Read
  - Edit
  - Grep
  - Glob
---

# Verify the theme

Theme root: `{{THEME_ROOT}}`.

The checks are a script, not a checklist you walk by hand. Run it, then explain what it found.

## 1. Run it

```bash
npx chisel-verify
```

It reads files and `git status` — it changes nothing. Add `--theme <path>` only if the theme isn't
found automatically; `--root <path>` and the `CHISEL_AI_TOOLKIT_ROOT` env var do the same job
through the normal detection.

## 2. Read the result

- **`0`** — ran, no errors. Warnings may still print.
- **`1`** — ran, found errors.
- **`2`** — **it never ran**: no `theme.json` at the resolved root, or it isn't valid JSON.

**Exit 2 is not a finding.** Nothing was checked, so there is nothing to fix — re-run from inside
the theme, or pass `--theme <path>`.

What each check means:

- **tokens** — a `get-color('x')` / `get-margin('x')` / … argument that has no matching slug in
  `theme.json`. Either the slug is a typo, or the token was never added.
- **helpers** — a `get-*()` that `src/design/tools/` never defines. This fails the SCSS build.
- **presets** — a `has-*-color`, `has-*-font-size` or `has-*-gradient-background` class with no
  matching `theme.json` preset, in pattern markup **or a Twig template**. Renders unstyled. WP's own
  state flags (`has-text-color`, `has-link-color`, `has-background`, `has-custom-font-size`) carry
  no slug and are skipped — that's why they never fail.
- **markup** — a color written into block markup by hand (`customOverlayColor`, a literal
  `color:#…`) where a preset belongs; or a block carrying only one half of the
  `"disableBottomMargin":true` + `u-no-margin-bottom` pair, which leaves a margin nobody sees until
  the section is stacked.
- **patterns** — four-way sync broken: the `Slug:` header, the filename, the `p-{slug}` root class,
  and the SCSS scope must all carry the same slug.
- **acf** — a field group whose filename isn't its `key`, or a key that isn't `group_` + 13 hex
  characters. ACF rewrites the file on save and the mismatch silently forks the group.
- **scss** — a helper called without `@use '~design' as *;`, a raw `var(--wp--…)` where a helper
  exists, or `src/styles/patterns/` existing while `main.scss` or `editor.scss` never
  `@use 'patterns';` — that last one compiles to nothing with no error anywhere.
- **raw** *(warning)* — a literal hex or `rgba()` in pattern or block SCSS. Warning, not error:
  genuine one-offs exist. A recurring width, color or shadow is a missed token.
- **core** — a modified file under `core/`. That's upstream Chisel; the edit is lost on the next
  update and belongs in `custom/`.

`px-rem(24px)` is a **warning**, not an error — the function strips units itself, so the px form
compiles. It's house style, not a broken call.

## 3. Report, then fix

Say what failed and why it matters, grouped by check.

**Fix what's unambiguous** — a mistyped slug, a missing `@use '~design' as *;`, a pattern root class
that doesn't match its filename. **Ask when the fix could go either way:** a token failure means
either the reference is wrong or the token was never added, and only the user knows which. A failing
check is never "probably fine".

The pattern warning (`no _{slug}.scss`) is normal for a pattern that needs no styling of its own.
Mention it only if the pattern clearly should have styles.

## What this does not cover

**What it reads:** `src/**/*.scss`, `patterns/**/*.php`, `views/**/*.twig` and
`src/blocks*/**/*.twig`, plus `group_*.json` under `acf-json/` and `src/blocks-acf/`. The header of
every run prints the counts — if one says `0`, that's the answer to "was my change checked?".

**What it can't reach:** seeded page content, which lives in the database rather than a file, so a
bad preset class in a page a section was pushed into is invisible to it. Nor `block.json`, nor PHP
outside `patterns/` beyond the `core/` git check. A change confined to those comes back clean
because nothing was read — say so rather than reporting it as a pass.

**Nothing rendered.** It reads files; it never opens a page. Seeded content, an image that 404s, a
`view.js` that throws on load, spacing that drifted from the spec — all clean here, all obvious in
the browser. That's the other half of the gate, not a nice-to-have:
[browser-verification.md](.claude/chisel/reference/browser-verification.md). A clean run of this
script alone is never "verified".

**A missing `theme.json` group silently disables its own check.** The token check only runs where
the group exists and is non-empty, so if `settings.custom.boxShadow` was never added, every
`get-box-shadow('…')` passes. Likewise every helper if `src/design/tools/` is missing. A clean run
is not proof the group exists.

`npm run build-scripts` — whether the SCSS actually compiles. Ask the user to run it; never invoke
it yourself. Nor does it cover judgement: duplicated global styles, a component that should have
been reused, a mapping that's technically valid but wrong for the design. Those need reading.

## Related

- The rendered half of the gate → [browser-verification.md](.claude/chisel/reference/browser-verification.md)
- Where these checks sit in a phase → [chisel-change-implement](.claude/skills/chisel-change-implement/SKILL.md)
- Running them after a fix batch → [chisel-quick-fix](.claude/skills/chisel-quick-fix/SKILL.md)
- The per-screen done gate they feed → [screen-build-order.md](.claude/chisel/reference/screen-build-order.md)
- Why a token reference fails → [design-tokens.md](.claude/chisel/reference/design-tokens.md)
- Why a pattern four-way sync fails → [blocks.md](.claude/chisel/reference/blocks.md)
