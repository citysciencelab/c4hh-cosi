import store from "../../../../src/app-store/index.js";
/**
 * Registers the Observer.
 * @param {Object} vueStore The store from the component.
 * @returns {void}
 */
export function register (vueStore) {
    vueStore.dispatch("Modules/SessionTool/register", {key: "DrawTool", getter: getCurrentStateOfDraw, setter: setDrawState});
}

/**
 * Gets the current extent of the map.
 * @returns {Object} an object which holds the draw state
 */
async function getCurrentStateOfDraw () {
    let draw;

    try {
        await store.dispatch("Modules/Draw_old/setDownloadSelectedFormat", "GEOJSON");
    }
    catch (error) {
        console.warn("No draw layer available for export - step will be skipped");
        return {draw};
    }
    try {
        draw = JSON.parse(store.getters["Modules/Draw_old/download"].dataString);
    }
    catch (error) {
        console.warn("jsonParse failed: could not parse\"" + draw + "\" to JSON: " + error);
    }

    return {
        draw
    };
}

/**
 * Sets the current extent of the map.
 * @param {Object} payload the payload
 * @returns {void}
 */
async function setDrawState (payload) {
    if (!Array.isArray(payload?.draw?.features) || !payload?.draw?.features?.length) {
        return;
    }

    store.dispatch("Modules/FileImport/addLayerConfig").then(layer => {
        store.dispatch("Modules/FileImport/importGeoJSON", {raw: JSON.stringify(payload.draw), layer: layer.layer, filename: "draw.geojson"});
    });
}
