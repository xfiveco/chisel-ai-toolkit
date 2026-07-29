# WooCommerce

Where the WooCommerce integration lives and the constraints specific to products. Owns **the product-specific deviations** from Chisel's Gutenberg-first defaults — products are the one sanctioned ACF-metabox context. Does **not** own general Twig template rules ([twig-templating.md](.claude/chisel/reference/twig-templating.md)) or ACF field naming ([acf-naming.md](.claude/chisel/reference/acf-naming.md)).

## Hard rules

1. **No CPT for products** — use WooCommerce's built-in product type. → [CPT decision](.claude/chisel/reference/section-mapping-decisions.md#cpt-decision)
2. **ACF metaboxes only for products** — never for regular CPTs, which stay Gutenberg-first.
3. **Template overrides go in `views/woocommerce/`** — not `custom/views/`, which is legacy and unused.

## Where things live

- **Integration class**: `core/Plugins/Woocommerce/Woocommerce.php`
- **Templates**: `views/woocommerce/` (`single-product.twig`, `archive-product.twig`)
- **Styles**: `src/styles/woocommerce.scss`
- **Custom product fields**: ACF metaboxes (products don't use Gutenberg)
- **Wrapper template**: `woocommerce.php` in theme root

## Related

- `ChiselProduct` / `ChiselProductCategory` Timber classes and the class map → [twig-templating.md](.claude/chisel/reference/twig-templating.md#custom-timber-classes)
- Field naming for product meta (`product_` prefix) → [acf-naming.md](.claude/chisel/reference/acf-naming.md)
- Why products aren't a CPT → [section-mapping-decisions.md](.claude/chisel/reference/section-mapping-decisions.md#cpt-decision)
- `WoocommerceHelpers` and where plugin integration code goes → [file-locations.md](.claude/chisel/reference/file-locations.md)
