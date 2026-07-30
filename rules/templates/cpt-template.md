# Custom Post Type Template

Registration code for CPTs and taxonomies. Option inventory and constraints: [cpt.md](.claude/chisel/reference/cpt.md). Whether a CPT is the right call at all: [section-mapping-decisions.md "CPT decision"](.claude/chisel/reference/section-mapping-decisions.md#cpt-decision). Procedure: [create-cpt](.claude/skills/chisel-create-cpt/SKILL.md).

## Post type

`custom/app/WP/CustomPostTypes.php`:

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

## Taxonomy

Same file:

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

## Block template (default editor layout)

Seeds the editor with a starting block set for every new entry:

```php
'template' => array(
    array( 'core/heading', array( 'level' => 2, 'placeholder' => 'Add title...' ) ),
    array( 'core/paragraph', array( 'placeholder' => 'Add description...' ) ),
    array( 'core/image' ),
),
'template_lock' => false, // or 'all' / 'insert'
```

## CPT-driven block data filter

For a block that lists CPT entries on a page (latest N or manually selected). `BlocksHelpers::acf_block_render` applies `chisel_timber_acf_blocks_data_{slug}` for every ACF block. Create `custom/app/WP/AcfBlocksData.php` — class `Chisel\WP\Custom\AcfBlocksData` with the `HooksSingleton` trait — if the project doesn't have it yet (the starter doesn't ship one), and register the filter in its `filter_hooks()`, **never in `custom/functions.php`** (see [CLAUDE.md "Architecture"](CLAUDE.md#architecture-core-vs-custom)):

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

Custom `Timber\Post` class, when the CPT needs its own methods: `custom/app/Timber/{ChiselCpt}.php`, mapped in `custom/app/WP/Site.php`'s `post_classmap` — `'case-study' => \Chisel\Timber\Custom\CaseStudy::class`.

## Related

- Every supported option, `supports` defaults, the Gutenberg requirement → [cpt.md](.claude/chisel/reference/cpt.md)
- The block that consumes this filter → [acf-block-template.md](.claude/chisel/templates/acf-block-template.md)
- Where the registration file lives and which filter it uses → [file-locations.md](.claude/chisel/reference/file-locations.md#registrations-php)
- CPT single/archive templates → [twig-templating.md](.claude/chisel/reference/twig-templating.md#template-hierarchy)
