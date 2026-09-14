# Twig Templating

Template hierarchy, the global Timber context, registered Twig functions, and the custom Timber class map. Owns **how templates are structured and what data they can reach**. Does **not** own Twig syntax conventions such as "never raw PHP in Twig" ([coding-conventions.md](.claude/chisel/reference/coding-conventions.md#twig-rules)), the icon system's internals ([assets-and-scripts.md](.claude/chisel/reference/assets-and-scripts.md#icon-system)), or block template file structure ([blocks.md](.claude/chisel/reference/blocks.md)).

## Hard rules

1. **All Twig templates live in `views/`** — `custom/views/` exists but is unused (legacy); `custom/` is for PHP only. Edit `views/` directly. → [Template hierarchy](#template-hierarchy)
2. **Logic keyed on a single post/product/term goes as a method on its Timber class**, not a `fn(post)` Twig function. → [Per-post logic → method on the Timber class](#per-post-logic--method-on-the-timber-class-hard-rule)
3. **Breadcrumbs are already rendered on every page** by the `breadcrumbs` block in `views/base.twig` — never hand-roll them, and don't call `breadcrumbs()` again in a child template. → [Base layout](#base-layout)
4. **Request the smallest image size that fits the render width** — never `full` unless you genuinely need the original. → [Uploaded images](#uploaded-images)
5. **Twig autoescapes HTML** — anything that is intentionally markup needs `|raw`. → [Autoescaping](#autoescaping)

## Template hierarchy

All templates extend `views/base.twig` (html, head, header, main, footer).

| WordPress Route | PHP Entry         | Twig Template                             |
| --------------- | ----------------- | ----------------------------------------- |
| Page            | `page.php`        | `views/page.twig` (extends `single.twig`) |
| Single post     | `single.php`      | `views/single.twig`                       |
| Archive         | `archive.php`     | `views/archive.twig`                      |
| Index/blog      | `index.php`       | `views/index.twig`                        |
| Search          | `search.php`      | `views/search.twig`                       |
| 404             | `404.php`         | `views/404.twig`                          |
| Author          | `author.php`      | `views/author.twig`                       |
| WooCommerce     | `woocommerce.php` | `views/woocommerce/*.twig`                |

**CPTs need no templates by default.** WordPress falls back to `single.php` / `archive.php`, which is usually sufficient. Add `views/single-{slug}.twig` / `views/archive-{slug}.twig` (plus `single-{slug}.php` / `archive-{slug}.php` in the theme root) only when a CPT genuinely needs its own layout.

An `archive-{slug}.php` you add must set `$context['load_more'] = LoadMoreHelpers::get_context();` like the shipped controllers do, or the "Load more" button silently becomes page links: [rest-api.md "Built-in endpoint"](.claude/chisel/reference/rest-api.md#built-in-endpoint).

Also in `views/` but outside the route table: `single-password.twig`, `page-plugin.twig`, `sidebar-blog.twig`, `sidebar-woocommerce.twig`.

## Base layout

`views/base.twig` defines six overridable blocks:

```twig
{% block head %}          → extra <head> output (empty by default)
{% block header %}        → views/components/header.twig
<main id="main" class="o-wrapper">
  {% block breadcrumbs %} → breadcrumbs(), already on every page
  {% block content %}     → filled by child templates
</main>
{% block footer %}        → views/components/footer.twig
{% block foot %}          → extra pre-</body> output (empty by default)
```

To inject markup without overriding a block, hook `chisel_after_wp_head` or `chisel_after_wp_footer`.

## Autoescaping

`core/WP/Twig.php` sets `autoescape = 'html'`, so **every** `{{ }}` is escaped. Anything that is intentionally markup needs `|raw`:

```twig
{{ post.title|raw }}
{{ post.excerpt({words: 20})|raw }}
{{ post.get_thumbnail()|raw }}
```

Custom Twig functions that return HTML — `get_icon`, `get_responsive_image`, `breadcrumbs`, `comments_template` — are registered with `is_safe => html` and need no `|raw`. Forgetting it elsewhere fails silently: the tags render as visible text.

**A project function that returns HTML must be registered the same way.** `register_function()` takes the Twig options as its fourth argument; without `is_safe` every call site needs `|raw`, and the one that forgets prints tags:

```php
add_action( 'chisel_twig_register_functions', function ( $twig, $twig_instance ) {
    $twig_instance->register_function( $twig, 'my_card', array( MyClass::class, 'render_card' ), array( 'is_safe' => array( 'html' ) ) );
}, 10, 2 );
```

Functions that return plain text (a class string, a count) stay unmarked so they keep being escaped.

## Global context (from `core/WP/Site.php`)

| Variable          | Type          | Source                                                               |
| ----------------- | ------------- | -------------------------------------------------------------------- |
| `logo`            | string (HTML) | `Components::get_logo()` — responsive custom logo                    |
| `menus`           | array         | All registered nav menus                                             |
| `sidebar`         | array         | Auto-detects blog/woo context                                        |
| `copyright`       | array         | `chisel-sidebar-copyright` widget area (`copyright.content`)         |
| `footer_sidebars` | array         | `columns` — whichever of `chisel-sidebar-footer-1..4` have widgets; `column_class` — an `o-layout__item--*` class chosen by how many are populated |
| `the_title`       | array         | Page/archive title + class                                           |
| `options`         | array         | **Not set by the theme.** Add it on `timber/context` yourself if the project needs ACF Options in every template |

## Custom Twig functions (from `core/WP/Twig.php`)

| Function                                | Purpose                                                                                                                                                     |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get_nav_menu(name)`                    | Get menu by location (strips `chisel_` prefix)                                                                                                              |
| `get_responsive_image(id, size, attrs)` | Responsive `<img>` with srcset                                                                                                                              |
| `get_icon(args)`                        | Render icon — see [assets-and-scripts.md](.claude/chisel/reference/assets-and-scripts.md)                                                                   |
| `should_use_icons_module()`             | Check `CHISEL_USE_ICONS_MODULE`                                                                                                                             |
| `bem(name, ...modifiers)`               | Generate BEM class string                                                                                                                                   |
| `post_classes(classes, prefix)`         | Transform post classes to BEM                                                                                                                               |
| `breadcrumbs()`                         | Yoast breadcrumbs (empty string if Yoast inactive). Style via `.c-breadcrumbs` in `src/styles/vendor/_breadcrumbs.scss`. Always use this — never hand-roll. |
| `comments_template()`                   | WordPress comments block                                                                                                                                    |
| `slider_prepare_params(params)`         | Prepare ACF slider data                                                                                                                                     |
| `timber_set_product(post)`              | Set the global WooCommerce `$product` from a Timber post                                                                                                    |

Extend via `chisel_twig_register_functions` / `chisel_twig_register_filters` / `chisel_twig_register_tests` hooks in `custom/app/WP/Twig.php`. A function that returns markup is registered with `is_safe` — see [Autoescaping](#autoescaping).

## Common patterns

### Call PHP/WordPress functions

```twig
{{ function('wp_head') }}
{{ function('get_stylesheet_directory_uri') }}
{{ function('home_url', '/about') }}
{{ function('wp_get_attachment_image', image_id, 'large') }}
```

### Static assets

```twig
<img src="{{ theme.link }}/assets/images/logo.svg" alt="Logo">
{# or #}
<img src="{{ function('get_stylesheet_directory_uri') }}/assets/images/logo.svg" alt="Logo">
```

### Uploaded images

```twig
{{ get_responsive_image(image_id, 'large', { class: 'c-hero__image', alt: 'Hero' }) }}
```

**Size:** smallest that fits render width. `thumbnail` (150px) for avatars/small logos, `medium` (300px) for cards/grid logos, `large` (1024px) for heroes. Never `full` unless you need the original.

### Icons

```twig
{{ get_icon({ name: 'arrow', alt: 'Next' }) }}
{{ get_icon({ name: 'arrow', inline: true }) }}
```

### Nav menus

```twig
{% set main_nav = get_nav_menu('main_nav') %}
{% for item in main_nav.items %}
  <a href="{{ item.link }}">{{ item.title }}</a>
{% endfor %}
```

### BEM classes

```twig
<div class="{{ bem('card', 'featured', 'large') }}">
{# outputs: card card--featured card--large #}
```

## Timber built-ins

| Twig                                   | Equivalent PHP                   |
| -------------------------------------- | -------------------------------- |
| `{{ site.url }}` / `{{ site.link }}`   | `home_url()`                     |
| `{{ site.title }}`                     | `get_bloginfo('name')`           |
| `{{ site.charset }}`                   | `get_bloginfo('charset')`        |
| `{{ theme.link }}` / `{{ theme.uri }}` | `get_stylesheet_directory_uri()` |
| `{{ theme.path }}`                     | `get_stylesheet_directory()`     |
| `{{ theme.parent.link }}`              | `get_template_directory_uri()`   |
| `{{ post.link }}`                      | `get_permalink()`                |
| `{{ post.content }}`                   | `the_content()`                  |
| `{{ post.title }}`                     | `the_title()`                    |

## Custom Timber classes

Located in `core/Timber/`:

| Class                   | Extends        | Purpose                                                  |
| ----------------------- | -------------- | -------------------------------------------------------- |
| `ChiselPost`            | `Timber\Post`  | Base post — adds `get_thumbnail()` with srcset + caching |
| `ChiselProduct`         | `ChiselPost`   | WooCommerce product                                      |
| `ChiselTerm`            | `Timber\Term`  | Base term                                                |
| `ChiselProductCategory` | `ChiselTerm`   | Product category                                         |
| `ChiselImage`           | `Timber\Image` | Attachment image                                         |
| `Components`            | —              | Static helpers behind the global context (`get_logo()`, `get_menus()`, `get_sidebar()`, `get_icon()`) — not a Timber subclass |

Class mapping, both in `core/WP/Site.php`:

- **Posts** (`timber/post/classmap`): `post` and `page` → `ChiselPost`, `product` → `ChiselProduct`, `attachment` → `ChiselImage`, **plus every registered CPT → `ChiselPost` automatically** — a new CPT needs no mapping unless you want a subclass of its own.
- **Terms** (`timber/term/classmap`): `category` → `ChiselTerm`, `product_cat` → `ChiselProductCategory`, plus every registered custom taxonomy → `ChiselTerm`.

### Per-post logic → method on the Timber class (HARD RULE)

Logic keyed on a single post/product/term goes as a **method on its Timber class**, read as `{{ post.method }}` — NOT a `fn(post)` Twig function in `custom/app/WP/Twig.php` (those are for ownerless cross-cutting helpers only: breadcrumbs, global lookups).

- **Why**: memoize an expensive lookup (a WC product, ACF group, related query) once in a private accessor and every method reuses it; a Twig function re-resolves on each call. Reads naturally and the object is the obvious home for the next dev.
- **How, for `post`**: already wired. `custom/app/Timber/ChiselPost.php` (namespace `Chisel\Timber\Custom`) is an empty subclass of core's `ChiselPost`, remapped by `custom/app/WP/Site.php` on `timber/post/classmap` at **priority 11** so it beats core's 10. Add your method to that class and stop — no new file, no new filter.
- **How, for anything else**: copy that pair. Subclass the core `\Chisel\Timber\*` class in `custom/app/Timber/`, then add a line to the **custom** `post_classmap()` — never edit `core/`. New CPT: extend `ChiselPost`. Items must come via Timber (`Timber::get_posts()` / context) or the classmap won't apply.

## Components

| Directory           | Purpose                                                            |
| ------------------- | ------------------------------------------------------------------ |
| `views/components/` | Larger UI parts (header, footer, main-nav, pagination, post items) |
| `views/objects/`    | Atomic elements (icons, badges, buttons)                           |
| `views/partials/`   | Template fragments                                                 |

## Block templates

- Custom blocks: `src/blocks/{name}/{name}.twig` → compiled to `build/blocks/`
- ACF blocks: `src/blocks-acf/{name}/{name}.twig` → compiled to `build/blocks-acf/`

## Caching

Configured in `core/Timber/Cache.php`. The switch is `wp_get_environment_type() === 'development'` — **not `WP_DEBUG`**:

- **Development**: Twig template cache off, `auto_reload` + `debug` on
- **Production**: template cache on, `auto_reload` off, `debug` off
- **Fragment caching is off entirely by default** — `timber/cache/mode` returns `Loader::CACHE_NONE`
- Adjust via `chisel_cache_expiry`, `chisel_cache_everything`, `chisel_environment_cache`, `chisel_cache_mode`

## Related

- "Never raw PHP in Twig", ACF block context vars → [coding-conventions.md](.claude/chisel/reference/coding-conventions.md#twig-rules)
- Icon system, `get_icon()` parameters and CSS classes → [assets-and-scripts.md](.claude/chisel/reference/assets-and-scripts.md#icon-system)
- Twig/Timber registration hooks (`timber/context`, `chisel_twig_register_functions`) → [assets-and-scripts.md](.claude/chisel/reference/assets-and-scripts.md#twig)
- Which path each template file goes in → [file-locations.md](.claude/chisel/reference/file-locations.md#twig-templates)
- Block template locations and the build-pipeline rule → [blocks.md](.claude/chisel/reference/blocks.md)
- WooCommerce template overrides → [woocommerce.md](.claude/chisel/reference/woocommerce.md)
- Skills: [create-component](.claude/skills/chisel-create-component/SKILL.md) · [adapt-header-footer](.claude/skills/chisel-adapt-header-footer/SKILL.md)
