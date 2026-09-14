# REST API / AJAX Endpoints

Chisel provides an AJAX/REST system built on `WP_REST_Controller`. Owns the `chisel/v2` route contract, how endpoint classes are discovered, and the procedure for adding one. Does **not** own where endpoint files live ([file-locations.md](.claude/chisel/reference/file-locations.md)) or the autoloader's `Custom`-segment rule these paths depend on ([coding-conventions.md "Namespace ↔ path mapping"](.claude/chisel/reference/coding-conventions.md#namespace--path-mapping)).

## Architecture

| File                                        | Purpose                                                     |
| ------------------------------------------- | ----------------------------------------------------------- |
| `core/Controllers/AjaxController.php`       | Main controller — registers routes, dispatches to endpoints |
| `core/Interfaces/AjaxEndpointInterface.php` | Interface every endpoint implements                         |
| `core/Ajax/LoadMoreEndpoint.php`            | Built-in "load more" pagination endpoint                    |
| `core/Traits/Rest.php`                      | REST utility trait                                          |

- Namespace: `chisel/v2`
- Base route: `ajax`
- Full pattern: `/wp-json/chisel/v2/ajax/{endpoint-name}/`

## How it works

1. Routes defined in `AjaxController::set_properties()` as `'{route-name}' => array( … )`. The value is an **associative** array with two optional keys — `methods` (default `array('POST')`) and `handler` (default `null`). The built-in route registers as `'load-more' => array()`, i.e. all-defaults
2. Routes passed through `chisel_ajax_routes` filter
3. For each route, Chisel resolves the endpoint class:
   - An explicit `handler` wins outright — it must be a **fully-qualified class name** (`class_exists()` runs on it), and it skips the name-based lookup below entirely
   - Otherwise the route name becomes a class name: `load-more` → `LoadMoreEndpoint`
   - Looks first in `Chisel\Ajax\Custom\{Name}Endpoint`, then `Chisel\Ajax\{Name}Endpoint`
4. Endpoint class implements `AjaxEndpointInterface` — `handle( WP_REST_Request $request ): \WP_REST_Response`
5. Permissions checked via `permissions_check()`: it verifies the request's `x_wp_nonce` header against the `wp_rest` action, then passes the result through the `chisel_ajax_permissions_check` filter (`$allowed`, the sanitized endpoint class name, `$request`)

## Creating a custom endpoint

1. Create `custom/app/Ajax/{Name}Endpoint.php` — the namespace keeps the `Custom` segment (`Chisel\Ajax\Custom`), the file path drops it: the autoloader strips `Custom` when resolving (see [CLAUDE.md "Architecture"](CLAUDE.md#architecture-core-vs-custom)). A file placed at `custom/app/Ajax/Custom/…` is never found.
2. Implement `AjaxEndpointInterface`
3. Register the route via `chisel_ajax_routes` filter

```php
// custom/app/Ajax/SearchEndpoint.php
namespace Chisel\Ajax\Custom;

use Chisel\Interfaces\AjaxEndpointInterface;
use Chisel\Traits\Rest;

class SearchEndpoint implements AjaxEndpointInterface {
    use Rest;

    public function handle( \WP_REST_Request $request ): \WP_REST_Response {
        $data  = $this->get_data( $request );
        $query = isset( $data['query'] ) ? sanitize_text_field( $data['query'] ) : '';

        if ( ! $query ) {
            return $this->error( 'No query' );
        }

        // ... search logic

        return $this->success( array( 'results' => $results ) );
    }
}
```

**The return type is not negotiable** — the interface declares `\WP_REST_Response`, so returning a bare array is a fatal error. The `Rest` trait gives you the three pieces: `get_data()` (the POST body params), `success( $data )` and `error( $message )`. Both responses are HTTP 200 with an `error` flag of `0` / `1` in the payload.

```php
// custom/app/WP/Ajax.php — register hooks here, not in custom/functions.php
public function filter_hooks(): void {
    add_filter( 'chisel_ajax_routes', array( $this, 'register_routes' ) );
}

public function register_routes( array $routes ): array {
    $routes['search'] = array();

    return $routes;
}
```

An empty array is the normal case: `methods` defaults to `POST` and the class is found from the route name. Override only when you need to — `array( 'methods' => array( 'GET' ), 'handler' => \Chisel\Ajax\Custom\SearchEndpoint::class )`. **`handler` takes a class name, not a route slug**, and the keys are named — a positional `array( 'GET', 'search' )` sets neither and silently gives you a POST route with no handler.

`custom/app/WP/Ajax.php` **already ships and is already bootstrapped** in `custom/functions.php` — add your filter to its existing `filter_hooks()`; don't recreate the file or the `get_instance()` line. See [CLAUDE.md "Architecture"](CLAUDE.md#architecture-core-vs-custom).

Endpoint available at: `/wp-json/chisel/v2/ajax/search/`

## Built-in endpoint

**`load-more`** — pagination endpoint for loading additional posts, driven by `src/scripts/modules/load-more.js`. It returns compiled HTML, not JSON post data.

**Trap: it only queries an allow-listed post type.** `chisel_load_more_allowed_post_types` defaults to `array( 'post', 'product' )`, and anything outside it comes back as `Invalid post type`. A project CPT must be filtered in before load-more works on its archive. `chisel_load_more_max_per_page` (default 24) caps the page size; `chisel_load_more_query_args`, `chisel_load_more_item_templates`, `chisel_load_more_item_context`, `chisel_load_more_no_results_template` and `chisel_load_more_response` shape the rest.

**The template side is a contract, not just a `type`.** `components/pagination.twig` renders the button only when `type == 'load-more'` **and** `load_more.post_type` **and** `load_more.per_page` are set — otherwise it silently falls back to page links. The controller supplies that array with `$context['load_more'] = LoadMoreHelpers::get_context();` (every shipped controller does; a project `archive-{slug}.php` must too). `get_context()` also fills `load_more.query` — the author, term or date the archive is scoped to — which the template forwards as `data-query` and the endpoint validates key by key. Extend it via `chisel_load_more_context`. The page links stay in the markup as `c-pagination--crawlable` (hidden) so the paginated URLs remain discoverable; don't remove them.

## Frontend usage

**Call `Utils.ajaxRequest()` — don't hand-roll `fetch`.** It lives in `src/scripts/modules/utils.js` and handles the parts that are easy to get wrong: the POST + `FormData` transport the endpoints read, the `X-WP-Nonce` header `permissions_check()` demands, nonce refresh from the response header, and a one-shot retry without the nonce when a full-page-cached document carries a stale one.

```js
import Utils from './utils';

const data = await Utils.ajaxRequest('search', { query: term });
```

Signature: `ajaxRequest(action, ajaxData = {}, ajaxParams = {}, ajaxHeaders = {})`. `action` is the route name; `ajaxData` is an object (nested values are JSON-stringified) or a `FormData`; `ajaxParams` merges into the `fetch` init.

The values it reads are localized onto the frontend bundle as **`chiselScripts.ajax.url`** and **`chiselScripts.ajax.nonce`** — `url` is `rest_url('chisel/v2/ajax')` without a trailing slash. Read them from `chiselScripts` if you ever need them directly. The same object carries **`chiselScripts.i18n`** — the translated strings for front-end JS (`chisel_frontend_strings`): [assets-and-scripts.md "Default assets"](.claude/chisel/reference/assets-and-scripts.md#default-assets).

## Related

- Where endpoint and hook-registration files go → [file-locations.md](.claude/chisel/reference/file-locations.md)
- The autoloader's `Custom`-segment stripping (why the path drops `Custom`) → [coding-conventions.md](.claude/chisel/reference/coding-conventions.md#namespace--path-mapping)
- Frontend JS conventions and where site-wide scripts live → [coding-conventions.md](.claude/chisel/reference/coding-conventions.md#javascript)
- How `chiselScripts.ajax` gets localized onto `app.js` → [assets-and-scripts.md](.claude/chisel/reference/assets-and-scripts.md#default-assets)
- Core vs custom, and why hooks never go in `custom/functions.php` → [CLAUDE.md "Architecture"](CLAUDE.md#architecture-core-vs-custom)
