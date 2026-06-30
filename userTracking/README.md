# User Tracking Addon

This addon integrates [Matomo](https://matomo.org/) (formerly Piwik) analytics into the Masterportal. It automatically tracks relevant user interactions by subscribing to Vuex store actions and forwarding events to a configured Matomo instance.

## Features

- **Matomo Integration**: Injects the Matomo tracking script at runtime and initializes the tracker with the configured site ID and endpoint URLs.
- **Automatic Event Tracking**: Subscribes to Vuex store actions and sends tracking events to Matomo without any additional manual instrumentation in the portal code.
- **Privacy Controls**: Supports a range of configurable privacy settings (e.g. cookie-free tracking, Do Not Track support, consent requirement).
- **Custom Dimensions**: Supports assigning custom dimension values per session (e.g. a unique session UUID).
- **Initial Page View**: Optionally tracks a page view event on initialization.

## Tracked Interactions

### Events

The following user interactions are tracked as Matomo events automatically:

| Category | Action | Description |
|----------|--------|-------------|
| `Layer` | Layer added via Search | A layer was added through the search bar. |
| `Layer` | Layer added via layertree | A layer was added using the layer tree. |
| `Layer` | Layertree category switched | The active category in the layer tree was changed. |
| `MapMode` | Mapmode switched | The map was switched between 2D and 3D mode. |
| `Menu` | Menuitem clicked | A menu item was opened (excluding GFI, search bar, and layer selection). |
| `Print` | 2D/3D printjob created | A print job was submitted, including the selected layout. |

### Page Views

In addition to events, the following interactions are tracked as Matomo page views with a synthetic URL reflecting the current portal state:

| Trigger | Description |
|---------|-------------|
| Menu item opened | Tracks a page view for each component displayed in the main or secondary menu, including GFI and layer information panels. |
| Menu navigated back | Tracks a page view when the user navigates one step back in the menu history. |
| Menu closed | Tracks a page view when the menu is closed via the X button. |
| Layer selection folder opened | Tracks a page view when the user navigates into a folder inside the layer selection ("Themen hinzufügen"). |
| Layer selection breadcrumb clicked | Tracks a page view when the user navigates back via the breadcrumb in the layer selection. |
| Search input changed | Tracks a page view when the search bar input changes (debounced). |

## Installation

1. Place the `userTracking` folder in the `addons/` directory of your Masterportal installation.
2. Register the addon in your portal's `addonsConf.json`.
3. Add the `userTracking` configuration to your portal's `config.js` (see below).

## Configuration

The addon is configured via the `userTracking` key in `config.js`. No entry in `config.json` is required.

### Minimal Example

```js
// config.js
const Config = {
    // ...
    userTracking: {
        matomo: {
            siteId: "1",
            trackerUrl: "https://your-matomo-instance.example.com/matomo.php",
            trackerScriptUrl: "https://your-matomo-instance.example.com/matomo.js"
        }
    }
};
```

### Full Example

```js
// config.js
const Config = {
    // ...
    userTracking: {
        global: {
            privacy: ["allowInputTracking"]
        },
        matomo: {
            siteId: "1",
            trackerUrl: "https://your-matomo-instance.example.com/matomo.php",
            trackerScriptUrl: "https://your-matomo-instance.example.com/matomo.js",
            trackInitialView: true,
            privacy: [
                "noCookies",
                "respectDoNotTrack"
            ],
            customDimension: [
                {name: "spaSession", id: 1},
                {name: "portal", id: 2}
            ]
        }
    }
};
```

### Configuration Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `siteId` | `String` | yes | The site ID assigned to this portal in the Matomo instance. |
| `trackerUrl` | `String` | yes | The URL of the Matomo tracking endpoint (e.g. `matomo.php`). |
| `trackerScriptUrl` | `String` | yes | The URL of the Matomo JavaScript library (e.g. `matomo.js`). |
| `trackInitialView` | `Boolean` | no | If `true`, a page view event is tracked immediately on initialization. Defaults to `false`. |
| `privacy` | `String[]` | no | List of privacy settings to apply. See [Privacy Settings](#privacy-settings). |
| `customDimension` | `Object[]` | no | List of custom dimension settings to apply. Each entry must have a `name` (String) and an `id` (Number) matching the dimension ID configured in Matomo. See [Custom Dimensions](#custom-dimensions). |

### Privacy Settings

The following values are supported in the `privacy` object (global) and array (Matomo):

#### Globally

| Key | Values | Description |
|-----|--------|-------------|
| `allowInputTracking` | true, false | Allows tracking of input from the user (e. g. in the search bar). |

#### Matomo

| Value | Description |
|-------|-------------|
| `noCookies` | Disables Matomo cookies. Tracking is cookie-free. |
| `respectDoNotTrack` | Respects the browser's Do Not Track (DNT) header. |
| `requireConsent` | Requires explicit user consent before any tracking begins. |
| `noReferrerUrl` | Clears the referrer URL before sending events to Matomo. |
| `noAbTesting` | Disables the Matomo A/B Testing plugin. |
| `noFormAnalytics` | Disables the Matomo Form Analytics plugin. |
| `noHeatmap` | Disables the Matomo Heatmap & Session Recording plugin. |
| `useRandomUserIdForSession` | Sets a random UUID as the Matomo user ID for the current session. Requires the `crypto` API to be available in the browser. |

### Custom Dimensions

The following values are supported in the `name` field of a `customDimension` entry:

| Value | Description |
|-------|-------------|
| `portal` | Sets the last path segment of the current URL (e.g. `fhh-atlas`) as the custom dimension value. Useful for identifying which portal configuration is being used. |
| `spaSession` | Sets a random UUID at startup. This allows grouping all events within a single portal session in Matomo. Requires the `crypto` API to be available in the browser. |
