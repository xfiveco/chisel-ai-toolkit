# Block Mod Template

JS scaffold for `src/scripts/editor/mods/{block-name}-{feature}.js`.

Follows the pattern in `src/scripts/editor/mods/core.js` (disableBottomMargin).

```js
import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { Fragment } from '@wordpress/element';

// Step 1: Register the attribute
addFilter('blocks.registerBlockType', 'chisel/{feature-name}-attribute', (settings, name) => {
  if (name !== 'core/{block-name}') return settings;

  if (typeof settings.attributes !== 'undefined') {
    settings.attributes = {
      ...settings.attributes,
      {attributeName}: {
        type: 'boolean',
        default: false,
      },
    };
  }
  return settings;
});

// Step 2: Add the UI control
const add{FeatureName}Toggle = createHigherOrderComponent((BlockEdit) => {
  return (props) => {
    const { attributes, setAttributes, isSelected, name } = props;

    if (name !== 'core/{block-name}') {
      return <BlockEdit {...props} />;
    }

    const { {attributeName} = false, className = '' } = attributes;

    const onToggle = (checked) => {
      let newClassName = className.replace(/\b{css-class}\b/, '').trim();
      if (checked) {
        newClassName = `${newClassName} {css-class}`.trim();
      }
      setAttributes({
        {attributeName}: checked,
        className: newClassName,
      });
    };

    return (
      <Fragment>
        <BlockEdit {...props} />
        {isSelected && (
          <InspectorControls>
            <PanelBody title={__('{Panel Title}', 'chisel')}>
              <ToggleControl
                label={__('{Toggle Label}', 'chisel')}
                help={__('{Help text}', 'chisel')}
                checked={!!{attributeName}}
                onChange={onToggle}
              />
            </PanelBody>
          </InspectorControls>
        )}
      </Fragment>
    );
  };
}, 'add{FeatureName}Toggle');

addFilter('editor.BlockEdit', 'chisel/{feature-name}-toggle', add{FeatureName}Toggle);
```

## Control types beyond ToggleControl

- `SelectControl` — dropdown of options
- `TextControl` — text input
- `RangeControl` — slider for numbers
- `ColorPalette` — color picker
- `BaseControl` — generic wrapper for custom controls

All from `@wordpress/components`.

## Register on multiple blocks

Replace the single `name !== 'core/{block-name}'` check with an allowlist:

```js
const targetBlocks = ['core/heading', 'core/paragraph', 'core/group'];
if (!targetBlocks.includes(name)) return settings;
```

## Register on all Chisel blocks

```js
if (!name.startsWith('core/') && !name.startsWith('chisel/')) return settings;
```
