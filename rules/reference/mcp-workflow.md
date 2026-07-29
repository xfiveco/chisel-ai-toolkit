# MCP Workflow

The `xfive-mcp-chisel` MCP server is the **only** supported path for creating or modifying Gutenberg content. Owns the tool list, payload shapes, write procedure, and the block-seeding traps. Does **not** own block file structures or what each `block.json` key does ([blocks.md](.claude/chisel/reference/blocks.md)), spacer and margin seeding rules ([design-tokens.md](.claude/chisel/reference/design-tokens.md#spacing-between-blocks)), or the per-screen build order ([screen-build-order.md](.claude/chisel/reference/screen-build-order.md)).

## Hard rules

1. **Every Gutenberg content write goes through MCP** — never PHP seeds, WP-CLI, manual paste, or direct `wp_posts` edits. → [What goes through MCP](#what-goes-through-mcp)
2. **If the `xfive-mcp-chisel-*` tools aren't in your tool list, STOP and ask** — do not improvise a fallback. → [Prerequisites](#prerequisites)
3. **`post-update-content` replaces the entire `post_content` on every call** — always fetch current, concatenate onto the full markup, write the whole thing back. → [Workflow for inserting content](#workflow-for-inserting-content)
4. **Call `block-schema` before hand-writing any block's markup** — wrong attributes are silently ignored. → [Traps](#traps)
5. **Verify after every write with `block-tree`, counting ALL top-level sections** — a tree taken after a destructive write looks clean. → [Workflow for inserting content](#workflow-for-inserting-content)
6. **Never use these tools on `patterns/*.php`** — those are source templates, not posts. → [What goes through MCP](#what-goes-through-mcp)
7. **Pass `post_status: "publish"` explicitly when creating pages** — the tool defaults to draft. → [Post creation defaults](#post-creation-defaults)

## Prerequisites

The MCP server is provided by the custom `xfive-mcp` WordPress plugin (Xfive-internal, not on wordpress.org). Before any tool call in this workflow:

1. Confirm the plugin is installed at `wp-content/plugins/xfive-mcp/` and activated in WP admin.
2. Confirm the `xfive-mcp-chisel` server is registered in your agent client's MCP config and the `xfive-mcp-chisel-*` tools appear in your available tool list.

If either is missing: **stop**. Ask the user to install/activate the plugin and configure the MCP server, then restart the agent client. Do not improvise a fallback (PHP seeds, WP-CLI, manual paste are all forbidden — see "Do NOT" below).

## What goes through MCP

Any Gutenberg content insertion goes through MCP:

- Pages out of patterns from a Figma import
- CPT entry layouts
- Inserting/replacing/moving blocks on existing posts
- "Build this page for me" requests

**Do NOT:**

- Write PHP seed scripts or WP-CLI commands
- Ask user to paste markup into the editor
- Edit `wp_posts.post_content` directly in the database
- Use these tools to modify `patterns/*.php` files (those are source templates, not posts)

## Available tools

| Category             | Tools                                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Posts                | `post-by-title`, `post-get-content`, `post-get-meta`, `post-create`, `post-update`, `post-update-content`, `post-trash` |
| Blocks               | `block-tree` (read), `block-schema` (read)                                                                              |
| Media                | `media-upload`, `media-migrate`                                                                                         |
| Menus                | `nav-menu-list`, `nav-menu-create`                                                                                      |
| ACF                  | `acf-field-get`, `acf-field-update`                                                                                     |
| Terms                | `term-list`, `term-create`, `term-update`, `term-delete`                                                                |
| Widgets              | `widgets-list`, `widget-add`, `widget-update`, `widget-remove`                                                          |
| Options & theme mods | `options-update`                                                                                                        |

## Workflow for inserting content

1. **Find or create the post**: `post-by-title` to look up, `post-create` to make new.
2. **Check existing structure** (if editing): `post-get-content` or `block-tree`.
3. **Validate block attributes** before writing markup: `block-schema` on each block type. Catches typos/wrong types. Wrong attributes are silently ignored.
4. **Upload images** via `xfive-media-media-upload` as part of each section build (not deferred). Capture attachment IDs/URLs. If URL returns wrong content-type (e.g. Figma asset URLs), download locally to a temp folder outside the theme (e.g. system temp, or a project-level `_tmp/` directory) then upload via `local_path`.
5. **Generate block markup** as serialized WordPress block grammar. Use preset classes (`has-primary-color`, `is-style-primary`, `has-large-font-size`).
6. **Write content**: ALWAYS via `post-update-content` with the **full serialized markup of the entire post**. The tool takes only `post_id` + `content` and **completely replaces `post_content` on every call** — there is no append or partial mode (partial-block tools were removed because index-based mutation was fragile).
   - **⚠️ To add a section**: fetch current with `post-get-content`, concatenate the new section onto the full existing markup, write the whole thing back. Sending only the new section silently wipes every prior section — confirmed twice in practice. Always get → concat-onto-full → write.
7. **Verify**: after every write, run `block-tree` and **count ALL top-level sections** against what should be there. A `block-tree` taken after a destructive write returns only the surviving block(s) — which falsely reads as a clean parse. Then user reloads in browser.

## Post creation defaults

- **Always pass `post_status: "publish"` explicitly** when creating pages — the tool defaults to `draft`, and the user should be able to preview immediately.
- **Page title display** (ACF `page_title_display`): `hide` (hero contains its own H1), `hide-visually` (custom visual but H1 needed for SEO), `show` (default — design shows a page title heading).
- **Set homepage** after creating Home page:
  ```
  xfive-options-options-update {
    type: "option",
    entries: { "show_on_front": "page", "page_on_front": 95 }
  }
  ```

## ACF fields

Populate ACF fields immediately after creating options pages or field groups — don't leave empty.

```
xfive-acf-acf-field-update {
  post_id: "option",  // or numeric post ID
  fields: { "header_cta_text": "Let's talk", "header_cta_url": "#contact" }
}
```

## Theme mods and options

```
xfive-options-options-update {
  type: "theme_mod",  // or "option"
  entries: { "custom_logo": 42 }
}
```

Common use cases:

- **Site logo**: upload via `xfive-media-media-upload` → set `custom_logo` theme mod to attachment ID
- **Front page**: `type: "option"`, `entries: { "show_on_front": "page", "page_on_front": {id} }`
- **Nav menu locations**: `type: "theme_mod"`, `entries: { "nav_menu_locations": { "chisel_main_nav": 3 } }`

## Images

- Upload **as part of each section's build**, not deferred to a final step. Each section must be fully reviewable before moving on.
- Upload without asking for permission — it's a required step.
- SVG `<img>` tags require explicit `width` and `height`.

## Nav menus

`nav-menu-create` may append items to an existing menu with the same name. Check first via `nav-menu-list` to avoid duplicates.

## Traps

These cause "Block validation failed" or wrong markup the agent won't catch on its own. CLAUDE.md carries the headlines; the full explanation of each lives here — read this before hand-writing any block markup.

- **Schema before every block, every time.** Call `xfive-blocks-block-schema` for each block type before writing its markup. Chisel ACF blocks use `chisel/{name}`, NOT `acf/{name}`. A failed call = block missing / build not run / wrong slug — stop, don't guess. Wrong attrs are silently ignored.
- **Static vs dynamic seed shape (check `renderMode` in the schema response).** Static (`renderMode: "static"`, client `save()` returns JSX) MUST be paired tags with rendered inner HTML: `<!-- wp:name {attrs} -->INNER<!-- /wp:name -->`. Dynamic (`renderMode: "dynamic"`, server `render_callback`, including ACF blocks) may self-close: `<!-- wp:name {attrs} /-->`. Self-closing a static block stores empty inner HTML; the editor re-runs `save()`, sees a diff, shows "Block validation failed".
- **`seedAs` is necessary but not sufficient.** When attributes change `save()` output (image `width`/`height`/`sizeSlug`, button URL/className, heading `level`, group `tagName`/`layout`, etc.) → always paired tags with fully-rendered inner HTML, even if schema says self-closing is OK. When in doubt, use paired tags.
- **`useBlockProps.save({className})` auto-prefixes `wp-block-{namespace}-{name}`** onto the wrapper element. Read the block's `save.js` and include the auto-prefix in hand-written seed markup.
- **No whitespace inside containers wrapping `<InnerBlocks.Content />` — custom/chisel static blocks only.** A hand-written `save()` renders the container with zero whitespace, so pretty-printing the seeded HTML triggers "Block validation failed". Inline the inner-block comments tightly: `<div class="b-foo__content"><!-- wp:paragraph --><p>...</p><!-- /wp:paragraph --></div>`. Core container blocks (`group`, `cover`, `media-text`, `columns`) tolerate pretty-printed inner markup — the [pattern-markup.md](.claude/chisel/templates/pattern-markup.md) templates are valid as shown.
- **`core/cover` overlays use `"overlayColor":"{slug}"` — never `customOverlayColor` with a raw hex.** Custom hex bypasses the palette (untokenized color drift the raw-value audit can't trace back). If the design's overlay color has no palette slug, add the token to theme.json first, then reference the slug.
- **`core/group` with both `backgroundColor` AND `textColor` requires `has-background`** on the rendered `<div>` — in addition to `has-background-color has-{slug}-background-color has-text-color`. Missing it = "Block validation failed" on save. Full saved class list: `has-background-color has-{slug}-background-color has-text-color has-background`. (When only one of the two is set, omit `has-background`.)
- **`post-update-content` un-escapes one backslash level.** ACF block `data` containing `\r\n` / `\t` (multi-line textarea / WYSIWYG fields) must be **double-escaped** (`\\r\\n`, `\\t`) in the content you send, or the escape sequence is stripped to its bare letters and corrupts the field. Re-fetch and verify any field carrying newlines/tabs after writing.
- **When unsure: round-trip.** Insert one instance in the editor manually, save, `xfive-posts-post-get-content`, copy that exact markup. The block's own `save()` is ground truth.
- Pages created with an explicit `post_status: "publish"` (the tool defaults to draft) for immediate preview. New ACF block → pause for the user to **compile** (`npm run build-scripts` — the block + field group register only from `build/`), then schema-check passes, then seed (schema fails until the compile runs).

## Mechanical check

Run after every content write, before calling a section done.

1. `block-schema` was called for every block type before its markup was written.
2. Static blocks (`renderMode: "static"`) seeded as paired tags with rendered inner HTML; only dynamic blocks self-close.
3. ACF blocks referenced as `chisel/{name}`, never `acf/{name}`.
4. The full post markup was sent to `post-update-content` — fetched current, concatenated, wrote the whole thing back.
5. `block-tree` run after the write and **all** top-level sections counted against what should be there.
6. Page created with an explicit `post_status: "publish"`.
7. `core/cover` overlays use an `overlayColor` slug — no `customOverlayColor` with a raw hex.
8. `core/group` carrying both `backgroundColor` and `textColor` also has `has-background` in its class list.
9. ACF `data` containing `\r\n` / `\t` was double-escaped, then re-fetched and verified.
10. Images uploaded during the section build with attachment IDs captured; SVG `<img>` tags carry `width` and `height`.
11. A new ACF block was compiled (`npm run build-scripts`) before any seeding attempt.
12. `nav-menu-list` checked before `nav-menu-create` so no duplicate menu was appended.

## Related

- Block file structures and what each `block.json` key does → [blocks.md](.claude/chisel/reference/blocks.md)
- ACF seed-data shape (`_{name}: "field_key"` pointers) → [blocks.md](.claude/chisel/reference/blocks.md#acf-field-data-shape)
- Spacer, margin and `disableBottomMargin` seeding → [design-tokens.md](.claude/chisel/reference/design-tokens.md#spacing-between-blocks)
- Pattern markup templates → [pattern-markup.md](.claude/chisel/templates/pattern-markup.md)
- Per-screen build order and verification checklist → [screen-build-order.md](.claude/chisel/reference/screen-build-order.md)
- Skills: [create-pattern](.claude/skills/chisel-create-pattern/SKILL.md) · [create-acf-block](.claude/skills/chisel-create-acf-block/SKILL.md) · [figma-to-chisel](.claude/skills/chisel-figma-to-chisel/SKILL.md)
