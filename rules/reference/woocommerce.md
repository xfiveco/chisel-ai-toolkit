# WooCommerce

Where the WooCommerce integration lives and the constraints specific to products. Owns **the product-specific deviations** from Chisel's Gutenberg-first defaults. Does **not** own general Twig template rules ([twig-templating.md](.claude/chisel/reference/twig-templating.md)) or ACF field naming ([acf-naming.md](.claude/chisel/reference/acf-naming.md)).

## Hard rules

1. **No CPT for products** — use WooCommerce's built-in product type. → [CPT decision](.claude/chisel/reference/section-mapping-decisions.md#cpt-decision)
2. **Project Woo code goes in `custom/app/Plugins/Woocommerce/`, never `custom/app/WP/`.** → [Where your code goes](#where-your-code-goes)
3. **ACF metaboxes are normal on products** — but that is not a licence to use them for a regular CPT's content, which stays Gutenberg-first. → [Product fields](#product-fields)
4. **Template overrides go in `views/woocommerce/`** — not `custom/views/`, which is legacy and unused.

## Where your code goes

Anything hooking WooCommerce's own hooks (`woocommerce_*`, `wc_*`) is **plugin integration** and belongs in:

```text
custom/app/Plugins/Woocommerce/{Class}.php
namespace Chisel\Plugins\Custom\Woocommerce;   // autoloader strips `Custom`
```

`HooksSingleton` trait, then a `\Chisel\Plugins\Custom\Woocommerce\{Class}::get_instance();` line in `custom/functions.php`. Mirrors `core/Plugins/Woocommerce/`. The folder doesn't ship — create it.

**This holds even for classes whose subject is products rather than the plugin.** A product-editor tweak, a variation UI, a product-page controller: if it exists because WooCommerce exists, it goes in `Plugins/Woocommerce/`. Putting it in `custom/app/WP/` scatters the Woo surface across two trees and makes it impossible to see what a Woo-less project would drop. Existing projects that got this wrong predate the rule — don't copy them.

## Where the framework's code lives

- **Integration class**: `core/Plugins/Woocommerce/Woocommerce.php` — inert unless `WoocommerceHelpers::is_woocommerce_active()`
- **Wrapper template**: `woocommerce.php` in the theme root — the single entry point. It branches singular-vs-loop, builds the context (upsells, related, grid classnames, load-more) and renders one of the two twigs. `chisel_woocommerce_upsell_display` and `chisel_woocommerce_output_related_products` switch the two product lists off
- **Second override slot**: the integration appends `custom/woocommerce.php` to `woocommerce_template_loader_files` at priority 99 — use it to replace the wrapper without touching the root file
- **Templates**: `views/woocommerce/` — `single-product.twig`, `archive-product.twig`, `content-product.twig`, `content-product-cat.twig`, `linked-products.twig`. Plus `views/sidebar-woocommerce.twig`, fed by a `woocommerce` sidebar the integration registers through `chisel_sidebars`
- **Styles**: `src/styles/woocommerce.scss`, plus the `src/styles/woo/` layer. **Enqueued conditionally** — on Woo pages, cart/checkout/account, *and* any singular post whose content contains a `wp:woocommerce/` block. A Woo block dropped into an ordinary page is covered; nothing else is
- **Timber classes**: core maps `product` → `ChiselProduct` and `product_cat` → `ChiselProductCategory`. `timber_set_product()` is the Twig function for setting the global product object

## Product fields

Products are edited on WooCommerce's own screen, which is metabox-driven — so ACF metaboxes are the natural fit for extra product data, and real projects ship them (`product_advantages`, `product_tabs`). Note this is about *where WooCommerce puts its UI*, not a platform limit: WooCommerce registers `product` with `editor` in `supports` and `show_in_rest => true`, so the post type is block-capable.

What this does **not** license: an ACF metabox holding a regular CPT's content. That rule is unchanged — see [cpt.md](.claude/chisel/reference/cpt.md) hard rule 3.

## Cart access in REST endpoints

**Trap.** The WooCommerce session and cart are only initialized for REST routes starting `/wc/store`. A custom endpoint — say `chisel/v2/ajax/add-to-cart` — gets **no cart at all** until its prefix is filtered in:

```php
add_filter( 'chisel_wc_cart_rest_routes', function ( array $routes ): array {
    $routes[] = '/chisel/v2/ajax/add-to-cart';

    return $routes;
} );
```

The gate is deliberate: initializing the cart on every REST request forces a customer-session cookie and makes responses uncacheable. Add your route, don't remove the gate. Endpoint mechanics: [rest-api.md](.claude/chisel/reference/rest-api.md).

## Related

- `ChiselProduct` / `ChiselProductCategory` Timber classes and the class map → [twig-templating.md](.claude/chisel/reference/twig-templating.md#custom-timber-classes)
- Field naming for product meta (`product_` prefix) → [acf-naming.md](.claude/chisel/reference/acf-naming.md)
- Why products aren't a CPT → [section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md#cpt-decision)
- Content in blocks vs settings in metaboxes → [cpt.md](.claude/chisel/reference/cpt.md)
- `WoocommerceHelpers` and the `custom/app/Plugins/` rule for every plugin → [file-locations.md](.claude/chisel/reference/file-locations.md#registrations-php)
- Custom cart-bearing endpoints → [rest-api.md](.claude/chisel/reference/rest-api.md)
