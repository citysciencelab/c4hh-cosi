# User Tracking Addon

This addon is currently still in development and thus being an experimental feature.

It integrates [Matomo](https://matomo.org/) (formerly Piwik) analytics into the Masterportal. It automatically tracks relevant user interactions by subscribing to Vuex store actions and mutations as well as to Pinia store actions and forwarding events to a configured Matomo instance.

## Features

- **Matomo Integration**: Injects the Matomo tracking script at runtime and initializes the tracker with the configured site ID and endpoint URLs.
- **Automatic Event Tracking**: Subscribes to Vuex store actions and mutations as well as to Pinia store actions and sends tracking events to Matomo without any additional manual instrumentation in the portal code.
- **Page View Tracking**: Records synthetic page views with structured URLs that reflect the current navigation state of the portal (active menu component, layer selection folder, search query).
- **Link Tracking**: Optionally intercepts clicks on external links, mailto links, and blob download links and tracks them as Matomo events. Activated via `options.enableLinkTracking`.
- **Privacy Controls**: Supports a range of configurable privacy settings (e.g. cookie-free tracking, Do Not Track support, consent requirement).
- **Custom Dimensions**: Supports assigning a custom dimension value per session (e.g. the active portal name).
- **Initial Page View**: Optionally tracks a page view event on initialization.

## Tracked Interactions

### Events

The following user interactions are tracked as Matomo events automatically.

#### Client

| Action | Name | Value | Trigger |
|--------|------|-------|---------|
| `Credibility is good` / `Credibility is bad` | `Reasons: {reasons}` (comma-separated list of matched indicators, or `none`) | Credibility score | Sent once per session, based on a client-side heuristic (`checkClientCredibility`) that estimates whether the client is a real user or an automated client (bot, crawler, headless browser). |

#### Layer

| Action | Name | Trigger |
|--------|------|---------|
| `Added layer via layertree and turned it on` | Layer name and ID | A layer was turned on via the layer tree ("Themen hinzufügen"). |
| `Added layer via search` | Layer name and ID | A layer was added through the search results. |
| `Changed layer-visibility via {source}` | Layer name and ID | A layer's visibility checkbox was toggled (e.g. from the layer tree or layer selection). The value field is `1` (visible) or `0` (hidden). |
| `Changed layertree category` | Translated category name | The active category in the layer tree was changed. |
| `Changed transparency` | Layer name and ID | The transparency slider of a layer was moved (debounced, 500 ms). The value field contains the transparency percentage. |
| `Clicked on "Add layer"-button` | — | The "Add layer" button was clicked (layer selection opened without a specific layer). |
| `Clicked on "go-to-layertree"-button` | Layer name and ID | The "go to layer tree" button next to a layer in the search results was clicked. |
| `Clicked on "show-layers-of-folder"-button` | Layer name and ID | The "show layers of folder" button in the search results was clicked. |
| `Opened layer information via {source}` | Layer name and ID | The info button of a layer or a layer pill was clicked. |
| `Processed search` | Search input text | A search term was entered in the search bar (debounced, 500 ms). Only tracked when `options.enableInputTracking` is set to `true`. |
| `Removed layer from layertree` | Layer name and ID | The remove button on a layer in the layer tree was clicked. |
| `Removed layer via layertree` | Layer name and ID | A layer was turned off via the layer tree ("Themen hinzufügen"). |
| `Started typing into search bar` | — | The search bar component was opened in the main menu. |

#### Menu

| Action | Name | Trigger |
|--------|------|---------|
| `Clicked back-button` | Menu side | The back button in the menu was clicked. |
| `Changed language` | ISO language code (e.g. `de`, `en`) | The portal language was changed. |
| `Clicked menu-toggle-button` | Menu side | The hamburger / menu toggle button was clicked. |
| `Clicked on item in {source}` | Translated component name | A menu item was clicked (general case; GFI, search bar, and layer selection entries are handled separately). |
| `Clicked X-button (reset menu)` | Menu side | The X button to close/reset the menu was clicked. |

#### MapControls

| Action | Name | Trigger |
|--------|------|---------|
| `Changed map-mode` | `2D` or `3D` | The 2D/3D toggle button was clicked. |
| `Clicked control` | `Rotate clockwise` or `Rotate counter-clockwise` | A map rotation button was clicked. |
| `Clicked control` | `Set geolocation` | The geolocation (GPS) button was clicked. |

#### Tool

| Action | Name | Trigger |
|--------|------|---------|
| `Created printjob` | `Mode: "2D"/"3D", Layout: "{layout}"` | Detailed print job information (mode and layout) tracked alongside the event above. |
| `Opened tool` | `360DegreePanorama` | The StreetSmart (360° panorama) tool was opened. |
| `Opened tool` | `ObliqueAerialView` | The vcOblique (oblique aerial view) tool was opened. |
| `Used tool successfully` | `AddWMS` | A WMS layer was successfully added via the AddWMS tool. |
| `Used tool successfully` | `CoordToolkit (Query-Tab)` | A coordinate was formatted or a position was clicked in the CoordToolkit. |
| `Used tool successfully` | `FileImport` | A file was successfully imported via the FileImport tool. |
| `Used tool successfully` | `Measure` | A measurement was finalized in the Measure tool. |
| `Used tool successfully` | `PopulationRequest` | Data was successfully processed in the PopulationRequest tool. |
| `Used tool successfully` | `Print` | "Datei erstellen" was clicked in the Print tool. |
| `Used tool successfully` | `Routing (Planning-Tab)` | A route was calculated in the Routing tool (Planning tab). |
| `Used tool successfully` | `Routing (Reachability-Tab)` | Isochrones were calculated in the Routing tool (Reachability tab). |
| `Used tool successfully` | `SdpDownload` | A download was requested in the SdpDownload tool. |
| `Used tool successfully` | `WfsSearch` | A search was executed in the WfsSearch tool. |

##### Draw

Draw tool interactions are also tracked under the `Tool` category, but are listed separately here since both the legacy Draw tool and the new Draw tool (2026) are covered. The `Name` field reflects which version was used: `Draw (Old)` for the legacy tool, `Draw ({version})` (e.g. `Draw (2026)`) for the new tool. Rows marked "legacy tool only" are not yet wired up for the new Draw tool.

| Action | Name | Trigger |
|--------|------|---------|
| `Used tool successfully` | `Draw (Old)` / `Draw ({version})` | A drawing was completed. |
| `Cleared draw layer` | `Draw (Old)` | The draw layer was cleared (legacy tool only). |
| `Pressed Download-Button` | `Draw (Old)` | The drawn features were downloaded (legacy tool only). |
| `Pressed Undo-Button` / `Pressed Redo-Button` | `Draw (Old)` | The undo or redo button was pressed (legacy tool only). |
| `Changed download format to: {format}` | `Draw (Old)` | The download format was changed (legacy tool only). |
| `Changed draw type to: {drawType}` | `Draw (Old)` | The draw type (e.g. point, line, polygon) was changed (legacy tool only). |
| `Changed interaction to: {interaction}` | `Draw (Old)` | An interaction (e.g. draw, edit, delete) was toggled (legacy tool only). |
| `Changed circle-method to: {method}` / `Changed square-method to: {method}` | `Draw (Old)` / `Draw ({version})` | The method used to draw a circle or square was changed. |
| `Changed circle-radius` / `Changed outer circle-radius` | `Draw (Old)` / `Draw ({version})` | The inner or outer circle radius was changed (debounced, 500 ms). The value field contains the radius. |
| `Changed unit to: {unit}` | `Draw (Old)` / `Draw ({version})` | The measurement unit was changed. |
| `Changed fill-color` / `Changed outer fill-color` / `Changed stroke-color` / `Changed outer stroke-color` | `Draw (Old)` / `Draw ({version})` | A fill or stroke color was changed (debounced, 500 ms). The value field contains the packed RGB color. |
| `Changed fill transparency` / `Changed outer fill transparency` | `Draw (Old)` / `Draw ({version})` | The fill transparency/opacity was changed (debounced, 500 ms). The value field contains the transparency percentage. |
| `Changed font to: {fontName}` | `Draw (Old)` / `Draw ({version})` | The font was changed. |
| `Changed font-size` | `Draw (Old)` / `Draw ({version})` | The font size was changed. The value field contains the font size. |
| `Changed stroke width` / `Changed outer stroke width` | `Draw (Old)` / `Draw ({version})` | The stroke width was changed (debounced, 500 ms). The value field contains the stroke width. |
| `Changed text` | `Draw (Old)` / `Draw ({version})` | The text of a text drawing was changed (debounced, 500 ms). |
| `Changed visibility to: on/off` | `Draw (Old)` / `Draw ({version})` | The draw layer's visibility was toggled. |

#### Link

| Action | Name | Trigger |
|--------|------|---------|
| `Clicked on external link` | `href: "…" \| class: "…" \| id: "…"` | An external link was clicked. |
| `Clicked on mailto link` | `href: "…" \| class: "…" \| id: "…"` | A mailto link was clicked. |
| `Triggered download` | `href: "…" \| class: "…" \| id: "…"` | A blob download link was clicked. |

### Page Views

In addition to events, the following interactions are tracked as Matomo page views with a synthetic URL reflecting the current portal state:

| Trigger | URL pattern | Description |
|---------|-------------|-------------|
| Layer selection breadcrumb clicked | `{currentUrl}{folderPath}` | A page view is tracked when the user navigates back via the breadcrumb in the layer selection. |
| Layer selection folder navigated | `{currentUrl}/{folderPath}` | A page view is tracked when the user navigates into a folder inside the layer selection ("Themen hinzufügen"). |
| Menu closed | `{baseUrl}{side}` | A page view is tracked when the menu is closed via the X button. |
| Menu item opened | `{baseUrl}{side}/{type}[/{section}]` | A page view is tracked for each component displayed in the main or secondary menu, including GFI and layer information panels. |
| Menu navigated back | URL of the previous history entry | A page view is tracked when the user navigates one step back in the menu history. |
| Search input changed | `{currentUrl}?q={encodedInput}` | A page view is tracked when the search bar input changes (debounced, 500 ms). Only tracked when `options.enableInputTracking` is set to `true`. |

## Installation

1. Place the `userTracking` folder in the `addons/` directory of your Masterportal installation.
2. Register the addon in your portal's `addonsConf.json`.
3. Add the `userTracking` configuration to your portal's `config.js` (see below).

## Configuration

The addon is configured via the `userTracking` key in `config.js`. No entry in `config.json` is required.

See **[docs/config.js.md](docs/config.js.md)** for the full list of configuration parameters, including minimal and full configuration examples.
