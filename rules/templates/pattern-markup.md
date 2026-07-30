# Pattern Markup Reference

WordPress block grammar for common pattern building blocks, plus the two files every pattern needs. Copy and adapt. Always call `xfive-blocks-block-schema` on a block before writing markup for it — attribute names matter. Procedure: [create-pattern](.claude/skills/chisel-create-pattern/SKILL.md).

## Pattern file scaffold

`patterns/{slug}.php`:

```php
<?php
/**
 * Title: {Pattern Title}
 * Slug: chisel/{slug}
 * Categories: chisel-patterns/{category}
 * Description: {Description}
 * Keywords: {keyword1}, {keyword2}
 *
 * @package Chisel
 */

?>

<!-- block markup here — see the sections below -->
```

`src/styles/patterns/_{slug}.scss`, scoped under `.p-{slug}`:

```scss
@use '~design' as *;

.p-{slug} {
  // scoped styles only
}
```

Breakpoints: `@include bp('large') { ... }`, `@include bp-down('medium') { ... }`.

The filename is unprefixed — the `patterns/` folder already provides the context (never `_p-{slug}.scss`); the `p-` prefix belongs to the CSS class only. Slug, filename, root class and SCSS scope must all match: [blocks.md "Root wrapper rule"](.claude/chisel/reference/blocks.md#root-wrapper-rule). The SCSS index is auto-generated — never edit `src/styles/patterns/_index.scss` by hand.

## Root wrappers

**Group (constrained, no bg):**

```html
<!-- wp:group {"metadata":{"name":"{Pattern Title}"},"align":"full","className":"p-{slug}","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull p-{slug}">
  <!-- inner blocks -->
</div>
<!-- /wp:group -->
```

**Group (flex, vertical):**

```html
<!-- wp:group {"metadata":{"name":"{Pattern Title}"},"align":"full","className":"p-{slug}","layout":{"type":"flex","orientation":"vertical","justifyContent":"center"}} -->
<div class="wp-block-group alignfull p-{slug}">
  <!-- inner blocks -->
</div>
<!-- /wp:group -->
```

**Cover (full-width with bg):**

```html
<!-- wp:cover {"metadata":{"name":"{Pattern Title}"},"overlayColor":"foreground","isUserOverlayColor":true,"align":"full","layout":{"type":"constrained"}} -->
<div class="wp-block-cover alignfull">
  <span
    aria-hidden="true"
    class="wp-block-cover__background has-foreground-background-color has-background-dim-100 has-background-dim"
  ></span>
  <div class="wp-block-cover__inner-container">
    <!-- inner blocks -->
  </div>
</div>
<!-- /wp:cover -->
```

**Cover overlays: preset slug only** — always `"overlayColor":"{slug}"`; never `customOverlayColor` with a raw hex. No matching palette slug? Add the token to theme.json first.

## Text

**Heading (levels 1-6):**

```html
<!-- wp:heading {"textAlign":"center","level":2} -->
<h2 class="wp-block-heading has-text-align-center">Heading Text</h2>
<!-- /wp:heading -->
```

**Paragraph with font size:**

```html
<!-- wp:paragraph {"align":"center","fontSize":"large"} -->
<p class="has-text-align-center has-large-font-size">Paragraph text.</p>
<!-- /wp:paragraph -->
```

## Layout

**Columns:**

```html
<!-- wp:columns -->
<div class="wp-block-columns">
  <!-- wp:column -->
  <div class="wp-block-column"><!-- column content --></div>
  <!-- /wp:column -->
  <!-- wp:column -->
  <div class="wp-block-column"><!-- column content --></div>
  <!-- /wp:column -->
</div>
<!-- /wp:columns -->
```

**Spacer (use Chisel styles):**

```html
<!-- wp:spacer {"height":"auto","className":"is-style-large"} -->
<div style="height:auto" aria-hidden="true" class="wp-block-spacer is-style-large"></div>
<!-- /wp:spacer -->
```

Available `is-style-*` sizes come from `registerSpacerStyles()` in `src/scripts/editor/blocks-styles.js` — read it for the current list. The Figma px → style mapping is in [reference/design-tokens.md "Spacing between blocks"](.claude/chisel/reference/design-tokens.md#spacing-between-blocks). **Every spacer must carry an explicit `is-style-*` class — never seed a bare `{"height":"auto"}` spacer**, even when the default size is intended.

## Media

Two surfaces, two image sources: **seeded pages** (written via MCP) use attachment IDs + upload URLs from `xfive-media-media-upload`, as below. **Pattern source files** (`patterns/*.php`) must instead reference theme-shipped placeholders (`get_stylesheet_directory_uri()` + `assets/images/placeholders/…`, no `id` attr) — attachment IDs don't exist on other installs, and `src=""` ships a broken pattern. See create-pattern guideline 9.

**Image (with attachment ID):**

```html
<!-- wp:image {"id":93,"align":"wide","sizeSlug":"full","linkDestination":"none"} -->
<figure class="wp-block-image alignwide size-full">
  <img
    src="http://example.test/wp-content/uploads/.../image.png"
    alt="Alt text"
    class="wp-image-93"
  />
</figure>
<!-- /wp:image -->
```

**SVG image (explicit width/height required):**

```html
<!-- wp:image {"id":94,"width":"98px","height":"27px","sizeSlug":"full","linkDestination":"none"} -->
<figure class="wp-block-image size-full is-resized">
  <img
    src="http://example.test/wp-content/uploads/.../logo.svg"
    alt="Logo"
    class="wp-image-94"
    style="width:98px;height:27px"
  />
</figure>
<!-- /wp:image -->
```

## Buttons

**Button group:**

```html
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
<div class="wp-block-buttons">
  <!-- wp:button {"className":"is-style-primary"} -->
  <div class="wp-block-button is-style-primary">
    <a class="wp-block-button__link wp-element-button" href="#">Button Text</a>
  </div>
  <!-- /wp:button -->
</div>
<!-- /wp:buttons -->
```

**With icon:**

```html
<!-- wp:button {"className":"is-style-primary has-icon has-icon-arrow-right","buttonIcon":"arrow-right"} -->
<div class="wp-block-button is-style-primary has-icon has-icon-arrow-right">
  <a class="wp-block-button__link wp-element-button" href="#">Text</a>
</div>
<!-- /wp:button -->
```

**With size variant:**

```html
<!-- wp:button {"className":"is-style-primary is-size-large"} -->
<div class="wp-block-button is-style-primary is-size-large">
  <a class="wp-block-button__link wp-element-button">Large CTA</a>
</div>
<!-- /wp:button -->
```

## Composed examples

### Hero (Cover + spacers + heading + paragraph + buttons)

Full hero section with overlay color, top/bottom spacers, centered headline, lead paragraph, and CTA pair. Adjust `overlayColor`, `contentSize`/`wideSize`, spacer sizes, and copy.

> **Raw px in `layout` attrs is the one sanctioned exception** to the no-hardcoded-widths rule — Gutenberg layout attributes cannot reference theme.json presets. Prefer omitting `contentSize`/`wideSize` so the block inherits the global sizes; set explicit px only when the section genuinely differs. In SCSS the rule stands: widths go through tokens ([design-tokens.md "Width-token decision ladder"](.claude/chisel/reference/design-tokens.md#width-token-decision-ladder)).

```html
<!-- wp:cover {"overlayColor":"foreground","isUserOverlayColor":true,"align":"full","disableBottomMargin":true,"className":"u-no-margin-bottom","layout":{"type":"constrained","contentSize":"848px","wideSize":"1072px"}} -->
<div class="wp-block-cover alignfull u-no-margin-bottom">
  <span
    aria-hidden="true"
    class="wp-block-cover__background has-foreground-background-color has-background-dim-100 has-background-dim"
  ></span>
  <div class="wp-block-cover__inner-container">
    <!-- wp:spacer {"height":"auto","className":"is-style-big"} -->
    <div style="height:auto" aria-hidden="true" class="wp-block-spacer is-style-big"></div>
    <!-- /wp:spacer -->

    <!-- wp:heading {"textAlign":"center","level":1} -->
    <h1 class="wp-block-heading has-text-align-center">Headline</h1>
    <!-- /wp:heading -->

    <!-- wp:paragraph {"align":"center","fontSize":"large"} -->
    <p class="has-text-align-center has-large-font-size">Lead paragraph.</p>
    <!-- /wp:paragraph -->

    <!-- wp:spacer {"height":"auto","className":"is-style-large"} -->
    <div style="height:auto" aria-hidden="true" class="wp-block-spacer is-style-large"></div>
    <!-- /wp:spacer -->

    <!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
    <div class="wp-block-buttons">
      <!-- wp:button {"className":"is-style-primary has-icon has-icon-arrow-right","buttonIcon":"arrow-right"} -->
      <div class="wp-block-button is-style-primary has-icon has-icon-arrow-right">
        <a class="wp-block-button__link wp-element-button" href="#">Get started</a>
      </div>
      <!-- /wp:button -->

      <!-- wp:button {"className":"is-style-primary-outline"} -->
      <div class="wp-block-button is-style-primary-outline">
        <a class="wp-block-button__link wp-element-button">Learn more</a>
      </div>
      <!-- /wp:button -->
    </div>
    <!-- /wp:buttons -->

    <!-- wp:spacer {"height":"auto","className":"is-style-big"} -->
    <div style="height:auto" aria-hidden="true" class="wp-block-spacer is-style-big"></div>
    <!-- /wp:spacer -->
  </div>
</div>
<!-- /wp:cover -->
```

### Media + text (image on the left or right)

Use `core/media-text` for image-beside-content sections (feature rows). Image left is default; add `"mediaPosition":"right"` to flip. `mediaId` is the attachment ID returned by `xfive-media-media-upload`.

**Image left:**

```html
<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|100","bottom":"var:preset|spacing|100"}}},"backgroundColor":"primary","layout":{"type":"default"}} -->
<div
  class="wp-block-group alignfull has-primary-background-color has-background"
  style="padding-top:var(--wp--preset--spacing--100);padding-bottom:var(--wp--preset--spacing--100)"
>
  <!-- wp:media-text {"mediaId":217,"mediaType":"image","mediaSizeSlug":"large","disableBottomMargin":true,"className":"u-no-margin-bottom"} -->
  <div class="wp-block-media-text is-stacked-on-mobile u-no-margin-bottom">
    <figure class="wp-block-media-text__media">
      <img src="..." alt="" class="wp-image-217 size-large" />
    </figure>
    <div class="wp-block-media-text__content">
      <!-- wp:heading {"level":3} -->
      <h3 class="wp-block-heading">Feature heading</h3>
      <!-- /wp:heading -->

      <!-- wp:paragraph -->
      <p>Feature description.</p>
      <!-- /wp:paragraph -->
    </div>
  </div>
  <!-- /wp:media-text -->
</div>
<!-- /wp:group -->
```

**Image right:** add `"mediaPosition":"right"` to the `media-text` attrs; the wrapper class becomes `has-media-on-the-right`.

### Query Loop (dynamic posts)

For sections that pull live content (blog feed, latest case studies hardcoded onto a page). Use `core/query` + `core/post-template` with featured-image / date / title child blocks. Adjust `postType`, `perPage`, `orderBy`.

```html
<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|100","bottom":"var:preset|spacing|100"}}},"layout":{"type":"constrained"}} -->
<div
  class="wp-block-group alignfull"
  style="padding-top:var(--wp--preset--spacing--100);padding-bottom:var(--wp--preset--spacing--100)"
>
  <!-- wp:heading -->
  <h2 class="wp-block-heading">Latest posts</h2>
  <!-- /wp:heading -->

  <!-- wp:query {"queryId":3,"query":{"perPage":3,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","inherit":false}} -->
  <div class="wp-block-query">
    <!-- wp:post-template {"layout":{"type":"grid","columnCount":3,"minimumColumnWidth":null}} -->
    <!-- wp:post-featured-image /-->

    <!-- wp:post-date /-->

    <!-- wp:post-title /-->
    <!-- /wp:post-template -->

    <!-- wp:query-pagination -->
    <!-- wp:query-pagination-previous /-->
    <!-- wp:query-pagination-numbers /-->
    <!-- wp:query-pagination-next /-->
    <!-- /wp:query-pagination -->

    <!-- wp:query-no-results -->
    <!-- wp:paragraph -->
    <p>No results.</p>
    <!-- /wp:paragraph -->
    <!-- /wp:query-no-results -->
  </div>
  <!-- /wp:query -->
</div>
<!-- /wp:group -->
```

For CPT feeds (case studies, team), set `"postType":"case-study"` (etc.). For "manually selected N items" use a custom CPT-driven block instead — see [create-cpt](.claude/skills/chisel-create-cpt/SKILL.md) "Pair with a custom block".

## Custom blocks in patterns

```html
<!-- wp:chisel/accordion {"closeOthers":true,"firstOpen":true} -->
<div class="wp-block-chisel-accordion b-accordion js-accordion has-close-others has-first-open">
  <!-- wp:chisel/accordion-item {"title":"Question 1"} -->
  <!-- inner content -->
  <!-- /wp:chisel/accordion-item -->
</div>
<!-- /wp:chisel/accordion -->
```

## Design token preset classes

- Colors: `has-primary-color`, `has-foreground-background-color`, `has-secondary-background-color`
- Font sizes: `has-large-font-size`, `has-extra-large-font-size`, `has-huge-font-size`
- Alignment: `has-text-align-center`, `alignfull`, `alignwide`
- Button styles: `is-style-primary`, `is-style-secondary`, `is-style-primary-outline`, `is-style-secondary-outline`
