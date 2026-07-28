# WooCommerce

- **Integration class**: `core/Plugins/Woocommerce/Woocommerce.php`
- **Templates**: `views/woocommerce/` (`single-product.twig`, `archive-product.twig`)
- **Styles**: `src/styles/woocommerce.scss`
- **Custom product fields**: ACF metaboxes (products don't use Gutenberg)
- **Wrapper template**: `woocommerce.php` in theme root

## Rules

- **No CPT for products** — use WooCommerce's built-in product type.
- **ACF metaboxes only for products** — never for regular CPTs.
- Template overrides go in `views/woocommerce/` (not `custom/views/`).
