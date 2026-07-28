# ACF + WPML Field Translation (canonical — all ACF field groups)

How to set the per-field WPML translation preference in ACF field-group JSON. Applies to **every** ACF field group, regardless of attachment point (block, options page, product meta box, term meta). Pairs with [acf-naming.md](acf-naming.md) — naming makes fields WPML-safe; this doc decides what WPML *does* with each field.

The site runs WPML + ACFML (ACF Multilingual). ACFML reads two things from the field-group JSON:

1. `acfml_field_group_mode` on the **group** — must be `"advanced"` or per-field preferences are ignored.
2. `wpml_cf_preferences` on **each field** (and each sub-field) — the integer translation preference.

## Rule 1 — group must be in Expert ("advanced") mode

Per-field `wpml_cf_preferences` only take effect when the group carries:

```json
"acfml_field_group_mode": "advanced"
```

In ACFML's default ("standard") mode the per-field values are dormant and ACFML applies its own type defaults. Without this key on the group, editing `wpml_cf_preferences` in JSON does nothing visible. ACFML adds this key itself the first time you toggle Expert mode in the field-group UI and re-save; author it directly in JSON to avoid the manual step.

## Rule 2 — the `wpml_cf_preferences` enum (from WPML source)

| Value | WPML constant | Meaning | UI label |
| --- | --- | --- | --- |
| `1` | `WPML_COPY_CUSTOM_FIELD` | value copied identically to every language, stays in sync | **Copy** |
| `2` | `WPML_TRANSLATE_CUSTOM_FIELD` | field is editable per language / shows in the Translation Editor | **Translate** |
| `3` | `WPML_COPY_ONCE_CUSTOM_FIELD` | copied to the translation on creation, then independently editable | **Copy Once** |

These are the literal integers WPML defines (`sitepress-multilingual-cms`) — use the value from the table above (`1` Copy, `2` Translate, `3` Copy Once); the integer does not rank "how much translation." A missing key falls back to ACFML's type default, so always set it explicitly in Expert mode.

## Rule 3 — preset preference per ACF field type

Two columns, matching ACFML's own preset table. Pick the column by whether the field's value is **the same content across languages** or **genuinely different per language**:

- **Same fields across languages** — the field holds the same data everywhere (a shared setting, a shared asset). Use this column by default for settings/media/relational fields.
- **Different fields across languages** — the field's value legitimately differs per language. Use this column when an editor would want an independent value in each language but no auto-translation.

For Text / Text Area / Wysiwyg / Message the answer is **Translate (`2`)** in both columns — translatable text is always translatable.

### Basic Fields

| Type | Same across langs | Different across langs |
| --- | --- | --- |
| `text` | Translate `2` | Translate `2` |
| `textarea` | Translate `2` | Translate `2` |
| `number` | Copy `1` | Copy Once `3` |
| `range` | Copy `1` | Copy Once `3` |
| `email` | Copy `1` | Copy Once `3` |
| `url` | Copy `1` | Copy Once `3` |
| `password` | Copy `1` | Copy Once `3` |

### Content Fields

| Type | Same across langs | Different across langs |
| --- | --- | --- |
| `image` | Copy `1` | Copy Once `3` |
| `file` | Copy `1` | Copy Once `3` |
| `wysiwyg` | Translate `2` | Translate `2` |
| `oembed` | Copy `1` | Copy Once `3` |
| `gallery` | Copy `1` | Copy Once `3` |

### Choice Fields

| Type | Same across langs | Different across langs |
| --- | --- | --- |
| `select` | Copy `1` | Copy Once `3` |
| `checkbox` | Copy `1` | Copy Once `3` |
| `radio` | Copy `1` | Copy Once `3` |
| `button_group` | Copy `1` | Copy Once `3` |
| `true_false` | Copy `1` | Copy Once `3` |

### jQuery Fields

| Type | Same across langs | Different across langs |
| --- | --- | --- |
| `google_map` | Copy `1` | Copy Once `3` |
| `date_picker` | Copy `1` | Copy Once `3` |
| `date_time_picker` | Copy `1` | Copy Once `3` |
| `time_picker` | Copy `1` | Copy Once `3` |
| `color_picker` | Copy `1` | Copy Once `3` |

### Layout Fields

| Type | Same across langs | Different across langs |
| --- | --- | --- |
| `message` | Translate `2` | Translate `2` |
| `accordion` | Copy `1` | Copy Once `3` |
| `tab` | Copy `1` | Copy Once `3` |
| `group` | Copy `1` | Copy Once `3` |
| `repeater` | Copy `1` | Copy Once `3` |
| `flexible_content` | Copy `1` | Copy Once `3` |
| `clone` | Copy `1` | Copy Once `3` |

### Relational Fields

| Type | Same across langs | Different across langs |
| --- | --- | --- |
| `link` | Copy `1` | Copy Once `3` |
| `post_object` | Copy `1` | Copy Once `3` |
| `page_link` | Copy `1` | Copy Once `3` |
| `relationship` | Copy `1` | Copy Once `3` |
| `taxonomy` | Copy `1` | Copy Once `3` |
| `user` | Copy `1` | Copy Once `3` |

## Rule 4 — containers and their children

Layout/container fields (`repeater`, `group`, `flexible_content`, `clone`, `accordion`, `tab`) get their own preference (**Copy `1`** when the structure is shared), but the **translatable content lives in the sub-fields** — each sub-field carries its own `wpml_cf_preferences` by its own type. A repeater of text rows: repeater `1`, each text sub-field `2`.

Structural fields with no stored value (`tab`, `accordion`, `clone` display) still take a preference for completeness — `1` for each. A `message` field takes `2` (its text is translatable).

## Rule 5 — let ACFML re-serialize after a sync

When a group is synced in **Custom Fields → Field Groups**, ACFML rewrites the JSON file: it reorders keys, adds `acfml_field_group_mode`, `display_title`, and `allow_in_bindings`, and bumps `modified`. This is expected. Author the minimum (`acfml_field_group_mode` + `wpml_cf_preferences`), sync once, and let ACFML normalize the rest. Do not fight the re-serialized key order.

> **Bump `modified` after editing preferences, then sync** — the JSON edit is inert until synced, and sync only fires when `modified` is newer than the DB copy. This is the same rule that governs every ACF JSON edit: [acf-naming.md "Rule 4 — bump `modified` on EVERY edit"](acf-naming.md).

## Default baseline — which column to apply

Unless a site is explicitly set up for per-language master content, use the **"Same across languages"** column as the baseline. Quick heuristic for any field group:

- **Visible prose an editor writes** (`text`, `textarea`, `wysiwyg`, `message`) → **Translate `2`**. Always, both columns.
- **Media** (`image`, `file`, `gallery`, `oembed`) → **Copy `1`**. Use `wpml-config.xml` / WPML Media Translation if a language needs a different asset, not a per-field Translate.
- **Settings** (`select`, `radio`, `button_group`, `checkbox`, `number`, the jQuery pickers) → **Copy `1`**. These are language-neutral configuration.
- **Relational** (`relationship`, `post_object`, `page_link`, `taxonomy`, `user`, `link`) → **Copy `1`**. WPML resolves the referenced post/term to its translation automatically; the stored ID stays shared.
- **Containers** (`repeater`, `group`, `flexible_content`, `clone`, `accordion`, `tab`) → **Copy `1`**; recurse into sub-fields and apply the rules above to each.

Switch a specific field to the **"Different across languages"** column (Copy Once `3`) only when an editor genuinely needs an independent non-text value per language with no auto-translation — rare; confirm with the site owner before deviating.

## Related

- Field naming (WPML string uniqueness via `name` prefix) → [acf-naming.md](acf-naming.md)
- Block field-group structure + seed-data shape → [blocks.md](blocks.md)
- Where plugin integration code (WPML hooks) lives → [file-locations.md](file-locations.md)
