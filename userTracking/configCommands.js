export const configCommands = {
    customDimension: new Map([
        ["spaSession", () => {
            typeof crypto !== "undefined" && window._paq.push(["setCustomDimension", 1, crypto.randomUUID()]);
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
        }]
    ])
};
