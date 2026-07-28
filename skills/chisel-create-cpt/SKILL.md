---
name: chisel-create-cpt
description: Register a Custom Post Type (and optional taxonomy). Use when the design shows multiple instances of the same content shape (portfolio, team, case studies, services, events).
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

# Create Custom Post Type

**Run the CPT ladder in [reference/section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md#cpt-decision) first** — confirms a CPT is the right call (vs. ACF block / pattern / one-off page). This skill is the _how_; reference is the _what_.

## Rules

- **Always include `editor` in supports** (Gutenberg) unless explicitly told otherwise. `show_in_rest` must be `true` for Gutenberg.
- For WooCommerce products: don't create a CPT — use WooCommerce's built-in product type with ACF metaboxes.

## Procedure

Edit `custom/app/WP/CustomPostTypes.php`:

```php
public function register_custom_post_types( $post_types ) {
    $post_types['{slug}'] = array(
        'singular'      => __( '{Singular Name}', 'chisel' ),
        'plural'        => __( '{Plural Name}', 'chisel' ),
        'supports'      => array( 'editor', 'thumbnail', 'excerpt' ),
        'menu_icon'     => 'dashicons-{icon}',
        'hierarchical'  => false,
        'public'        => true,
        'has_archive'   => true,
        'menu_position' => 20,
        'rewrite'       => array( 'slug' => '{url-slug}' ),
    );

    return $post_types;
}
```

The `RegisterCustomPostType` factory handles labels, capabilities, REST, etc. `supports` merges with defaults: `title`, `page-attributes`, `revisions`, `author`.

## Taxonomy

```php
public function register_custom_taxonomies( $taxonomies ) {
    $taxonomies['{slug}'] = array(
        'singular'   => __( '{Singular Name}', 'chisel' ),
        'plural'     => __( '{Plural Name}', 'chisel' ),
        'post_types' => array( '{cpt-slug}' ),
        'public'     => true,
        'rewrite'    => array( 'slug' => '{url-slug}' ),
    );
    return $taxonomies;
}
```

## All CPT options

All `register_post_type()` options supported:

- `singular`, `plural` (required)
- `supports`, `menu_icon`, `menu_position`
- `hierarchical`, `public`, `publicly_queryable`, `exclude_from_search`
- `show_ui`, `show_in_menu`, `show_in_nav_menus`, `show_in_admin_bar`
- `show_in_rest` (default: true)
- `has_archive`, `rewrite`, `capability_type`, `capabilities`
- `template`, `template_lock` (default block layout)
- `taxonomies`, `labels`

## Block template (default layout)

```php
'template' => array(
    array( 'core/heading', array( 'level' => 2, 'placeholder' => 'Add title...' ) ),
    array( 'core/paragraph', array( 'placeholder' => 'Add description...' ) ),
    array( 'core/image' ),
),
'template_lock' => false, // or 'all' / 'insert'
```

## Templates (only if user asks)

- `views/single-{slug}.twig` — single item
- `views/archive-{slug}.twig` — archive
- `single-{slug}.php` + `archive-{slug}.php` in theme root

By default, WordPress falls back to `single.php` / `archive.php` — usually sufficient.

## After registering

Flush permalinks: Settings > Permalinks > Save (no changes needed, just save).

## Pair with a custom block (display on homepage / any page)

When a CPT needs to appear on the homepage or other pages (latest N, manually-selected), DO NOT use an ACF repeater — use a CPT-driven block with variant modes:

1. **Seed CPT entries** via `xfive-posts-post-create` (`post_type: "case-study"`, populate title, featured image, excerpt, ACF fields).
2. **Optional custom Timber\Post class** at `custom/app/Timber/{ChiselCpt}.php` if the CPT needs custom methods; map it in `custom/app/WP/Site.php` `post_classmap` (`'case-study' => \Chisel\Timber\Custom\CaseStudy::class`).
3. **Custom block** (`chisel/{cpt-plural}`) with fields:
   - `mode` (select): `latest` | `selected`
   - `count` (number): only shown when mode=latest (ACF conditional logic)
   - `selected_items` (relationship to CPT): only shown when mode=selected
   - Plus presentation fields (heading, closing text, CTA link)
4. **Query inside filter hook** via `chisel_timber_acf_blocks_data_{slug}` (applied by `BlocksHelpers::acf_block_render` for every ACF block). Create `custom/app/WP/AcfBlocksData.php` — class `Chisel\WP\Custom\AcfBlocksData` with the `HooksSingleton` trait — if the project doesn't have it yet (the starter doesn't ship one), and register the filter in its `filter_hooks()` — **never in `custom/functions.php`** (see [CLAUDE.md "Architecture"](CLAUDE.md#architecture-core-vs-custom)):

   ```php
   // custom/app/WP/AcfBlocksData.php
   public function filter_hooks(): void {
       add_filter( 'chisel_timber_acf_blocks_data_case-studies', array( $this, 'case_studies' ) );
       // ...register more block-data filters here
   }

   public function case_studies( array $context ): array {
       $fields = $context['fields'] ?? array();
       $mode   = $fields['mode'] ?? 'latest';
       $args   = array(
           'post_type'     => 'case-study',
           'post_status'   => 'publish',
           'no_found_rows' => true,
       );
       if ( $mode === 'selected' && ! empty( $fields['selected_items'] ) ) {
           $args['post__in']       = array_map( 'intval', (array) $fields['selected_items'] );
           $args['orderby']        = 'post__in';
           $args['posts_per_page'] = -1;
       } else {
           $args['posts_per_page'] = max( 1, (int) ( $fields['count'] ?? 3 ) );
       }
       $context['posts'] = Timber::get_posts( $args );
       return $context;
   }
   ```

   Bootstrap it once in `custom/functions.php`: `\Chisel\WP\Custom\AcfBlocksData::get_instance();` (skip if the line already exists).

5. **Twig loops `posts`** (not `fields.items`). Use `post.thumbnail`, `post.title`, `post.excerpt`, `post.link` — no data duplication between homepage and archive.
