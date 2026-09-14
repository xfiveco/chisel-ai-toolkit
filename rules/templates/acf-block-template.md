# ACF Block Template

File contents for `src/blocks-acf/{block-name}/`. Canonical reference: `src/blocks-acf/slider/`.
Required file list and the build-pipeline rule: [blocks.md "ACF Block"](.claude/chisel/reference/blocks.md#acf-block-srcblocks-acfname).
Procedure: [create-acf-block](.claude/skills/chisel-create-acf-block/SKILL.md).

## block.json

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

At full width the page rail pads the block's content back in line with the page; media that must touch the screen edge goes in an inner `<div class="b-{name}__inner alignfull">`, like the shipped slider: [blocks.md "Wide and full width"](.claude/chisel/reference/blocks.md#wide-and-full-width).

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

## {block-name}.twig

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

## style.scss

```scss
@use '~design' as *;

.b-{block-name} {
  // BEM naming
  // theme.json tokens via get-* helpers
}
```

## script.js (CSS entry — always)

```js
import './style.scss';
```

## view.js (frontend behavior — only when interactive)

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

Select on a `js-`-prefixed hook (`.js-{block-name}`), not the styling class — see [blocks.md "Block naming and classes"](.claude/chisel/reference/blocks.md#block-naming-and-classes). For shared helpers (DOM utils, throttling) import from `src/scripts/modules/utils.js` rather than duplicating.

## acf-json/group\_{hash}.json

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

## Related

- Field-group naming rules → [acf-naming.md](.claude/chisel/reference/acf-naming.md)
- Required file list, `ignoreScripts`, field-data shape → [blocks.md](.claude/chisel/reference/blocks.md)
- Custom React block file contents → [custom-block-template.md](.claude/chisel/templates/custom-block-template.md)
