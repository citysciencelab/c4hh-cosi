
import {unpackCluster} from "./features/unpackCluster";
import store from "../../../src/app-store";

/**
 * Highlights a feature on the map
 * @param {*} payload - the payload of the store action, Maps/highlightFeature
 * @returns {void}
 */
function highlightFeature (payload) {
    store.dispatch("Maps/highlightFeature", payload);
}

/**
 * Highlights a feature or a cluster of features
 * @param {module:ol/feature} feature the feature to highlight
 * @param {String} layerId the ID of the layer the feature belongs to
 * @returns {void}
 */
export default function highlightVectorFeature (feature, layerId) {
    const _feature = unpackCluster(feature)[0],
        geomType = _feature.getGeometry()?.getType();

    if (geomType === "Point") {
        highlightFeature({
            id: _feature.getId(),
            type: "increase",
            scale: 1.4,
            layer: {id: layerId}
        });
    }
    else if (geomType === "Polygon" || geomType === "MultiPolygon") {
        highlightFeature({
            feature: _feature,
            type: "highlightPolygon",
            highlightStyle: {
                stroke: {color: "#F0E455", width: 5}
            },
            layer: {id: layerId}
        });
    }
}
