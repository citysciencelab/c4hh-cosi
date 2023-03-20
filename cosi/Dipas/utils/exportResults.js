import {featuresToGeoJsonCollection} from "../../utils/features/convertToGeoJson";
import {downloadJsonToFile} from "../../utils/download";
import store from "../../../../src/app-store";

/**
 * Gets the map's CRS from the app-store
 * @returns {String} the map's current CRS code
 */
function getPortalCrs () {
    return store.getters["Maps/projectionCode"];
}

/**
 * Exports the layers of DIPAS as geojson
 * @param {Array} layers - an array of layers to export
 * @returns {void}
 */
export function exportAsGeoJson (layers) {
    const projectionCode = getPortalCrs();

    for (const layer of layers) {
        const featureCollection = featuresToGeoJsonCollection(layer.getSource().getFeatures(), false, projectionCode);

        downloadJsonToFile(featureCollection, "DIPAS_" + layer.values_.id + ".geojson");
    }
}
