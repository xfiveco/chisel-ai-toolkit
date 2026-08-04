# ACF Field Group Naming

Naming rules for **every** ACF field group JSON you author, regardless of where it attaches (block, options page, WooCommerce product meta box, term meta). This is the single source of truth — the block reference, the create-acf-block skill, and the create-acf-options skill all point here. Owns `key`, `name`, `label`, and `modified`. Does **not** own what WPML *does* with each field ([acf-wpml-translation.md](.claude/chisel/reference/acf-wpml-translation.md)) or block file structure and seed-data shape ([blocks.md](.claude/chisel/reference/blocks.md)).

## Hard rules

Two independent properties, two independent rules — plus a context-dependent prefix source.

### Rule 1 — `key` (group + every field) = real ACF-style hex hash

`group_` / `field_` followed by 13 hex chars, generated fresh per field — e.g. `group_6a1f3d2c9e740`, `field_6a1f3d2c9e741`. **Never** human-readable keys (`group_contact_fields`, `field_heading`).

**Filename must equal the group key:** `group_{hash}.json`.

Why: the key is the field group's sync identity. ACF's admin UI writes edits back to a JSON file named after the group key. Human-named keys/files break the round-trip — import → edit-in-UI → save-back: the group imports, but UI edits don't persist to disk, and column/wrapper settings (e.g. a repeater sub-field `wrapper.width` of `25%`/`75%`) silently fail to populate. This is identical across all attachment points — it's about ACF's save mechanism, not about blocks.

### Rule 2 — `name` (the field slug) = namespaced, globally unique

Every field `name` carries a namespace prefix so names are globally unique across the project. WPML registers translatable strings by field `name`; duplicate names bleed strings across contexts.

**The prefix SOURCE depends on what the group attaches to:**

| Attaches to (`location` param)                                                                                     | Values stored in                     | Name prefix source                                                                                                     | Example                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `block` (`chisel/{block}`)                                                                                         | `post_content` (delimiter JSON)      | block initials — multi-word → word initials, single-word → first 2 letters; collision → later block extends its prefix | `blueprint-process` → `bp_heading`; `slider` → `sl_…`; `blog-posts` after `blueprint-process` → `blp_…` |
| `options_page`                                                                                                     | `wp_options` (`options_{name}`)      | options page / section slug                                                                                            | `header_cta_text`, `footer_logo`, `social_links`                                                        |
| `post_type == product` (WooCommerce)                                                                               | `wp_postmeta` (`{name}` + `_{name}`) | `product_` or the feature name                                                                                         | `product_spec_sheet`, `product_warranty_years`                                                          |
| `post_type == post` / `== page` (per-entry settings)                                                               | `wp_postmeta`                        | the feature name                                                                                                       | `page_title_display`, `slider_settings`                                                                 |
| `nav_menu` / `nav_menu_item` (menu and menu-item settings)                                                         | term meta / post meta                | the feature name                                                                                                       | `mega_menu_enable`, `mega_menu_columns`, `mega_menu_default_dropdown`                                   |
| `taxonomy` (term meta)                                                                                             | `wp_termmeta`                        | taxonomy slug                                                                                                          | `genre_color`, `brand_logo`                                                                             |

**Chisel is Gutenberg-first: editable *content* belongs in blocks, not meta boxes.** A non-block group is for *settings about* an entry, not the entry's content — which is why the starter itself ships four of them (Page Title, Slider Settings, Mega Menu, Mega Menu - Submenu) and none holds copy. Reach for a block before a meta box; reach for a meta box only when the value configures the page rather than appears on it.

**Sub-fields** (repeater / group) use the **full parent name** as their base, in every context: repeater `bp_steps` → `bp_steps_label`, `bp_steps_title`. Options repeater `social_links` → `social_links_url`, `social_links_label`.

### Rule 3 — `label` stays human-readable

Only `name` is prefixed. `label` is what editors see: `Heading`, `Step label`, `CTA text`. Never prefix labels.

### Rule 4 — bump `modified` on EVERY edit to a field-group JSON

Any time you hand-edit a field-group JSON — adding/removing a field, renaming, changing a preference, fixing a key, anything — set the group's top-level `"modified"` to the current unix timestamp (seconds). This applies to **every** ACF JSON file, not just WPML/preference changes.

Why: ACF only flags a group as **"Sync available"** in *Custom Fields → Field Groups* when the JSON `modified` is **newer** than the copy in the database. If you edit the file but leave `modified` stale (or omit it), the admin shows no change and the edit never reaches the DB — a silent no-op. A brand-new group must include `modified` from creation, or it can never be synced.

- The value is unix **seconds** (not milliseconds), e.g. `"modified": 1782460414`.
- After you sync in the admin, ACFML re-serializes the file and bumps `modified` itself — that overwrite is expected; don't fight it.
- Editing JSON is only half the round-trip: the edit is inert until the group is synced (or re-imported). Always tell the user to sync after a JSON edit.

## Example — one field, all three properties distinct

Block `blueprint-process` → prefix `bp`:

```json
{
  "key": "field_7b3c4e1a9f852",   // hex hash, globally unique (Rule 1)
  "label": "Heading",             // human-readable, shown to editors (Rule 3)
  "name": "bp_heading",           // namespaced slug, WPML-safe (Rule 2)
  "type": "text"
}
```

## Mechanical check (run before finishing any field group)

1. Group `key` matches `group_[0-9a-f]{13}`; every field `key` matches `field_[0-9a-f]{13}`. Human-readable keys (`group_testimonial_fields`) are violations.
2. Filename equals the group key exactly.
3. **Every** field and sub-field `name` starts with the context prefix. Generic unprefixed names (`mode`, `count`, `heading`, `body`, `style`, `terms`) are violations even when they read fine in isolation — two blocks both shipping `mode` is exactly the WPML collision this rule prevents.
4. Top-level `"modified"` is set to the current unix timestamp (Rule 4) — on creation and on every edit.

## Related

- Per-field WPML translation preferences (`wpml_cf_preferences`, Expert mode) → [acf-wpml-translation.md](.claude/chisel/reference/acf-wpml-translation.md)
- Block file structure + ACF seed-data shape (`_{name}: "field_key"` pointers) → [blocks.md](.claude/chisel/reference/blocks.md)
- Where ACF JSON lives → [file-locations.md](.claude/chisel/reference/file-locations.md)
- Skills: [create-acf-block](.claude/skills/chisel-create-acf-block/SKILL.md) (block field group) · [create-acf-options](.claude/skills/chisel-create-acf-options/SKILL.md) (options page field group)
