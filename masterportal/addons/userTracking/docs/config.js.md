# config.js

The addon is configured via the `userTracking` key in `config.js`.

## Minimal Example

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

## Full Example

```js
// config.js
const Config = {
    // ...
    userTracking: {
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
                {name: "portal", id: 1}
            ]
        },
        options: {
            enableInputTracking: true,
            enableLinkTracking: true
        }
    }
};
```

## Configuration Parameters

### options

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `enableCredibilityCheck` | `Boolean` | no | If `true`, the bot-detection-score is calculated and send to the matomo server once. |
| `enableInputTracking` | `Boolean` | no | If `true`, search bar input is tracked as events and page views (debounced, 500 ms). Defaults to `false`. |
| `enableLinkTracking` | `Boolean` | no | If `true`, clicks on external links, mailto links, and blob download links are tracked as Matomo events. Defaults to `false`. |

### matomo

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `customDimension` | `Object[]` | no | List of custom dimension settings to apply. Each entry must have a `name` (String) and an `id` (Number) matching the dimension ID configured in Matomo. See [Custom Dimensions](#custom-dimensions). |
| `privacy` | `String[]` | no | List of privacy settings to apply. See [Privacy Settings](#privacy-settings). |
| `siteId` | `String` | yes | The site ID assigned to this portal in the Matomo instance. |
| `trackerScriptUrl` | `String` | yes | The URL of the Matomo JavaScript library (e.g. `matomo.js`). |
| `trackerUrl` | `String` | yes | The URL of the Matomo tracking endpoint (e.g. `matomo.php`). |
| `trackInitialView` | `Boolean` | no | If `true`, a page view event is tracked immediately on initialization. Defaults to `false`. |

## Privacy Settings

The following values are supported in the `matomo.privacy` array:

| Value | Description |
|-------|-------------|
| `noAbTesting` | Disables the Matomo A/B Testing plugin. |
| `noCookies` | Disables Matomo cookies. Tracking is cookie-free. |
| `noFormAnalytics` | Disables the Matomo Form Analytics plugin. |
| `noHeatmap` | Disables the Matomo Heatmap & Session Recording plugin. |
| `noReferrerUrl` | Clears the referrer URL before sending events to Matomo. |
| `requireConsent` | Requires explicit user consent before any tracking begins. |
| `respectDoNotTrack` | Respects the browser's Do Not Track (DNT) header. |
| `useRandomUserIdForSession` | Sets a random UUID as the Matomo user ID for the current session. Requires the `crypto` API to be available in the browser. |

## Custom Dimensions

The following values are supported in the `name` field of a `customDimension` entry:

| Value | Description |
|-------|-------------|
| `portal` | Sets the last path segment of the current URL (e.g. `fhh-atlas`) as the custom dimension value. Useful for identifying which portal configuration is being used. |
