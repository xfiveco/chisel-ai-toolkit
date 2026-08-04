# ACF + WPML Field Translation

How to set the per-field WPML translation preference in ACF field-group JSON. Applies to **every** ACF field group, regardless of attachment point (block, options page, product meta box, term meta). Owns what WPML *does* with each field. Does **not** own field naming ([acf-naming.md](.claude/chisel/reference/acf-naming.md) — naming makes fields WPML-safe, this doc decides their behavior) or block field-group structure ([blocks.md](.claude/chisel/reference/blocks.md)).

## Hard rules

**This doc applies only on projects running WPML + ACFML (ACF Multilingual).** The Chisel starter ships neither — none of its four field groups carries an ACFML key. Confirm both plugins are active before adding any of this; on a monolingual site these keys are noise.

ACFML reads two things from the field-group JSON:

1. `acfml_field_group_mode` on the **group** — which of three modes the group is in.
2. `wpml_cf_preferences` on **each field** (and each sub-field) — the integer translation preference.

### Rule 1 — Expert ("advanced") is the mode you want, and it is the default

ACFML has three group modes: `translation`, `localization`, and `advanced` (labelled "Expert" in the UI). There is no "standard" mode.

```json
"acfml_field_group_mode": "advanced"
```

**A group with no `acfml_field_group_mode` key is already in advanced mode** — `Mode::isAdvanced()` matches both `"advanced"` and a missing key. So per-field `wpml_cf_preferences` in a hand-authored group take effect immediately; you do not have to add the key to "unlock" them.

Write it anyway, for one reason: it pins the mode so a later UI toggle or ACFML default change can't silently move the group into `translation` or `localization`, where the per-field values give way to the preset table in Rule 3. Don't treat a group that lacks the key as broken.

### Rule 2 — the `wpml_cf_preferences` enum (from WPML source)

| Value | WPML constant                 | Meaning                                                            | UI label            |
| ----- | ----------------------------- | ------------------------------------------------------------------ | ------------------- |
| `0`   | `WPML_IGNORE_CUSTOM_FIELD`    | field is left out of translation handling entirely                 | **Don't translate** |
| `1`   | `WPML_COPY_CUSTOM_FIELD`      | value copied identically to every language, stays in sync          | **Copy**            |
| `2`   | `WPML_TRANSLATE_CUSTOM_FIELD` | field is editable per language / shows in the Translation Editor   | **Translate**       |
| `3`   | `WPML_COPY_ONCE_CUSTOM_FIELD` | copied to the translation on creation, then independently editable | **Copy once**       |

These are the literal integers WPML defines in `sitepress-multilingual-cms/inc/constants.php`, and all four are accepted by ACFML. The integer does not rank "how much translation" — `0` is a valid preference, not an absent one. In practice Chisel groups use `1`, `2` and `3`; reach for `0` only to deliberately exclude a field.

A missing key falls back to the Rule 3 preset for that field's type, and for a type ACFML doesn't list the fallback is **Translate (`2`)**. Set it explicitly rather than relying on either.

### Rule 3 — preset preference per ACF field type

This is ACFML's own preset table (`ACFML\FieldGroup\ModeDefaults::MAP`), copied verbatim. **The two columns are the two non-Expert group modes, not a judgement you make per field:**

- **Same fields across languages** = the group is in `translation` mode
- **Different fields across languages** = the group is in `localization` mode

In `advanced` (Expert) mode — the default, see Rule 1 — ACFML applies **no** preset at all; every field carries whatever `wpml_cf_preferences` you wrote. So read this table as *what ACFML would have chosen*, and use it as the sane default for the value you author by hand. Column 1 is the right default for Chisel work.

For Text / Text Area / Wysiwyg / Message the answer is **Translate (`2`)** in both columns — translatable text is always translatable.

`acfml_field_group_mode_field_translation_preference` (`$preference`, `$groupMode`, `$field`) overrides a preset in PHP if a project needs a different default.

#### Basic Fields

| Type       | Same across langs | Different across langs |
| ---------- | ----------------- | ---------------------- |
| `text`     | Translate `2`     | Translate `2`          |
| `textarea` | Translate `2`     | Translate `2`          |
| `number`   | Copy `1`          | Copy Once `3`          |
| `range`    | Copy `1`          | Copy Once `3`          |
| `email`    | Copy `1`          | Copy Once `3`          |
| `url`      | Copy `1`          | Copy Once `3`          |
| `password` | Copy `1`          | Copy Once `3`          |

#### Content Fields

| Type      | Same across langs | Different across langs |
| --------- | ----------------- | ---------------------- |
| `image`   | Copy `1`          | Copy Once `3`          |
| `file`    | Copy `1`          | Copy Once `3`          |
| `wysiwyg` | Translate `2`     | Translate `2`          |
| `oembed`  | Copy `1`          | Copy Once `3`          |
| `gallery` | Copy `1`          | Copy Once `3`          |

#### Choice Fields

| Type           | Same across langs | Different across langs |
| -------------- | ----------------- | ---------------------- |
| `select`       | Copy `1`          | Copy Once `3`          |
| `checkbox`     | Copy `1`          | Copy Once `3`          |
| `radio`        | Copy `1`          | Copy Once `3`          |
| `button_group` | Copy `1`          | Copy Once `3`          |
| `true_false`   | Copy `1`          | Copy Once `3`          |

#### jQuery Fields

| Type               | Same across langs | Different across langs |
| ------------------ | ----------------- | ---------------------- |
| `google_map`       | Copy `1`          | Copy Once `3`          |
| `date_picker`      | Copy `1`          | Copy Once `3`          |
| `date_time_picker` | Copy `1`          | Copy Once `3`          |
| `time_picker`      | Copy `1`          | Copy Once `3`          |
| `color_picker`     | Copy `1`          | Copy Once `3`          |
| `icon_picker`      | Copy `1`          | Copy Once `3`          |

#### Layout Fields

| Type               | Same across langs | Different across langs |
| ------------------ | ----------------- | ---------------------- |
| `message`          | Translate `2`     | Translate `2`          |
| `accordion`        | Copy `1`          | Copy Once `3`          |
| `tab`              | Copy `1`          | Copy Once `3`          |
| `group`            | Copy `1`          | Copy Once `3`          |
| `repeater`         | Copy `1`          | Copy Once `3`          |
| `flexible_content` | Copy `1`          | Copy Once `3`          |
| `clone`            | Copy `1`          | Copy Once `3`          |

#### Relational Fields

| Type           | Same across langs | Different across langs |
| -------------- | ----------------- | ---------------------- |
| `link`         | Copy `1`          | Copy Once `3`          |
| `post_object`  | Copy `1`          | Copy Once `3`          |
| `page_link`    | Copy `1`          | Copy Once `3`          |
| `relationship` | Copy `1`          | Copy Once `3`          |
| `taxonomy`     | Copy `1`          | Copy Once `3`          |
| `user`         | Copy `1`          | Copy Once `3`          |

### Rule 4 — containers and their children

Layout/container fields (`repeater`, `group`, `flexible_content`, `clone`, `accordion`, `tab`) get their own preference (**Copy `1`** when the structure is shared), but the **translatable content lives in the sub-fields** — each sub-field carries its own `wpml_cf_preferences` by its own type. A repeater of text rows: repeater `1`, each text sub-field `2`.

Structural fields with no stored value (`tab`, `accordion`, `clone` display) still take a preference for completeness — `1` for each. A `message` field takes `2` (its text is translatable).

### Rule 5 — let ACFML re-serialize after a sync

When a group is synced in **Custom Fields → Field Groups**, the JSON file is rewritten: keys get reordered, `acfml_field_group_mode` is written out, and `modified` is bumped. This is expected. Author the minimum (`acfml_field_group_mode` + `wpml_cf_preferences`), sync once, and let the plugins normalize the rest. Do not fight the re-serialized key order.

Don't read every unfamiliar key as ACFML's. `allow_in_bindings` is plain ACF — it appears on fields in the starter's own Mega Menu groups, which carry no ACFML keys at all. Only `acfml_field_group_mode` and `wpml_cf_preferences` belong to ACFML.

> **Bump `modified` after editing preferences, then sync** — the JSON edit is inert until synced, and sync only fires when `modified` is newer than the DB copy. This is the same rule that governs every ACF JSON edit: [acf-naming.md "Rule 4 — bump `modified` on EVERY edit"](.claude/chisel/reference/acf-naming.md).

## Default baseline — which column to apply

Unless a site is explicitly set up for per-language master content, use the **"Same across languages"** column as the baseline. Quick heuristic for any field group:

- **Visible prose an editor writes** (`text`, `textarea`, `wysiwyg`, `message`) → **Translate `2`**. Always, both columns.
- **Media** (`image`, `file`, `gallery`, `oembed`) → **Copy `1`**. Use `wpml-config.xml` / WPML Media Translation if a language needs a different asset, not a per-field Translate.
- **Settings** (`select`, `radio`, `button_group`, `checkbox`, `number`, the jQuery pickers) → **Copy `1`**. These are language-neutral configuration.
- **Relational** (`relationship`, `post_object`, `page_link`, `taxonomy`, `user`, `link`) → **Copy `1`**. WPML resolves the referenced post/term to its translation automatically; the stored ID stays shared.
- **Containers** (`repeater`, `group`, `flexible_content`, `clone`, `accordion`, `tab`) → **Copy `1`**; recurse into sub-fields and apply the rules above to each.

Switch a specific field to the **"Different across languages"** column (Copy Once `3`) only when an editor genuinely needs an independent non-text value per language with no auto-translation — rare; confirm with the site owner before deviating.

## Twig strings and WPML String Translation

Separate from ACF fields, and easy to miss: **WPML's theme scan only parses `.php` / `.inc` / `.js`, so a `__()` call inside a Twig template is invisible to String Translation.** Chisel works around this in `core/Plugins/Wpml/Wpml.php` — right before WPML builds its file list, it extracts gettext calls from Twig into a generated `wpml-twig-strings.php` stub the scanner can read. The stub is regenerated on every scan; never edit it.

Three limits decide whether your string actually gets registered:

- **Only `views/` is walked.** A `__()` in `src/blocks-acf/{block}/{block}.twig` — or in `custom/views/` — is never picked up. Put translatable copy in a `views/` template, or pass it in from PHP.
- **Only string literals are extracted.** `{{ __('Read more', 'chisel') }}` works; anything assembled from a Twig variable is skipped silently.
- **String Translation must be active** (`WPML_ST_VERSION`). `add_filter( 'chisel_wpml_twig_strings', '__return_false' )` turns the whole mechanism off.

## Mechanical check

Run before finishing any field group.

0. WPML and ACFML are actually active on this project. If not, none of this applies — don't add the keys. *(Hard rules)*
1. Group carries `"acfml_field_group_mode": "advanced"` — pins the mode. A group missing the key is already advanced, so this is belt-and-braces, not a bug fix. *(Rule 1)*
2. **Every** field and sub-field has an explicit `wpml_cf_preferences` — a missing key falls back to the Rule 3 preset, or to Translate for a type ACFML doesn't list. *(Rule 2)*
3. Every value is `0`, `1`, `2`, or `3`; in practice `1`/`2`/`3` unless a field is deliberately excluded. *(Rule 2)*
4. Prose fields (`text`, `textarea`, `wysiwyg`, `message`) are `2`. *(Rule 3, both columns)*
5. Media, choice, jQuery-picker and relational fields are `1` under the default baseline; `3` only where the site owner confirmed a per-language value. *(Default baseline)*
6. Containers (`repeater`, `group`, `flexible_content`, `clone`, `accordion`, `tab`) are `1`, and each sub-field carries its own preference by its own type. *(Rule 4)*
7. Top-level `modified` bumped, and the user told to sync — the JSON edit is inert until then. *(Rule 5)*
8. Any translatable copy you added to a Twig template lives under `views/` and uses string literals, or String Translation will never see it. *(Twig strings)*

## Related

- Field naming (WPML string uniqueness via `name` prefix) → [acf-naming.md](.claude/chisel/reference/acf-naming.md)
- Block field-group structure + seed-data shape → [blocks.md](.claude/chisel/reference/blocks.md)
- Where plugin integration code (WPML hooks) lives → [file-locations.md](.claude/chisel/reference/file-locations.md)
- Skills: [create-acf-block](.claude/skills/chisel-create-acf-block/SKILL.md) · [create-acf-options](.claude/skills/chisel-create-acf-options/SKILL.md)
