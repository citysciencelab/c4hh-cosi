/**
 * Maps of configuration command handlers for Matomo initialization.
 *
 * "customDimension": Maps a dimension name key to a function that receives the
 * Matomo dimension ID and pushes the corresponding "setCustomDimension" command
 * to "window._paq".
 *
 * "privacy": Maps a privacy setting key to a function that pushes the corresponding
 * Matomo privacy command to "window._paq".
 */
export const configCommands = {
    customDimension: new Map([
        ["portal", (dimId) => {
            window._paq.push([
                "setCustomDimension",
                dimId,
                window.location.pathname.split("/").filter(Boolean).reverse()[0] ?? "unknown"
            ]);
        }]
    ]),
    privacy: new Map([
        ["noAbTesting", () => {
            window._paq.push(["AbTesting::disable"]);
        }],
        ["noCookies", () => {
            window._paq.push(["disableCookies"]);
        }],
        ["noFormAnalytics", () => {
            window._paq.push(["FormAnalytics::disableFormAnalytics"]);
        }],
        ["noHeatmap", () => {
            window._paq.push(["HeatmapSessionRecording::disable"]);
        }],
        ["noReferrerUrl", () => {
            window._paq.push(["setReferrerUrl", ""]);
        }],
        ["requireConsent", () => {
            window._paq.push(["requireConsent"]);
        }],
        ["respectDoNotTrack", () => {
            window._paq.push(["setDoNotTrack", true]);
        }],
        ["useRandomUserIdForSession", () => {
            typeof crypto?.randomUUID === "function" && window._paq.push(["setUserId", crypto.randomUUID()]);
        }]
    ])
};
