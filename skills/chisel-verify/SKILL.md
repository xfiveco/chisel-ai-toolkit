---
name: chisel-verify
description: Run the Chisel mechanical checks over the theme — token references, pattern four-way sync, SCSS conventions, untouched core/ — and explain anything that fails. Use before finishing a phase or a task, or when the user asks to verify/check the theme. Do NOT use for judgement-based review or for questions about how the code works.
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

Add `--theme <path>` only if the theme isn't found automatically. It reads files and `git status`
— it changes nothing.

## 2. Read the result

Errors exit non-zero; warnings don't. What each check means:

- **tokens** — a `get-color('x')` / `get-margin('x')` / … argument that has no matching slug in
  `theme.json`. Either the slug is a typo, or the token was never added.
- **helpers** — a `get-*()` that `src/design/tools/` never defines. This fails the SCSS build.
- **presets** — a `has-*-color` / `has-*-font-size` class in pattern markup with no matching
  `theme.json` preset. Renders unstyled.
- **patterns** — four-way sync broken: the `Slug:` header, the filename, the `p-{slug}` root class,
  and the SCSS scope must all carry the same slug.
- **scss** — a helper called without `@use '~design' as *;`, a raw `var(--wp--…)` where a helper
  exists, or `px-rem()` given a value with units (it takes a unitless number).
- **core** — a modified file under `core/`. That's upstream Chisel; the edit is lost on the next
  update and belongs in `custom/`.

## 3. Report, then fix on request

Say what failed and why it matters, grouped by check. Don't fix anything yet — some failures are
the token being missing rather than the reference being wrong, and which one is right is the user's
call. Ask, then fix.

The pattern warning (`no _{slug}.scss`) is normal for a pattern that needs no styling of its own.
Mention it only if the pattern clearly should have styles.

## What this does not cover

`npm run build-scripts` — whether the SCSS actually compiles. Ask the user to run it; never invoke
it yourself. Nor does it cover judgement: duplicated global styles, a component that should have
been reused, a mapping that's technically valid but wrong for the design. Those need reading.

## Related

- Where these checks sit in a phase → [chisel-implement](.claude/skills/chisel-implement/SKILL.md)
- Running them after a fix batch → [chisel-quick-fix](.claude/skills/chisel-quick-fix/SKILL.md)
- The per-screen done gate they feed → [screen-build-order.md](.claude/chisel/reference/screen-build-order.md)
- Why a token reference fails → [design-tokens.md](.claude/chisel/reference/design-tokens.md)
- Why a pattern four-way sync fails → [blocks.md](.claude/chisel/reference/blocks.md)
