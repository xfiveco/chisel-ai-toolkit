# Twig Templating (Timber)

**All Twig templates live in `views/`.** `custom/views/` exists but is unused — edit `views/` directly. The `custom/` folder is for PHP only.

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

## Base layout

```twig
{% block header %} → views/components/header.twig {% endblock %}
<main id="main" class="o-wrapper">
  {% block content %} → filled by child templates {% endblock %}
</main>
{% block footer %} → views/components/footer.twig {% endblock %}
```

## Global context (from `core/WP/Site.php`)

| Variable          | Type          | Source                                                               |
| ----------------- | ------------- | -------------------------------------------------------------------- |
| `logo`            | string (HTML) | `Components::get_logo()` — responsive custom logo                    |
| `menus`           | array         | All registered nav menus                                             |
| `sidebar`         | array         | Auto-detects blog/woo context                                        |
| `copyright`       | array         | `chisel-sidebar-copyright` widget area (`copyright.content`)         |
| `footer_sidebars` | array         | 4 footer-column widget areas + grid class (`.columns`)               |
| `the_title`       | array         | Page/archive title + class                                           |
| `options`         | array         | ACF Options (if added via custom filter in `custom/app/WP/Site.php`) |

## Custom Twig functions (from `core/WP/Twig.php`)

| Function                                | Purpose                                                                                                                                                     |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get_nav_menu(name)`                    | Get menu by location (strips `chisel_` prefix)                                                                                                              |
| `get_responsive_image(id, size, attrs)` | Responsive `<img>` with srcset                                                                                                                              |
| `get_icon(args)`                        | Render icon — see [assets-and-scripts.md](assets-and-scripts.md)                                                                                            |
| `should_use_icons_module()`             | Check `CHISEL_USE_ICONS_MODULE`                                                                                                                             |
| `bem(name, ...modifiers)`               | Generate BEM class string                                                                                                                                   |
| `post_classes(classes, prefix)`         | Transform post classes to BEM                                                                                                                               |
| `breadcrumbs()`                         | Yoast breadcrumbs (empty string if Yoast inactive). Style via `.c-breadcrumbs` in `src/styles/vendor/_breadcrumbs.scss`. Always use this — never hand-roll. |
| `comments_template()`                   | WordPress comments block                                                                                                                                    |
| `slider_prepare_params(params)`         | Prepare ACF slider data                                                                                                                                     |

Extend via `chisel_twig_register_functions` / `chisel_twig_register_filters` / `chisel_twig_register_tests` hooks in `custom/app/WP/Twig.php`.

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

Class mapping in `Site.php`: `post` and `page` → `ChiselPost`, `product` → `ChiselProduct`, `attachment` → `ChiselImage`.

### Per-post logic → method on the Timber class (HARD RULE)

Logic keyed on a single post/product/term goes as a **method on its Timber class**, read as `{{ post.method }}` — NOT a `fn(post)` Twig function in `custom/app/WP/Twig.php` (those are for ownerless cross-cutting helpers only: breadcrumbs, global lookups).

- **Why**: memoize an expensive lookup (a WC product, ACF group, related query) once in a private accessor and every method reuses it; a Twig function re-resolves on each call. Reads naturally and the object is the obvious home for the next dev.
- **How**: `post`/`page`/`product`/`attachment` are already mapped, so a custom class **subclasses** the core one (place in `custom/app/Timber/`, `extends` the `\Chisel\Timber\*` class) and remaps in `Site.php` `post_classmap()`. New CPT: extend `ChiselPost`. Items must come via Timber (`Timber::get_posts()` / context) or the classmap won't apply.

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

Configured in `core/Timber/Cache.php`:

- **Development** (`WP_DEBUG` or `development` env): cache disabled, auto_reload + debug on
- **Production**: cache enabled, auto_reload off, debug off
- Adjust via `chisel_cache_expiry`, `chisel_cache_everything`, `chisel_environment_cache` filters
