/**
 * Vuex plugin that centrally subscribes to relevant actions and triggers Matomo tracking.
 * @param {Object} store Vuex store
 * @returns {void}
 */
export function createMatomoVuexPlugin (store) {
    store.subscribeAction({
        after: (action) => {
            switch (action.type) {
                case "changeCategory":
                    trackEvent({category: "Layer", action: "Layertree category switched", name: i18next.t(action.payload.name)});
                    break;
                case "Modules/SearchBar/addLayerToTopicTree": {
                    const {layerId} = action.payload;

                    trackEvent({category: "Layer", action: "Layer added via Search", name: store.getters.layerConfigById(layerId)?.name + " (layerId: " + layerId + ")"});
                    break;
                }
                case "Modules/LayerSelection/changeVisibility":
                    if (action.payload.value) {
                        const {layerId} = action.payload;

                        trackEvent({category: "Layer", action: "Layer added via layertree", name: store.getters.layerConfigById(layerId)?.name + " (layerId: " + layerId + ")"});
                    }
                    break;
                case "Maps/changeMapMode":
                    trackEvent({category: "MapMode", action: "Mapmode switched", name: "Mapmode switched to " + action.payload});
                    break;
                case "Menu/changeCurrentComponent": {
                    const {type, props} = action.payload;

                    if (type !== "getFeatureInfo" && type !== "searchBar" && type !== "layerSelection") {
                        trackEvent({category: "Menu", action: "Menuitem clicked", name: i18next.t(props.name)});
                    }
                    break;
                }
                case "Modules/Print/createPrintJob": {
                    const printPayload = action.payload?.payload;

                    if (printPayload) {
                        trackEvent({category: "Print", action: `${printPayload.attributes?.is3dMode ? "3D" : "2D"} printjob created `, name: `Layout: ${printPayload.layout}`});
                    }
                    break;
                }
                default:
                    break;
            }
        }
    });
}

/**
 * Initializes the global Matomo tracking queue (_paq) and applies initial configuration settings.
 * Processes privacy and custom dimension settings from the provided config object.
 * @param {Object} config Matomo configuration object.
 * @param {String[]} [config.privacy] List of privacy settings to apply (e.g. "noCookies").
 * @param {String[]} [config.customDimension] List of custom dimension settings to apply (e.g. "spaSession").
 * @returns {void}
 */
export function createMatomoQueueAndAddInitialSettings (config) {
    window._paq = window._paq || [];

    const configCommands = {
        customDimension: {
            "spaSession": () => {
                typeof crypto !== "undefined" && window._paq.push(["setCustomDimension", 1, crypto.randomUUID()]);
            }
        },
        privacy: {
            "noAbTesting": () => {
                window._paq.push(["AbTesting::disable"]);
            },
            "noCookies": () => {
                window._paq.push(["disableCookies"]);
            },
            "noFormAnalytics": () => {
                window._paq.push(["FormAnalytics::disableFormAnalytics"]);
            },
            "noHeatmap": () => {
                window._paq.push(["HeatmapSessionRecording::disable"]);
            },
            "noReferrerUrl": () => {
                window._paq.push(["setReferrerUrl", ""]);
            },
            "respectDoNotTrack": () => {
                window._paq.push(["setDoNotTrack", true]);
            }
        }
    };

    ["privacy", "customDimension"].forEach(category => {
        config[category]?.forEach(setting => {
            if (configCommands[category][setting]) {
                configCommands[category][setting]();
            }
            else {
                console.warn(`Unknown Matomo ${category} setting: ${setting}`);
            }
        });
    });
}

/**
 * Pushes a trackEvent call to the global Matomo queue (_paq).
 * @param {Object} eventParams Object containing the Matomo event parameters.
 * @param {String} eventParams.category Category of the matomo event.
 * @param {String} eventParams.action Description of action of the matomo event.
 * @param {String} [eventParams.name] Name of the matomo event.
 * @param {Number} [eventParams.value] Value of the matomo event.
 * @returns {void}
 */
function trackEvent ({category, action, name, value}) {
    if (window._paq) {
        window._paq.push(["trackEvent", category, action, name, value]);
    }
    else {
        console.warn(`Matomo has not been loaded - event {category: "${category}", action: "${action}", name: "${name}", value: "${value}"} is omitted.`);
    }
}
