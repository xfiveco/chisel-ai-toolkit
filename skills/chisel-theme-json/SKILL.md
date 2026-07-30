---
name: chisel-theme-json
description: Edit an existing theme.json — add or change a color, font family, font size, spacing step, custom property, block style, element style, gradient or duotone. Use when a single token needs adding or adjusting mid-project. Do NOT use to bootstrap a project's tokens from a design spec (that's /chisel-setup-theme-json, run once) or to change SCSS that consumes the tokens.
# Auto-loads only when theme.json is in play. Safe here because the file always
# already exists — do NOT copy this to the create-* skills, which run before
# their target file exists and would be silenced by it.
paths:
  - "**/theme.json"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - AskUserQuestion
  - TodoWrite
---

# Modify theme.json

Theme root: `{{THEME_ROOT}}`. All paths below are relative to it.

`theme.json` at the theme root is the single source of truth for design tokens. Changes here generate CSS custom properties automatically, for both the frontend and the editor.

## Before you start

**Load [reference/design-tokens.md](.claude/chisel/reference/design-tokens.md) first** — what each slug means, the protected set, and the spacer/margin math that has to stay in sync. This skill is the _how_; reference is the _what_. JSON shapes to copy: [templates/theme-json-recipes.md](.claude/chisel/templates/theme-json-recipes.md).

Two things decide whether this is safe:

- **Never rely on a documented token inventory.** Values and scales are rewritten at project setup. Read the actual `theme.json` for current state; only slug *semantics* live in the reference doc.
- **Never rename a protected slug** — the full palette and the spacing/margin/padding/gap aliases, plus the button `is-style-*` names. SCSS and editor JS reference them by name. The canonical list is in [design-tokens.md](.claude/chisel/reference/design-tokens.md).

## Procedure

1. **Read `theme.json`.** Locate the section you're changing and note what's already there — a near-match slug usually means repurposing a value rather than adding a slug.
2. **Make the edit** using the shape from [theme-json-recipes.md](.claude/chisel/templates/theme-json-recipes.md). Preserve key ordering; add slugs rather than renaming them.
3. **Sync the SCSS accessor.** A new `settings.custom.{category}` value needs its matching `get-*()` accessor in `src/design/tools/_theme.scss` in the same change — a token with no accessor is unreachable, and an accessor with no token fails the build. Block margins have a second home in `src/styles/blocks/_core.scss` that must move with `styles.blocks` ([design-tokens.md "Margin sync"](.claude/chisel/reference/design-tokens.md#margin-sync-at-project-start)).
4. **If you renamed anything**, grep and update every reference in the same change:

   ```text
   Grep: get-color\('{old-slug}'\)          in  src/
   Grep: has-{old-slug}(-color|-background-color)?   in  .
   Grep: "{old-slug}"                        in  src/scripts/editor/
   ```

5. **Verify** — see below.

## Traps

- ❌ **Renaming a protected slug.** Silent build break; the editor keeps showing the old preset until someone rebuilds.
- ❌ **Adding a `settings.custom` value with no accessor** in `src/design/tools/_theme.scss`, or an accessor with no token.
- ❌ **Changing `styles.blocks` margins without `src/styles/blocks/_core.scss`.** The two drift and blocks get double or missing margins.
- ❌ **A fluid font-size range wider than 2×** — it shrinks below readability on mobile.
- ❌ **Inventing a shade naming scheme.** Follow the existing primary/secondary pattern (100, 200, 300, 600, 800, 900).
- ❌ **Hardcoding the new value in SCSS as well.** Consume it through the `get-*()` helper — never both.
- ❌ **Assuming a hot reload picked it up.** theme.json changes often don't; restart `npm run dev`.

## Mechanical check

1. `npx chisel-verify` — catches a `get-*()` argument with no matching slug, a helper that doesn't exist, and preset classes with no matching theme.json entry.
2. Ask the user to run `npm run build-scripts`; never invoke it yourself.
3. Ask them to check **both** frontend and editor — theme.json feeds both, and a preset can render on one and not the other.

## Related

- Slug meanings, protected set, spacer math → [design-tokens.md](.claude/chisel/reference/design-tokens.md)
- JSON shapes for every token type → [theme-json-recipes.md](.claude/chisel/templates/theme-json-recipes.md)
- Bootstrapping a project's tokens from a spec → [setup-theme-json](.claude/skills/chisel-setup-theme-json/SKILL.md)
- Applying tokens to base styles → [adapt-base-styles](.claude/skills/chisel-adapt-base-styles/SKILL.md)
- SCSS accessors and helper signatures → [coding-conventions.md](.claude/chisel/reference/coding-conventions.md#scss--css)
