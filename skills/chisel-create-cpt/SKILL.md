---
name: chisel-create-cpt
description: Register a Custom Post Type and optional taxonomy, and wire it up for display. Use when the design shows multiple instances of the same content shape that editors manage individually and that has a single view or an archive — portfolio, team, case studies, services, events, locations. Do NOT use for one-off pages, homepage sections, content that only appears inside one pattern, or WooCommerce products.
argument-hint: "[cpt slug]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - AskUserQuestion
  - TodoWrite
  - mcp__xfive-mcp-chisel__*
---

# Create Custom Post Type

Theme root: `{{THEME_ROOT}}`. All paths below are relative to it.

## Before you start

**Run the CPT ladder in [reference/section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md#cpt-decision) first** — it confirms a CPT is the right call rather than an ACF block, a pattern, or a one-off page. All three conditions must hold.

Then load [reference/cpt.md](.claude/chisel/reference/cpt.md) — supported options, what the factory supplies, and the two hard rules (`editor` in `supports`; WooCommerce products are never a CPT). This skill is the _how_; reference is the _what_.

## Procedure

1. **Register the post type** in `custom/app/WP/CustomPostTypes.php` — code in [templates/cpt-template.md](.claude/chisel/templates/cpt-template.md). Include `editor` in `supports`; `supports` merges with the factory defaults, so list only additions.
2. **Register a taxonomy** in the same file, if the content needs one.
3. **Flush permalinks** — Settings → Permalinks → Save. Archive and single URLs don't resolve until you do.
4. **Templates only if asked.** WordPress falls back to `single.php` / `archive.php`, which is usually enough. See [twig-templating.md "Template hierarchy"](.claude/chisel/reference/twig-templating.md#template-hierarchy).
5. **Seed entries** via `xfive-posts-post-create` (`post_type: "case-study"`, with title, featured image, excerpt, ACF fields) — [mcp-workflow.md](.claude/chisel/reference/mcp-workflow.md).

### Displaying entries on a page

When the CPT has to appear on the homepage or another page (latest N, or a curated selection), build a **CPT-driven block** — never an ACF repeater duplicating the entries.

1. **Optional custom `Timber\Post` class** at `custom/app/Timber/{ChiselCpt}.php` if the CPT needs its own methods; map it in `custom/app/WP/Site.php`'s `post_classmap`.
2. **Build the block** (`chisel/{cpt-plural}`) via [create-acf-block](.claude/skills/chisel-create-acf-block/SKILL.md), with fields:
   - `mode` (select): `latest` | `selected`
   - `count` (number): shown only when mode=latest (ACF conditional logic)
   - `selected_items` (relationship to the CPT): shown only when mode=selected
   - plus presentation fields (heading, closing text, CTA link)
3. **Query inside the block-data filter** — `chisel_timber_acf_blocks_data_{slug}`, registered in `custom/app/WP/AcfBlocksData.php`. Code and bootstrap line: [templates/cpt-template.md "CPT-driven block data filter"](.claude/chisel/templates/cpt-template.md).
4. **Twig loops `posts`**, not `fields.items` — use `post.thumbnail`, `post.title`, `post.excerpt`, `post.link`. No data duplication between the page and the archive.

## Traps

- ❌ **Omitting `editor` from `supports`,** or setting `show_in_rest: false` — either one drops the CPT into the classic editor.
- ❌ **An ACF repeater instead of a CPT-driven block.** The same entry then exists twice and the copies drift.
- ❌ **ACF metaboxes on a regular CPT.** Those are for WooCommerce products only; regular CPTs get blocks.
- ❌ **Creating a CPT for a WooCommerce product.** Use the built-in product type.
- ❌ Registering hooks directly in `custom/functions.php` instead of the class's `filter_hooks()` — see [CLAUDE.md "Architecture"](CLAUDE.md#architecture-core-vs-custom).
- ❌ Forgetting to flush permalinks, then debugging a 404 that isn't a code problem.
- ❌ A `rewrite.slug` that collides with an existing page slug.

## Mechanical check

1. `npx chisel-verify` — token references, SCSS conventions, untouched `core/`.
2. Walk [cpt.md "Mechanical check"](.claude/chisel/reference/cpt.md#mechanical-check) — `editor` in supports, translated labels, registration in `custom/`, no slug collision, permalinks flushed.
3. Confirm the CPT appears in the admin menu with the right icon, and that an entry saves and renders.

## Related

- Whether the content warrants a CPT at all → [section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md#cpt-decision)
- Options, factory defaults, constraints → [cpt.md](.claude/chisel/reference/cpt.md)
- Registration, taxonomy and block-data filter code → [cpt-template.md](.claude/chisel/templates/cpt-template.md)
- The block that displays the entries → [create-acf-block](.claude/skills/chisel-create-acf-block/SKILL.md)
- `single-{slug}.twig` / `archive-{slug}.twig` → [twig-templating.md](.claude/chisel/reference/twig-templating.md#template-hierarchy)
- Seeding entries and images → [mcp-workflow.md](.claude/chisel/reference/mcp-workflow.md)
