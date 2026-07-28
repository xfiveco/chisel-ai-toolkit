# REST API / AJAX Endpoints

Chisel provides an AJAX/REST system built on `WP_REST_Controller`.

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

1. Routes defined in `AjaxController::set_properties()` as `[method, handler]` pairs
2. Routes passed through `chisel_ajax_routes` filter
3. For each route, Chisel auto-discovers the endpoint class:
   - Route `load-more` → class `LoadMoreEndpoint`
   - Looks first in `Chisel\Ajax\Custom\{Name}Endpoint`, then `Chisel\Ajax\{Name}Endpoint`
4. Endpoint class implements `AjaxEndpointInterface` with `handle(WP_REST_Request $request)` method
5. Permissions checked via `chisel_ajax_permissions_check` filter

## Creating a custom endpoint

1. Create `custom/app/Ajax/{Name}Endpoint.php` — the namespace keeps the `Custom` segment (`Chisel\Ajax\Custom`), the file path drops it: the autoloader strips `Custom` when resolving (see [CLAUDE.md "Architecture"](CLAUDE.md#architecture-core-vs-custom)). A file placed at `custom/app/Ajax/Custom/…` is never found.
2. Implement `AjaxEndpointInterface`
3. Register the route via `chisel_ajax_routes` filter

```php
// custom/app/Ajax/SearchEndpoint.php
namespace Chisel\Ajax\Custom;

use Chisel\Interfaces\AjaxEndpointInterface;
use WP_REST_Request;

class SearchEndpoint implements AjaxEndpointInterface {
    public function handle(WP_REST_Request $request): array {
        $query = $request->get_param('query');
        // ... search logic
        return ['results' => $results];
    }
}
```

```php
// custom/app/WP/Ajax.php — register hooks here, not in custom/functions.php
public function filter_hooks(): void {
    add_filter( 'chisel_ajax_routes', array( $this, 'register_routes' ) );
}

public function register_routes( array $routes ): array {
    $routes['search'] = array( 'GET', 'search' );
    return $routes;
}
```

Then bootstrap the class in `custom/functions.php` with `\Chisel\WP\Custom\Ajax::get_instance();`. See [CLAUDE.md "Architecture"](CLAUDE.md#architecture-core-vs-custom).

Endpoint available at: `/wp-json/chisel/v2/ajax/search/?query=term`

## Built-in endpoint

**`load-more`** — pagination endpoint for loading additional posts. Used by `app.js` with localized REST URL (`chisel_ajax.rest_url`).

## Frontend usage

REST URL localized to frontend script as `chisel_ajax.rest_url`:

```js
const response = await fetch(`${chiselAjax.rest_url}search/?query=${term}`);
const data = await response.json();
```
