# Custom Post Types

What a Chisel CPT is made of — the supported options, the defaults the factory supplies, and the constraints that make one work with Gutenberg. Owns the **what**. Does **not** own whether to create one ([section-mapping-decisions.md "CPT decision"](.claude/chisel/reference/section-mapping-decisions.md#cpt-decision)), the registration code ([cpt-template.md](.claude/chisel/templates/cpt-template.md)), where the file lives ([file-locations.md](.claude/chisel/reference/file-locations.md#registrations-php)), or the single/archive templates ([twig-templating.md](.claude/chisel/reference/twig-templating.md#template-hierarchy)). Step-by-step: [create-cpt](.claude/skills/chisel-create-cpt/SKILL.md).

## Hard rules

1. **Always include `editor` in `supports`** unless explicitly told otherwise, and leave `show_in_rest` at its `true` default — Gutenberg needs both. A CPT without them opens in the classic editor.
2. **WooCommerce products are not a CPT.** Use WooCommerce's built-in product type with ACF metaboxes. ACF metaboxes on a regular CPT are the wrong tool — regular CPTs get blocks.

## Supported options

`singular` and `plural` are the only ones the factory needs — everything else has a default. Passed through to `register_post_type()`:

| Option | Default |
| --- | --- |
| `singular`, `plural` | `Item` / `Items` — always set them |
| `supports` | merged onto the defaults below |
| `public` | `true` |
| `hierarchical` | `false` |
| `publicly_queryable`, `show_ui`, `show_in_nav_menus`, `show_in_menu` | follow `public` |
| `show_in_admin_bar` | follows `show_in_menu` |
| `exclude_from_search` | the inverse of `public` |
| `show_in_rest` | `true` |
| `has_archive` | `true` |
| `menu_icon` | `dashicons-admin-post` |
| `menu_position` | `null` |
| `capability_type` | `post` |
| `capabilities` | empty |
| `rewrite` | `slug` = the post type key, `with_front`/`feeds`/`pages` true, `ep_mask` `EP_PERMALINK`. Pass `false` to disable |
| `query_var` | the post type key |
| `can_export` | `true` |
| `description` | empty |

Also accepted and passed through when present: `labels`, `taxonomies`, `template`, `template_lock`, `map_meta_cap`, `register_meta_box_cb`, `rest_base`, `rest_namespace`, `rest_controller_class`, `autosave_rest_controller_class`, `revisions_rest_controller_class`, `late_route_registration`.

## What the factory supplies

`RegisterCustomPostType` generates the full **label set** — 30-odd strings, all built from `singular` / `plural` and translated with the `chisel` text domain. Pass a partial `labels` array to override individual ones; the rest still come from the generator. It does **not** generate capabilities: `capability_type` defaults to `post` and `capabilities` to empty, so a CPT gets standard post capabilities unless you say otherwise.

**`supports` is appended to the defaults, not replaced.** The defaults are `title`, `page-attributes`, `revisions`, `author` — so `array( 'editor', 'thumbnail', 'excerpt' )` yields all seven. List only what you are adding. Both the defaults and the rewrite args are filterable, globally (`chisel_default_post_type_supports`, `chisel_default_post_type_rewrite_args`) and per post type (`chisel_default_post_type_supports_{post_type}`), so a project can shift them — read `custom/` before assuming the stock set.

**`thumbnail` in `supports` self-registers.** The factory adds the post type to `chisel_post_thumbnails_post_types` for you — no separate `add_theme_support` call.

## After registering

Permalinks must be flushed before archive and single URLs resolve: Settings → Permalinks → Save (no changes needed, just save).

## Taxonomies

Registered from the same class via `register_custom_taxonomies`, keyed by slug, with `post_types` naming the CPTs it attaches to. Same pass-through model as post types.

## Displaying a CPT on a page

A CPT that needs to appear on the homepage or any other page gets a **CPT-driven block with variant modes** (latest N / manually selected) — never an ACF repeater duplicating the entries. The full ladder and the reason is in [section-mapping-decisions.md "CPT decision"](.claude/chisel/reference/section-mapping-decisions.md#cpt-decision).

## Mechanical check

1. `editor` is in `supports` and `show_in_rest` is not set to `false`.
2. `singular` and `plural` are both present and translated with the `chisel` text domain.
3. The registration lives in `custom/app/WP/CustomPostTypes.php`, not in `core/`.
4. `rewrite.slug` doesn't collide with an existing page slug.
5. Permalinks flushed after registering.
6. Any field group attached to the CPT passes [acf-naming.md "Mechanical check"](.claude/chisel/reference/acf-naming.md#mechanical-check-run-before-finishing-any-field-group).

## Related

- Whether the content warrants a CPT at all → [section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md#cpt-decision)
- Registration and taxonomy code → [cpt-template.md](.claude/chisel/templates/cpt-template.md)
- Which file and filter registers it → [file-locations.md](.claude/chisel/reference/file-locations.md#registrations-php)
- `single-{slug}.twig` / `archive-{slug}.twig` → [twig-templating.md](.claude/chisel/reference/twig-templating.md#template-hierarchy)
- Seeding entries via MCP → [mcp-workflow.md](.claude/chisel/reference/mcp-workflow.md)
- Skills: [create-cpt](.claude/skills/chisel-create-cpt/SKILL.md) · [create-acf-block](.claude/skills/chisel-create-acf-block/SKILL.md)
