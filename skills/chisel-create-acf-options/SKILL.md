---
name: chisel-create-acf-options
description: Register an ACF Options page or sub-page for global site settings — theme options, social links, header CTA, footer content — reachable from any template as `{{ options.field_name }}`. Use when a value is site-wide and editable but belongs to no single post. Do NOT use for content a widget area, nav menu, or the Customizer already covers, or for per-post fields (those attach to the post type or the block).
argument-hint: "[options page name]"
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

# Create ACF Options Page

Theme root: `{{THEME_ROOT}}`. All paths below are relative to it.

## Before you start

**Load [reference/acf-naming.md](.claude/chisel/reference/acf-naming.md) first** — hex-hash keys, filename = group key, prefixed field names. Getting this wrong breaks ACF's edit-in-UI → save-back sync, and it is not something you can fix later without re-keying. This skill is the _how_; reference is the _what_.

Then confirm ACF Options is the right home. For header and footer content specifically, **widgets, menus and the Customizer come first** — ACF Options is the fallback for what they can't express. The mapping: [header-footer.md "Content source rule"](.claude/chisel/reference/header-footer.md#content-source-rule).

## Procedure

1. **Register the options page** in `custom/app/WP/Acf.php` (top-level or sub-page) — code in [templates/acf-options-template.md](.claude/chisel/templates/acf-options-template.md). The filters are `chisel_acf_options_pages` / `chisel_acf_options_sub_pages`.
2. **Add `options` to the Timber context** in `custom/app/WP/Site.php`, if the project hasn't already. This is a one-time step, not per page.
3. **Create the field group JSON** at `acf-json/group_{hash}.json`, with `location` pointing at the options page menu slug.
4. **Populate the fields immediately** via `xfive-acf-acf-field-update` with `post_id: "option"` — don't leave an options page empty. See [mcp-workflow.md "ACF fields"](.claude/chisel/reference/mcp-workflow.md#acf-fields).

Common field types: `text`, `textarea`, `wysiwyg`, `url`, `email`, `image` (return: `id`), `file`, `gallery`, `repeater` with `sub_fields`, `group` with `sub_fields`, `select`, `radio`, `checkbox`, `true_false`, `link`, `relationship`, `post_object`, `taxonomy`.

## Traps

- ❌ **A human-readable group key.** Keys are hex hashes and the filename must equal the key — anything else breaks the save-back sync.
- ❌ **Unprefixed field names.** `cta_text` collides across groups and breaks WPML uniqueness; use `header_cta_text`. Sub-fields take the full parent name (`social_links_url`).
- ❌ **Forgetting to bump `modified`** on an edited field group — ACF won't pick the change up.
- ❌ **Adding the Timber context filter twice.** Check `custom/app/WP/Site.php` before adding — one `options` context line serves every options page.
- ❌ **Rebuilding footer columns or copyright as an ACF repeater.** Those are registered widget areas already wired into `footer.twig` — [header-footer.md](.claude/chisel/reference/header-footer.md).
- ❌ Leaving fields empty after registering. An empty options page reads as broken.

## Mechanical check

1. Run [acf-naming.md "Mechanical check"](.claude/chisel/reference/acf-naming.md#mechanical-check-run-before-finishing-any-field-group) — key format, filename = key, every field and sub-field prefixed, `modified` bumped.
2. If the project uses WPML, set each field's translation preference: [acf-wpml-translation.md](.claude/chisel/reference/acf-wpml-translation.md).
3. Confirm the page appears in the admin menu and `{{ options.field_name }}` resolves in a template.

## Related

- Registration, context wiring and field-group JSON → [acf-options-template.md](.claude/chisel/templates/acf-options-template.md)
- Field-group naming rules → [acf-naming.md](.claude/chisel/reference/acf-naming.md)
- Per-field WPML translation preferences → [acf-wpml-translation.md](.claude/chisel/reference/acf-wpml-translation.md)
- Which source each header/footer element should use → [header-footer.md](.claude/chisel/reference/header-footer.md)
- Writing values into the fields → [mcp-workflow.md](.claude/chisel/reference/mcp-workflow.md#acf-fields)
- Reading them in templates → [twig-templating.md](.claude/chisel/reference/twig-templating.md#global-context-from-corewpsitephp)
