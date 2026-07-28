---
name: chisel-create-acf-block
description: Create an ACF block — field-driven repeating content (sliders, testimonials, team grids, stats counters). Editors fill in structured fields rather than composing free-form block content.
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

# Create ACF Block

**Load [reference/blocks.md](.claude/chisel/reference/blocks.md) first** — required file list, the build-pipeline rule (`script.js` as webpack entry), `ignoreScripts` rules, and ACF field-data shape (`_{name}: "field_key"` pointers) all live there. This skill is the _how_; reference is the _what_.

Use ACF blocks for repeatable, field-driven content. For interactive UI or free-form composition, see [create-block](.claude/skills/chisel-create-block/SKILL.md) or [create-pattern](.claude/skills/chisel-create-pattern/SKILL.md).

## Procedure

1. **Check CPT ladder first.** If the block displays entity-like repeating content (case studies, team, portfolio, events), run [section-mapping-decisions.md CPT decision](.claude/chisel/reference/section-mapping-decisions.md#cpt-decision). If all 3 apply → CPT + CPT-driven block with `latest`/`selected` variants ([create-cpt.md](.claude/skills/chisel-create-cpt/SKILL.md) "Pair with a custom block"), NOT a repeater here.
2. **Create the files** at `src/blocks-acf/{block-name}/`. File list and `block.json` script/style key requirements: [reference/blocks.md "ACF Block"](.claude/chisel/reference/blocks.md#acf-block-srcblocks-acfname). Use the templates below for `block.json`, the Twig template, `style.scss`, `script.js` (CSS entry), `view.js` (frontend behavior, only if interactive), and the ACF field group JSON.
3. **Populate any preset ACF option fields** immediately via `xfive-acf-acf-field-update`.
4. **Run `npm run dev` or `build-scripts` to compile** — Chisel registers blocks from `build/blocks-acf/`, NOT `src/blocks-acf/`. Until the build runs, the block won't appear and the editor will show "your site doesn't include {block-name} block" on existing posts referencing it.
5. **Verify** in editor under "Chisel Blocks", then `xfive-blocks-block-schema` to confirm registration.

## Templates

### block.json

Follow `src/blocks-acf/slider/block.json`:

```json
{
  "name": "chisel/{block-name}",
  "title": "{Block Title}",
  "description": "{description}",
  "category": "chisel-blocks",
  "icon": "{dashicon}",
  "apiVersion": 3,
  "keywords": ["{keyword1}", "{keyword2}"],
  "textdomain": "chisel",
  "acf": {
    "mode": "preview",
    "usePostMeta": false,
    "renderCallback": "\\Chisel\\Helpers\\BlocksHelpers::acf_block_render"
  },
  "supports": {
    "anchor": true,
    "align": ["wide", "full"],
    "alignWide": true,
    "className": true,
    "customClassName": true,
    "multiple": true,
    "reusable": true
  },
  "ignoreScripts": ["script"],
  "script": "file:./script.js",
  "style": ["file:./style-script.css"]
}
```

`script.js` is the webpack entry that imports `style.scss` (which produces `style-script.css`). It is **CSS-only** — keep `ignoreScripts: ["script"]` so the empty JS handle isn't enqueued. Frontend behavior does NOT go here.

**With real frontend JS** (carousel init, animation, toggles, etc.) — add a `view.js` (`viewScript`); leave `script.js` as the CSS entry with `ignoreScripts` in place:

```json
{
  "script": "file:./script.js",
  "viewScript": "file:./view.js",
  "style": ["file:./style-script.css"],
  "viewStyle": ["file:./view.css"],
  "ignoreScripts": ["script"]
}
```

`viewStyle`/`view.css` is optional — add it only for frontend-only CSS (imported by `view.js`); shared styles stay in `style.scss`. **The block's JS lives in `view.js`, never in `src/scripts/modules/`** (that layer is for global/site-wide scripts). For ACF blocks always use `viewScript`, not `script`-as-JS: the editor renders the ACF field form, not the Twig output, so editor-loaded behavior has nothing to bind to. See [reference/blocks.md "Block JS/CSS keys"](.claude/chisel/reference/blocks.md#block-jscss-keys--what-each-file-is-for).

### {block-name}.twig

```twig
<div {{ wrapper_attributes }}>
  {% if fields.{field_name} is not empty %}
    <div class="b-{block-name}__inner">
      {% for item in fields.{repeater_field} %}
        <div class="b-{block-name}__item">{{ item.{sub_field} }}</div>
      {% endfor %}
    </div>
  {% else %}
    {% include 'partials/block-edit-button.twig' with {'block_name': '{block-name}'} %}
  {% endif %}
</div>
```

Available context (set by `BlocksHelpers::acf_block_render`):

- `{{ wrapper_attributes }}` — block wrapper HTML attrs
- `{{ fields }}` — all ACF fields from `get_fields()`
- `{{ block }}` — block data
- `{{ is_preview }}` — boolean
- `{{ slug }}` — block slug prefixed with `b-`
- `{{ post_id }}` — current post ID

Image helpers:

- `{{ get_responsive_image(fields.image_field, 'large') }}` — responsive `<img>` with srcset — **preferred for rendering images**
- `{{ get_image(fields.image_field) }}` — Timber image object (Timber built-in) — only when you need image properties (`.src`, `.width`, `.alt`), not a rendered tag

### style.scss

```scss
@use '~design' as *;

.b-{block-name} {
  // BEM naming
  // theme.json tokens via get-* helpers
}
```

### script.js (CSS entry — always)

```js
import './style.scss';
```

### view.js (frontend behavior — only when interactive)

Lives in the block; registered via `viewScript`. Never put this in `src/scripts/modules/`.

```js
class BlockName {
  constructor(element) {
    this.element = element;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const elements = document.querySelectorAll('.js-{block-name}');
  if (!elements.length) return;
  elements.forEach((el) => new BlockName(el));
});
```

Select on a `js-`-prefixed hook (`.js-{block-name}`), not the styling class — see [Conventions](#guidelines). For shared helpers (DOM utils, throttling) import from `src/scripts/modules/utils.js` rather than duplicating.

### acf-json/group\_{hash}.json

```json
{
  "key": "group_{hex_hash}",
  "title": "{Block Title} Fields",
  "fields": [
    {
      "key": "field_{hex_hash}",
      "label": "{Field Label}",
      "name": "{prefix}_{field_name}",
      "type": "{text|image|repeater|select|etc}",
      "required": 0
    }
  ],
  "location": [[{ "param": "block", "operator": "==", "value": "chisel/{block-name}" }]]
}
```

**Naming is a HARD RULE** — `key` = hex hash, filename = group key, `name` = block-initial prefix (WPML), `label` stays human. Full spec, derivation cases, and example: [reference/acf-naming.md](.claude/chisel/reference/acf-naming.md). Before finishing, run its "Mechanical check": key format, filename = key, EVERY field + sub-field name prefixed (no generic `mode`/`count`/`heading` names), and `modified` bumped.

Common field types: `text`, `textarea`, `wysiwyg`, `image` (return: `id`), `repeater` with `sub_fields`, `select`, `radio`, `true_false`, `link`, `group` with `sub_fields`.

## Validation defaults

Default `"required": 0` on all fields and `"min": 0` on repeaters. Required fields and min-row constraints fire validation errors in the editor when the block is first inserted (before the editor reads serialized data) — confusing for editors and blocks the page from saving. If a field is genuinely required, enforce it in Twig (skip rendering the card) rather than at the ACF layer.

## Default alignment

Add via `chisel_editor_scripts` filter inside `custom/app/WP/Assets.php` (the class is already registered in `custom/functions.php` via `get_instance()`). Use the class's existing `filter_hooks()` method — don't add hooks directly in `custom/functions.php` (see [CLAUDE.md "Architecture"](CLAUDE.md#architecture-core-vs-custom)):

```php
// custom/app/WP/Assets.php
public function filter_hooks(): void {
    add_filter( 'chisel_editor_scripts', array( $this, 'set_block_default_alignment' ) );
}

public function set_block_default_alignment( array $data ): array {
    $data['editor']['localize']['data']['blocksDefaultAlignment']['chisel/{block-name}'] = 'full';
    return $data;
}
```

## Guidelines

1. ACF field group JSON auto-loads from `src/blocks-acf/{block-name}/acf-json/`.
2. Always populate content via ACF fields in editor — never hardcode in Twig.
3. BEM class: `b-{block-name}`, `__element`, `--modifier`.
4. Use `partials/block-edit-button.twig` for empty state.
5. **Asset URLs in `style.scss` go through the `background-image()` mixin**, never raw `url('../../../assets/...')`. Webpack resolves `url()` from the bundle entry, not the partial; raw paths silently break the build. Drop assets flat into `assets/images/` and call `@include background-image('name', 'svg', $is-block: true)` from inside an ACF block — **`$is-block: true` is required** because blocks live one level deeper (`src/blocks-acf/{name}/`) than pattern SCSS (`src/styles/components/`). See `src/design/tools/_media.scss` for the mixin signature.
