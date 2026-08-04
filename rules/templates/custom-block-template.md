# Custom Block Template

File structure for `src/blocks/{block-name}/`. Canonical reference: `assets/example-blocks/blocks/example/`.

## block.json

Start lean. This is the shape of the shipped `chisel/accordion` block — `index.js` imports `style.scss`, so `style` is a single string and there is **no `script.js`**:

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "chisel/{block-name}",
  "version": "1.0.0",
  "title": "{Block Title}",
  "category": "chisel-blocks",
  "icon": "{dashicon-name}",
  "description": "{description}",
  "example": {},
  "supports": { "html": false },
  "textdomain": "chisel",
  "attributes": {},
  "editorScript": "file:./index.js",
  "editorStyle": "file:./index.css",
  "style": "file:./style-index.css",
  "viewScript": "file:./view.js"
}
```

- **`script.js` is optional on a native block** — unlike an ACF block, where it is the only entry. Add it only to also bundle the shared CSS under the `script` key, or to run JS in the editor canvas. If you do, `style.scss` gets imported by two entries, webpack emits two files, and `style` becomes `["file:./style-index.css", "file:./style-script.css"]` with `"ignoreScripts": ["script"]` while `script.js` is SCSS-only.
- Drop `viewScript` if the block has no frontend JS; add `"viewStyle": "file:./view.css"` only for frontend-only CSS imported by `view.js`.
- Add `"providesContext"` / `"usesContext"` for parent-child relationships.
- Add `"parent": ["chisel/parent-block"]` for child-only blocks.
- For server-rendered blocks: add `"render": "file:./render.php"` and remove `save.js`.

## index.js

```js
import { registerBlockType } from '@wordpress/blocks';
import './style.scss';
import Edit from './edit';
import save from './save';
import metadata from './block.json';

registerBlockType(metadata.name, { edit: Edit, save });
```

Import and register child blocks here too if needed.

## edit.js (pattern)

Follow `src/blocks/accordion/edit.js`:

- `@wordpress/block-editor`: `useBlockProps`, `InspectorControls`, `InnerBlocks`
- `@wordpress/components`: `PanelBody`, `ToggleControl`, `SelectControl`
- `@wordpress/element`: `Fragment`
- Import `'./editor.scss'`
- For InnerBlocks with custom appender: `RenderAppender` from `../../scripts/editor/components/RenderAppender.js`
- For block selection indicator: `BlockEditSelector` from `../../scripts/editor/components/BlockEditSelector.js`
- Put block settings in `<InspectorControls>` sidebar

## save.js

```js
import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';

export default function save(props) {
  const { attributes } = props;
  const classNames = ['b-{block-name}'];
  // Add conditional classes from attributes

  return (
    <div {...useBlockProps.save({ className: classNames.join(' ') })}>
      {/* static markup or <InnerBlocks.Content /> */}
    </div>
  );
}
```

## view.js (class-based)

```js
class BlockName {
  constructor(element) {
    this.element = element;
    this.initSelectors();
    this.initElements();
    this.initClassNames();
    // initialize behavior
  }

  initSelectors() {
    this.selectors = {
      /* js-* prefixed */
    };
  }

  initElements() {
    this.elements = {
      /* cache DOM queries */
    };
  }

  initClassNames() {
    this.classNames = {
      /* is-*, has-* */
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const elements = document.querySelectorAll('.js-{block-name}');
  if (!elements.length) return;
  elements.forEach((el) => new BlockName(el));
});
```

## script.js (optional on native blocks)

Only needed when the shared CSS must also exist as `style-script.css`, or when the block needs JS running in the editor canvas. `index.js` already imports `style.scss` — the shipped `chisel/accordion` block ships no `script.js` at all.

```js
import './style.scss';
```

Add real frontend JS here only if needed AND drop `"ignoreScripts": ["script"]` from `block.json`. Otherwise keep it SCSS-only — `view.js` is the place for frontend behavior.

## style.scss

```scss
@use '~design' as *;

.wp-block-chisel-{block-name} {
  // BEM: .b-{block-name}, __element, --modifier
  // Use design tool helpers: get-color, get-gap, etc.
}
```

## view.scss (optional — frontend-only styles)

```scss
@use '~design' as *;

.wp-block-chisel-{block-name} {
  // frontend-only overrides
}
```

## editor.scss

```scss
@use '~design' as *;

.wp-block-chisel-{block-name} {
  // editor-only styles
}
```

## init.php (optional, for REST/MCP validation of child blocks)

```php
<?php
if ( ! is_admin() && ! \WP_Block_Type_Registry::get_instance()->is_registered( 'chisel/{child-block}' ) ) {
    register_block_type( 'chisel/{child-block}', array(
        'api_version' => 3,
        'title'       => '{Child Block Title}',
        'category'    => 'chisel-blocks',
        'parent'      => array( 'chisel/{parent-block}' ),
        'attributes'  => array(),
        'supports'    => array( 'html' => false ),
    ) );
}
```
