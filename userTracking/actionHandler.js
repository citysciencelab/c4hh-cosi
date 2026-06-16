/**
 * Evaluates a dispatched Vuex action and triggers the corresponding Matomo tracking event.
 * @param {Object} store The vuex store.
 * @param {Object} action The dispatched Vuex action.
 * @param {String} action.type The type identifier of the action.
 * @param {Object} action.payload The payload carried by the action.
 * @returns {void}
 */
export function handleTrackedAction (store, action) {
    switch (action.type) {
        case "changeCategory":
            trackMatomoEvent({category: "Layer", action: "Layertree category switched", name: action.payload.name});
            break;
        case "Modules/SearchBar/addLayerToTopicTree": {
            const {layerId} = action.payload;

            if (layerId !== undefined) {
                trackMatomoEvent({category: "Layer", action: "Layer added via Search", name: `${store.getters.layerConfigById(layerId)?.name} (layerId: ${layerId})`});
            }
            break;
        }
        case "Modules/LayerSelection/changeVisibility":
            if (action.payload.value) {
                const {layerId} = action.payload;

                if (layerId !== undefined) {
                    trackMatomoEvent({category: "Layer", action: "Layer added via layertree", name: `${store.getters.layerConfigById(layerId)?.name} (layerId: ${layerId})`});
                }
            }

            break;
        case "Maps/changeMapMode":
            trackMatomoEvent({category: "MapMode", action: "Mapmode switched", name: `Mapmode switched to ${action.payload}`});
            break;
        case "Menu/changeCurrentComponent": {
            const {type, props} = action.payload;

            if (props !== undefined && type !== "getFeatureInfo" && type !== "searchBar" && type !== "layerSelection") {
                trackMatomoEvent({category: "Menu", action: "Menuitem clicked", name: props.name});
            }

            break;
        }
        case "Modules/Print/createPrintJob": {
            const printPayload = action.payload?.payload;

            if (printPayload) {
                trackMatomoEvent({category: "Print", action: `${printPayload.attributes?.is3dMode ? "3D" : "2D"} printjob created `, name: `Layout: ${printPayload.layout}`});
            }

            break;
        }
        default:
            break;
    }
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
export function trackMatomoEvent ({category, action, name, value}) {
    if (typeof Config === "undefined" || !Config.userTracking?.matomo) {
        return;
    }

    if (window._paq) {
        window._paq.push(["trackEvent", category, action, name, value]);
    }
    else {
        console.warn(`window._paq is not defined -> event {category: "${category}", action: "${action}", name: "${name}", value: "${value}"} is omitted.`);
    }
}
