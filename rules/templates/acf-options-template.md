# ACF Options Page Template

Registration code for an ACF Options page or sub-page, its Timber context wiring, and its field-group JSON. Which file and filter each belongs to: [file-locations.md](.claude/chisel/reference/file-locations.md#registrations-php). Naming rules: [acf-naming.md](.claude/chisel/reference/acf-naming.md). Procedure: [create-acf-options](.claude/skills/chisel-create-acf-options/SKILL.md).

## Register the page

`custom/app/WP/Acf.php` — top-level page:

```php
public function register_acf_options_pages( $options_pages ) {
    $options_pages[] = array(
        'menu_slug'  => '{menu-slug}',
        'page_title' => __( '{Page Title}', 'chisel' ),
    );
    return $options_pages;
}
```

Sub-page:

```php
public function register_acf_options_sub_pages( $options_sub_pages ) {
    $options_sub_pages[] = array(
        'menu_slug'   => '{sub-page-slug}',
        'page_title'  => __( '{Sub Page Title}', 'chisel' ),
        'menu_title'  => __( '{Menu Title}', 'chisel' ),
        'parent_slug' => '{parent-menu-slug}',
    );
    return $options_sub_pages;
}
```

## Add options to the Timber context

`custom/app/WP/Site.php` — once per project, not once per options page:

```php
public function filter_hooks(): void {
    add_filter( 'timber/context', array( $this, 'add_to_context' ), 11 );
    // ... existing hooks
}

public function add_to_context( array $context ): array {
    if ( function_exists( 'get_fields' ) ) {
        $context['options'] = get_fields( 'option' );
    }
    return $context;
}
```

Fields are then available in every template as `{{ options.field_name }}` — see [twig-templating.md "Global context"](.claude/chisel/reference/twig-templating.md#global-context-from-corewpsitephp).

## Field group JSON

**Naming is a HARD RULE** ([acf-naming.md](.claude/chisel/reference/acf-naming.md)): `key` (group + every field) = real ACF-style hex hash; **filename = group key** (`group_{hash}.json`) — human-readable keys break ACF's edit-in-UI → save-back sync. Field `name`s carry a page/section-slug prefix for WPML uniqueness (`header_cta_text`, `footer_logo`, `social_links`); sub-fields use the full parent name (`social_links_url`). `label` stays human.

`acf-json/group_{hash}.json`:

```json
{
  "key": "group_{hex_hash}",
  "title": "{Page Title} Fields",
  "fields": [
    {
      "key": "field_{hex_hash}",
      "label": "{Field Label}",
      "name": "{slug}_{field_name}",
      "type": "{text|image|repeater|select|etc}",
      "required": 0
    }
  ],
  "location": [[{ "param": "options_page", "operator": "==", "value": "{menu-slug}" }]],
  "menu_order": 0,
  "position": "normal",
  "style": "default",
  "label_placement": "top",
  "instruction_placement": "label",
  "hide_on_screen": "",
  "active": true
}
```

Tabs, for large field groups:

```json
{ "key": "field_{hash}", "label": "Header", "name": "", "type": "tab", "placement": "top" }
```

## Related

- Field-group naming, hex keys, `modified` bumping → [acf-naming.md](.claude/chisel/reference/acf-naming.md)
- Per-field WPML translation preferences → [acf-wpml-translation.md](.claude/chisel/reference/acf-wpml-translation.md)
- Which file and filter each registration uses → [file-locations.md](.claude/chisel/reference/file-locations.md#registrations-php)
- Writing values into the fields → [mcp-workflow.md](.claude/chisel/reference/mcp-workflow.md#acf-fields)
